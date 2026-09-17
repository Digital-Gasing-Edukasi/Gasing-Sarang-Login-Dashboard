// src/lib/api/skills.js — skill user + endorsement.
import { request } from "./client.js";

// ─── SKILLS & ENDORSEMENTS ──────────────────────────────────────────────────────
export const skillsApi = {
  getUserSkills: (username) => request(`/users/${username}/skills`),

  // Toggles endorsement of `skillId` for the skill owner identified by `userId`.
  toggleEndorse: (skillId, userId) =>
    request(`/skills/${skillId}/endorse`, {
      method: "POST",
      body: { user_id: userId },
    }),
};
