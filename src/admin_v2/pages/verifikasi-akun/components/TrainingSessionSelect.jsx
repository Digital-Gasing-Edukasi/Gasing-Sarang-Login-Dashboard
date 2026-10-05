import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchTrainingSessions,
  trainingSessionsKeys,
} from "../../../lib/api/index.js";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue.js";
import { SearchSelect } from "../../../components/ui/search-select.jsx";

// Server-searchable training session dropdown (searches by name).
export function TrainingSessionSelect({ value, onValueChange }) {
  const [keyword, setKeyword] = useState("");
  const debouncedKeyword = useDebouncedValue(keyword, 400);

  const { data, isFetching } = useQuery({
    queryKey: trainingSessionsKeys.page(1, { limit: 100, keyword: debouncedKeyword }),
    queryFn: () =>
      fetchTrainingSessions({ page: 1, limit: 100, keyword: debouncedKeyword }),
    staleTime: 30_000,
  });

  const options = (data?.data ?? []).map((session) => ({
    value: session.id,
    label: session.name,
  }));

  return (
    <SearchSelect
      options={options}
      value={value}
      onValueChange={onValueChange}
      onSearchChange={setKeyword}
      loading={isFetching}
      placeholder="Pilih pelatihan…"
      searchPlaceholder="Ketik nama pelatihan…"
      emptyText="Tidak ada pelatihan yang cocok."
    />
  );
}
