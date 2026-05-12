import { useEffect } from "react";
import { AppLayout } from "./layouts/AppLayout";
import { useRepoProfile } from "./hooks/useRepoProfile";
import { useExplorerStore } from "./state/explorerStore";

export function App() {
  const { profile, error } = useRepoProfile();
  const setProfile = useExplorerStore((state) => state.setProfile);

  useEffect(() => {
    if (profile) setProfile(profile);
  }, [profile, setProfile]);

  if (error) return <div className="p-6 text-red-700">{error}</div>;
  if (!profile) return <div className="p-6 text-muted">Loading repository profile...</div>;
  return <AppLayout />;
}
