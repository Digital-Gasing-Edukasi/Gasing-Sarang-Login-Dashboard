import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { pathForPage } from "@/lib/routes";

// Shim: halaman-halaman masih memanggil `onNavigate("<page-key>", state?)`.
// Terjemahkan page key → URL supaya file page tidak perlu diubah.
export function useAppNavigation() {
  const navigate = useNavigate();
  const go = useCallback(
    (key, state) => navigate(pathForPage(key), state ? { state } : undefined),
    [navigate],
  );
  return { navigate, go };
}
