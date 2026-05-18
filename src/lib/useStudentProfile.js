import { useState, useEffect, useCallback } from 'react';
import { getOrCreateProfile, getStreak, getActivityStats } from './gamification';

/**
 * Custom hook to manage the current student profile.
 * Uses localStorage as the primary source of truth for the profile,
 * and Supabase for streak + activity stats.
 */
export function useStudentProfile() {
  const [profile, setProfile] = useState(() => {
    // Hydrate immediately from localStorage cache to avoid flash
    try {
      const cached = localStorage.getItem('edu_ai_profile');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [streak, setStreak]             = useState(null);
  const [stats, setStats]               = useState(null);
  const [loading, setLoading]           = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const fetchRemoteData = useCallback(async (userId) => {
    if (!userId) return;
    const [streakData, statsData] = await Promise.all([
      getStreak(userId),
      getActivityStats(userId),
    ]);
    setStreak(streakData);
    setStats(statsData);
  }, []);

  useEffect(() => {
    const init = async () => {
      const userId = localStorage.getItem('edu_ai_user_id');

      if (!userId) {
        setNeedsOnboarding(true);
        setLoading(false);
        return;
      }

      // Profile is already hydrated from localStorage in the useState initializer.
      // Just fetch live Supabase data.
      await fetchRemoteData(userId);
      setLoading(false);
    };
    init();
  }, [fetchRemoteData]);

  const createProfile = useCallback(async ({ name, avatar }) => {
    setLoading(true);
    const created = await getOrCreateProfile({ name, avatar, gradeGroup: '1-4' });
    if (created) {
      setProfile(created);
      localStorage.setItem('edu_ai_profile', JSON.stringify(created));
      await fetchRemoteData(created.id);
      setNeedsOnboarding(false);
    }
    setLoading(false);
    return created;
  }, [fetchRemoteData]);

  const refetch = useCallback(async () => {
    const userId = localStorage.getItem('edu_ai_user_id');
    if (userId) await fetchRemoteData(userId);
  }, [fetchRemoteData]);

  return { profile, streak, stats, loading, needsOnboarding, createProfile, refetch };
}

/** Returns just the stored userId from localStorage */
export function getStoredUserId() {
  return localStorage.getItem('edu_ai_user_id');
}
