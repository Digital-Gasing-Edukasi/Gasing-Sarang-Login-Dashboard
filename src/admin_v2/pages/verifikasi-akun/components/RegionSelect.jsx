import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  REGION_CACHE,
  fetchProvinces,
  fetchRegencies,
  fetchRegion,
  regionLabel,
  regionsKeys,
} from "../../../lib/api/index.js";
import { Label } from "../../../components/ui/label.jsx";
import { SearchSelect } from "../../../components/ui/search-select.jsx";

// Client-side filter; the selected option always stays visible.
function filterOptions(search, options, selected) {
  const query = search.trim().toLowerCase();
  const filtered = query
    ? options.filter((o) => o.label.toLowerCase().includes(query))
    : options;
  if (selected?.value && !filtered.some((o) => o.value === selected.value)) {
    return selected.label ? [selected, ...filtered] : filtered;
  }
  return filtered;
}

// Province → regency cascading picker. `value` is the regency id; the province
// is derived from it (kept in sync when the admin switches province).
export function RegionSelect({ value, initialLabel, onValueChange, disabled }) {
  const [chosenProvinceId, setChosenProvinceId] = useState("");
  const [provinceSearch, setProvinceSearch] = useState("");
  const [regencySearch, setRegencySearch] = useState("");

  const { data: provinces = [] } = useQuery({
    queryKey: regionsKeys.provinces,
    queryFn: fetchProvinces,
    ...REGION_CACHE,
  });

  // Only needed to seed the province from a pre-selected regency.
  const { data: detail } = useQuery({
    queryKey: regionsKeys.byId(value),
    queryFn: () => fetchRegion(value),
    enabled: !!value && !chosenProvinceId,
    ...REGION_CACHE,
  });

  const provinceId = chosenProvinceId || detail?.parentId || "";

  const { data: regencies = [], isFetching } = useQuery({
    queryKey: regionsKeys.regencies(provinceId),
    queryFn: () => fetchRegencies(provinceId),
    enabled: !!provinceId,
    ...REGION_CACHE,
  });

  const provinceOptions = provinces.map((p) => ({
    value: p.id,
    label: regionLabel(p),
  }));
  const regencyOptions = regencies.map((r) => ({
    value: r.id,
    label: regionLabel(r),
  }));

  const selectedProvince = provinceOptions.find((o) => o.value === provinceId);
  const selectedRegency = {
    value,
    label:
      regionLabel(regencies.find((r) => r.id === value)) ||
      (value ? initialLabel || "" : ""),
  };

  const handleProvinceChange = (next) => {
    setChosenProvinceId(next);
    setRegencySearch("");
    onValueChange?.("");
  };

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="space-y-2">
        <Label>Provinsi</Label>
        <SearchSelect
          options={filterOptions(provinceSearch, provinceOptions, selectedProvince)}
          value={provinceId}
          onValueChange={handleProvinceChange}
          onSearchChange={setProvinceSearch}
          placeholder="Pilih provinsi…"
          searchPlaceholder="Ketik nama provinsi…"
          emptyText="Provinsi tidak ditemukan."
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <Label>Kabupaten/Kota</Label>
        <SearchSelect
          options={filterOptions(regencySearch, regencyOptions, selectedRegency)}
          value={value}
          onValueChange={onValueChange}
          onSearchChange={setRegencySearch}
          loading={isFetching}
          placeholder={provinceId ? "Pilih kabupaten/kota…" : "Pilih provinsi dulu…"}
          searchPlaceholder="Ketik nama kabupaten/kota…"
          emptyText="Kabupaten/kota tidak ditemukan."
          disabled={disabled || !provinceId}
        />
      </div>
    </div>
  );
}
