import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { abbrevRegion } from "@/lib/format";

const rawOptions = [
  { id: "1", name: "Kabupaten Bogor" },
  { id: "2", name: "Kota Bandung" },
  { id: "3", name: "Kabupaten Sleman" },
];

const options = rawOptions.map((o) => ({
  value: o.id,
  label: abbrevRegion(o.name),
}));

// vitest.setup.js men-stub matchMedia dengan matches:false → path desktop
// (query "(max-width: 1023px)" dianggap tidak match).

describe("SearchableSelect", () => {
  it("renders options with abbrevRegion-formatted labels", () => {
    render(
      <SearchableSelect
        value=""
        onValueChange={() => {}}
        options={options}
        placeholder="Pilih Daerah"
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /pilih daerah/i }));

    expect(screen.getByRole("option", { name: "KAB. BOGOR" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "KOTA BANDUNG" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "KAB. SLEMAN" })).toBeInTheDocument();
  });

  it("filters the visible list as the user types (desktop path)", () => {
    render(
      <SearchableSelect
        value=""
        onValueChange={() => {}}
        options={options}
        placeholder="Pilih Daerah"
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /pilih daerah/i }));

    const search = screen.getByPlaceholderText("Cari...");
    fireEvent.change(search, { target: { value: "bogor" } });

    expect(screen.getByRole("option", { name: "KAB. BOGOR" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "KOTA BANDUNG" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "KAB. SLEMAN" })).not.toBeInTheDocument();
  });

  it("calls onValueChange with the picked option's value and closes", () => {
    const onValueChange = vi.fn();
    render(
      <SearchableSelect
        value=""
        onValueChange={onValueChange}
        options={options}
        placeholder="Pilih Daerah"
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /pilih daerah/i }));
    fireEvent.click(screen.getByRole("option", { name: "KOTA BANDUNG" }));

    expect(onValueChange).toHaveBeenCalledWith("2");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("shows the selected option's label on the trigger", () => {
    render(
      <SearchableSelect
        value="3"
        onValueChange={() => {}}
        options={options}
        placeholder="Pilih Daerah"
      />
    );
    expect(screen.getByRole("button", { name: "KAB. SLEMAN" })).toBeInTheDocument();
  });
});
