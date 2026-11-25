import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { DataTable } from "../components/DataTable.jsx";

const columns = [
  { key: "a", header: "Kolom A", render: (r) => r.a },
  { key: "b", header: "Kolom B", render: (r) => r.b },
];

describe("DataTable empty state", () => {
  it("omits the body and renders the message below the table", () => {
    const { container } = render(
      <DataTable columns={columns} rows={[]} keyOf={(r) => r.a} emptyText="Kosong." />,
    );

    // Headers stay for context…
    expect(screen.getByText("Kolom A")).toBeInTheDocument();
    // …but no body cells exist, so nothing forces a horizontal scroll…
    expect(container.querySelector("tbody")).toBeNull();
    // …and the message sits outside the scroll container.
    const message = screen.getByText("Kosong.");
    expect(message.closest(".overflow-x-auto")).toBeNull();
    expect(
      within(message.parentElement).getByText("Kolom A"),
    ).toBeInTheDocument();
  });

  it("renders rows with a body as before", () => {
    const { container } = render(
      <DataTable
        columns={columns}
        rows={[{ a: "1", b: "2" }]}
        keyOf={(r) => r.a}
      />,
    );

    expect(container.querySelector("tbody")).not.toBeNull();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("shows a new badge for rows updated within the last three days", () => {
    render(
      <DataTable
        columns={columns}
        rows={[
          {
            a: "recent",
            b: "value",
            updated_at: { unix: Math.floor(Date.now() / 1000) - 60 },
          },
        ]}
        keyOf={(r) => r.a}
      />,
    );

    expect(screen.getByText("new")).toHaveClass("rounded-full", "bg-blue-600", "text-white");
  });

  it("does not show a new badge for rows updated three or more days ago", () => {
    render(
      <DataTable
        columns={columns}
        rows={[
          {
            a: "old",
            b: "value",
            updatedAt: {
              unix: Math.floor(Date.now() / 1000) - 3 * 24 * 60 * 60,
            },
          },
        ]}
        keyOf={(r) => r.a}
      />,
    );

    expect(screen.queryByText("new")).not.toBeInTheDocument();
  });

  it("supports a vertically scrollable table with a sticky header", () => {
    const { container } = render(
      <DataTable
        columns={columns}
        rows={[{ a: "1", b: "2" }]}
        keyOf={(r) => r.a}
        scrollable
        stickyHeader
      />,
    );

    expect(container.querySelector(".overflow-auto")).toHaveClass("flex-1");
    expect(screen.getByText("Kolom A").closest("th")).toHaveClass("sticky", "top-0");
  });
});
