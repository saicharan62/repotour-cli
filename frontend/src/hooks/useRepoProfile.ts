import { useEffect, useState } from "react";
import type { RepoProfile } from "../types/profile";

const apiUrl = import.meta.env.VITE_REPOTOUR_API_URL ?? "/api/profile";

export function useRepoProfile() {
  const [profile, setProfile] = useState<RepoProfile>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    let cancelled = false;
    fetch(apiUrl)
      .then((response) => {
        if (!response.ok) throw new Error(`Profile request failed: ${response.status}`);
        return response.json() as Promise<RepoProfile>;
      })
      .then((nextProfile) => {
        if (!cancelled) setProfile(nextProfile);
      })
      .catch((nextError: unknown) => {
        if (!cancelled) setError(nextError instanceof Error ? nextError.message : String(nextError));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { profile, error };
}
