import { create } from "zustand";
import type { FocusMode, OverlayMode, RepoProfile, UiMode } from "../types/profile";

type ExplorerState = {
  profile?: RepoProfile;
  mode: UiMode;
  focus: FocusMode;
  overlay: OverlayMode;
  query: string;
  selectedId?: string;
  tourOpen: boolean;
  tourIndex: number;
  traversalPlaying: boolean;
  hideLowSignal: boolean;
  setProfile(profile: RepoProfile): void;
  setMode(mode: UiMode): void;
  setFocus(focus: FocusMode): void;
  setOverlay(overlay: OverlayMode): void;
  setQuery(query: string): void;
  select(id: string | undefined): void;
  startTour(): void;
  closeTour(): void;
  nextTour(): void;
  previousTour(): void;
  setTourIndex(index: number): void;
  setTraversalPlaying(playing: boolean): void;
  toggleLowSignal(): void;
};

export const useExplorerStore = create<ExplorerState>((set, get) => ({
  mode: "runtime",
  focus: "all",
  overlay: "importance",
  query: "",
  tourOpen: false,
  tourIndex: 0,
  traversalPlaying: false,
  hideLowSignal: true,
  setProfile: (profile) => set({ profile, selectedId: profile.architectureGraph.nodes[0]?.id }),
  setMode: (mode) => set({ mode, traversalPlaying: mode === "runtime" ? get().traversalPlaying : false }),
  setFocus: (focus) => set({ focus }),
  setOverlay: (overlay) => set({ overlay }),
  setQuery: (query) => set({ query }),
  select: (selectedId) => set({ selectedId }),
  startTour: () => set({ tourOpen: true, tourIndex: 0, traversalPlaying: true, mode: "runtime" }),
  closeTour: () => set({ tourOpen: false, traversalPlaying: false }),
  nextTour: () => set({ tourIndex: Math.min(get().tourIndex + 1, 8) }),
  previousTour: () => set({ tourIndex: Math.max(get().tourIndex - 1, 0) }),
  setTourIndex: (tourIndex) => set({ tourIndex }),
  setTraversalPlaying: (traversalPlaying) => set({ traversalPlaying }),
  toggleLowSignal: () => set({ hideLowSignal: !get().hideLowSignal }),
}));
