import { create } from "zustand";
import type { FocusMode, RepoProfile, UiMode } from "../types/profile";

type ExplorerState = {
  profile?: RepoProfile;
  mode: UiMode;
  focus: FocusMode;
  query: string;
  selectedId?: string;
  tourOpen: boolean;
  tourIndex: number;
  setProfile(profile: RepoProfile): void;
  setMode(mode: UiMode): void;
  setFocus(focus: FocusMode): void;
  setQuery(query: string): void;
  select(id: string | undefined): void;
  startTour(): void;
  closeTour(): void;
  nextTour(): void;
  previousTour(): void;
};

export const useExplorerStore = create<ExplorerState>((set, get) => ({
  mode: "runtime",
  focus: "all",
  query: "",
  tourOpen: false,
  tourIndex: 0,
  setProfile: (profile) => set({ profile, selectedId: profile.architectureGraph.nodes[0]?.id }),
  setMode: (mode) => set({ mode }),
  setFocus: (focus) => set({ focus }),
  setQuery: (query) => set({ query }),
  select: (selectedId) => set({ selectedId }),
  startTour: () => set({ tourOpen: true, tourIndex: 0 }),
  closeTour: () => set({ tourOpen: false }),
  nextTour: () => set({ tourIndex: Math.min(get().tourIndex + 1, 8) }),
  previousTour: () => set({ tourIndex: Math.max(get().tourIndex - 1, 0) }),
}));
