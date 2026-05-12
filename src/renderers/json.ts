import type { RepoProfile } from "../types.js";

export function renderJson(profile: RepoProfile): string {
  return `${JSON.stringify(profile, null, 2)}\n`;
}
