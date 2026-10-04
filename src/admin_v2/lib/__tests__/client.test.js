import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  ApiError,
  apiGet,
  apiPost,
  apiPatch,
  apiDelete,
} from "../api/client.js";
import { adminV2Tokens } from "../api/tokens.js";

const jsonRes = (data, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  headers: new Headers(),
  json: async () => data,
});

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  adminV2Tokens.setTokens("access-123", "refresh-123", true);
  global.fetch = vi.fn(async () => jsonRes({ ok: true }));
});

describe("admin_v2 api client", () => {
  it("GET sends Bearer token and bracket query params", async () => {
    const data = await apiGet("/admin/users", {
      page: 1,
      limit: 20,
      "filter[verifiedStatus]": "waiting",
      "sort[by]": "createdAt",
      "sort[order]": "desc",
    });

    expect(data).toEqual({ ok: true });
    const [url, init] = global.fetch.mock.calls[0];
    expect(url).toContain("/admin/users?");
    expect(url).toContain("filter%5BverifiedStatus%5D=waiting");
    expect(init.headers.Authorization).toBe("Bearer access-123");
  });

  it("POST/PATCH/DELETE send method + JSON body", async () => {
    await apiPost("/x", { a: 1 });
    await apiPatch("/x/1", { b: 2 });
    await apiDelete("/x/1");

    const [, postInit] = global.fetch.mock.calls[0];
    expect(postInit.method).toBe("POST");
    expect(postInit.body).toBe(JSON.stringify({ a: 1 }));
    expect(postInit.headers["Content-Type"]).toBe("application/json");

    expect(global.fetch.mock.calls[1][1].method).toBe("PATCH");
    expect(global.fetch.mock.calls[2][1].method).toBe("DELETE");
  });

  it("error response throws ApiError with status + data", async () => {
    global.fetch.mockResolvedValueOnce(
      jsonRes({ message: "Forbidden" }, 403),
    );

    const err = await apiGet("/admin/users").catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(403);
    expect(err.message).toBe("Forbidden");
  });

  it("401 refreshes once then retries with the new token", async () => {
    global.fetch
      .mockResolvedValueOnce(jsonRes({ message: "expired" }, 401))
      .mockResolvedValueOnce(jsonRes({ accessToken: "new-access" }, 200))
      .mockResolvedValueOnce(jsonRes({ data: [], meta: {} }, 200));

    const data = await apiGet("/admin/users");

    expect(data).toEqual({ data: [], meta: {} });
    expect(global.fetch).toHaveBeenCalledTimes(3);
    const [, refreshInit] = global.fetch.mock.calls[1];
    expect(refreshInit.body).toBe(JSON.stringify({ refreshToken: "refresh-123" }));
    expect(localStorage.getItem("accessToken")).toBe("new-access");
    const [, retryInit] = global.fetch.mock.calls[2];
    expect(retryInit.headers.Authorization).toBe("Bearer new-access");
  });

  it("failed refresh clears tokens", async () => {
    global.fetch
      .mockResolvedValueOnce(jsonRes({ message: "expired" }, 401))
      .mockResolvedValueOnce(jsonRes({ message: "invalid" }, 401));

    await apiGet("/admin/users").catch(() => {});

    expect(localStorage.getItem("accessToken")).toBeNull();
    expect(localStorage.getItem("refreshToken")).toBeNull();
  });
});
