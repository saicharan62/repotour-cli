import type { RepoProfile as EngineRepoProfile } from "../../../src/types";

export type RepoProfile = EngineRepoProfile;
export type UiMode = "runtime" | "package" | "learning" | "hotspot";
export type FocusMode = "all" | "runtime" | "entrypoint" | "low";
export type OverlayMode = "importance" | "churn" | "centrality" | "onboarding";
