import { BookOpen, Building2, Presentation, Sparkles } from "lucide-react";

// Canonical discourse groups, keyed by group id (cf. dev/responses/roles.json).
// Look users up by `discourseGroupId` — never by name.
export const ROLE_META_BY_ID = {
  46: { fullName: "Trainer Utama", Icon: Sparkles, color: "#2563EB" },
  75: { fullName: "Trainer Aula", Icon: Building2, color: "#16A34A" },
  48: { fullName: "Trainer Kelas", Icon: Presentation, color: "#F97316" },
  49: { fullName: "Guru", Icon: BookOpen, color: "#7C3AED" },
};

export function getRoleMeta(groupId) {
  if (groupId === undefined || groupId === null) return null;
  return ROLE_META_BY_ID[groupId] ?? null;
}
