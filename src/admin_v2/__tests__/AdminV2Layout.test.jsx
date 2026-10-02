import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AdminV2Layout } from "../components/AdminV2Layout.jsx";

describe("AdminV2Layout", () => {
  it("renders all sidebar menus with icons", () => {
    render(<AdminV2Layout user={{ email: "admin@gasing.test" }} onLogout={() => {}} />);

    for (const title of [
      "Verifikasi Akun",
      "Verifikasi Pembayaran",
      "Manajemen Akun",
      "Riwayat Pelatihan",
      "Pendaftaran Trainer",
    ]) {
      expect(screen.getByRole("button", { name: title })).toBeInTheDocument();
    }
    // Branding + default content.
    expect(screen.getByText("Admin V2")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Verifikasi Akun" })).toBeInTheDocument();
  });

  it("switches content when another menu is clicked", () => {
    render(<AdminV2Layout user={{}} onLogout={() => {}} />);

    fireEvent.click(screen.getByRole("button", { name: "Manajemen Akun" }));

    expect(screen.getByRole("heading", { name: "Manajemen Akun" })).toBeInTheDocument();
  });

  it("logout button calls onLogout", () => {
    const onLogout = vi.fn();
    render(<AdminV2Layout user={{}} onLogout={onLogout} />);

    fireEvent.click(screen.getByRole("button", { name: "Logout" }));

    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});
