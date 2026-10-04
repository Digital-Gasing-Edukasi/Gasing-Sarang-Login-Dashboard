import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AdminV2Routes } from "../routes/AdminV2Routes.jsx";

const MENU_TITLES = [
  "Dashboard",
  "Verifikasi Akun",
  "Verifikasi Pembayaran",
  "Manajemen Akun",
  "Riwayat Pelatihan",
  "Pendaftaran Trainer",
];

// Mounted under /dashboard-v2/* like the real AppRoutes does — descendant
// <Routes> match against the URL remainder, not the full path.
function renderAt(path, props = {}) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/dashboard-v2/*"
          element={
            <AdminV2Routes
              user={{ email: "admin@gasing.test" }}
              onLogout={() => {}}
              {...props}
            />
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("AdminV2Routes", () => {
  it("index /dashboard-v2 renders Dashboard with all sidebar menus", async () => {
    renderAt("/dashboard-v2");

    for (const title of MENU_TITLES) {
      expect(screen.getByRole("button", { name: title })).toBeInTheDocument();
    }
    expect(screen.getByText("Admin V2")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
    // Lazy page content resolves.
    expect(
      await screen.findByText(/Ringkasan statistik/i),
    ).toBeInTheDocument();
  });

  it("sidebar click navigates to the page and updates the header", async () => {
    renderAt("/dashboard-v2");
    await screen.findByText(/Ringkasan statistik/i);

    fireEvent.click(screen.getByRole("button", { name: "Verifikasi Pembayaran" }));

    expect(
      await screen.findByRole("heading", { name: "Verifikasi Pembayaran" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/Konten Verifikasi Pembayaran/i),
    ).toBeInTheDocument();
  });

  it("deep link opens the right page directly", async () => {
    renderAt("/dashboard-v2/manajemen-akun");

    expect(screen.getByRole("heading", { name: "Manajemen Akun" })).toBeInTheDocument();
    expect(
      await screen.findByText(/Konten Manajemen Akun/i),
    ).toBeInTheDocument();
  });

  it("unknown sub-path redirects back to Dashboard", async () => {
    renderAt("/dashboard-v2/nope");

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument(),
    );
  });

  it("logout button calls onLogout", () => {
    const onLogout = vi.fn();
    renderAt("/dashboard-v2", { onLogout });

    fireEvent.click(screen.getByRole("button", { name: "Logout" }));

    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});
