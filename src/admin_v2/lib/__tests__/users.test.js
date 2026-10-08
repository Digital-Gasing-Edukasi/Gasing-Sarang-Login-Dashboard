import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../api/client.js", () => ({ apiGet: vi.fn(), apiPost: vi.fn() }));

import { apiGet, apiPost } from "../api/client.js";
import {
  fetchUsersCount,
  fetchUsers,
  requestAccountDeletion,
} from "../api/users.js";

beforeEach(() => vi.clearAllMocks());

describe("fetchUsers", () => {
  it("sends status + paging + sort params", async () => {
    apiGet.mockResolvedValue({ data: [], meta: {} });

    await fetchUsers({ status: "waiting", page: 2, limit: 50 });

    expect(apiGet).toHaveBeenCalledWith(
      "/admin/users",
      expect.objectContaining({
        page: 2,
        limit: 50,
        "filter[verifiedStatus]": "waiting",
        "filter[confirmed]": "yes",
        "sort[by]": "createdAt",
        "sort[order]": "desc",
      }),
    );
  });

  it("passes subscriptionStatus through when set", async () => {
    apiGet.mockResolvedValue({ data: [], meta: {} });

    await fetchUsers({ status: "approved", subscription: "not_subscribed" });
    expect(apiGet).toHaveBeenLastCalledWith(
      "/admin/users",
      expect.objectContaining({ "filter[subscriptionStatus]": "not_subscribed" }),
    );
  });

  it("joins a subscription array into a comma filter", async () => {
    apiGet.mockResolvedValue({ data: [], meta: {} });

    await fetchUsers({ status: "approved", subscription: ["active", "expired"] });
    expect(apiGet).toHaveBeenLastCalledWith(
      "/admin/users",
      expect.objectContaining({ "filter[subscriptionStatus]": "active,expired" }),
    );
  });

  it("defaults filter[deletionPending] and filter[suspended] to 0, passes through when set", async () => {
    apiGet.mockResolvedValue({ data: [], meta: {} });

    await fetchUsers({ status: "waiting" });
    expect(apiGet).toHaveBeenLastCalledWith(
      "/admin/users",
      expect.objectContaining({
        "filter[deletionPending]": 0,
        "filter[suspended]": 0,
      }),
    );

    await fetchUsers({ status: "waiting", deletionPending: 1, suspended: 1 });
    expect(apiGet).toHaveBeenLastCalledWith(
      "/admin/users",
      expect.objectContaining({
        "filter[deletionPending]": 1,
        "filter[suspended]": 1,
      }),
    );
  });

  it("omits status/confirmed/suspended when null or undefined", async () => {
    apiGet.mockResolvedValue({ data: [], meta: {} });

    await fetchUsers({ status: undefined, confirmed: null, suspended: null });
    const params = apiGet.mock.calls[0][1];
    expect(params["filter[verifiedStatus]"]).toBeUndefined();
    expect(params["filter[confirmed]"]).toBeNull();
    expect(params["filter[suspended]"]).toBeNull();
  });

  it("passes keyword through, undefined when blank (client omits it)", async () => {
    apiGet.mockResolvedValue({ data: [], meta: {} });

    await fetchUsers({ status: "waiting", keyword: "john" });
    expect(apiGet).toHaveBeenLastCalledWith(
      "/admin/users",
      expect.objectContaining({ "filter[keyword]": "john" }),
    );

    await fetchUsers({ status: "waiting", keyword: "" });
    expect(apiGet).toHaveBeenLastCalledWith(
      "/admin/users",
      expect.objectContaining({ "filter[keyword]": undefined }),
    );
  });
});

describe("fetchUsersCount", () => {
  it("fetches a single row (limit=1) and returns meta.total", async () => {
    apiGet.mockResolvedValue({ data: [{ id: 1 }], meta: { total: 42 } });

    await expect(fetchUsersCount("rejected")).resolves.toBe(42);
    expect(apiGet).toHaveBeenCalledWith(
      "/admin/users",
      expect.objectContaining({
        page: 1,
        limit: 1,
        "filter[verifiedStatus]": "rejected",
      }),
    );
  });

  it("missing meta → 0", async () => {
    apiGet.mockResolvedValue({ data: [] });

    await expect(fetchUsersCount("waiting")).resolves.toBe(0);
  });
});

describe("requestAccountDeletion", () => {
  it("POSTs to the deletion-request endpoint with no payload", async () => {
    apiPost.mockResolvedValue({});

    await requestAccountDeletion({ userId: "u-9" });

    expect(apiPost).toHaveBeenCalledWith("/admin/users/u-9/deletion-request");
  });
});
