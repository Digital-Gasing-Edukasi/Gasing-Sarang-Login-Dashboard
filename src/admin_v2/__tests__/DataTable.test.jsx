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
});
