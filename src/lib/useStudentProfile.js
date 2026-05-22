import { useState, useEffect, useCallback } from 'react';
import { getAuthSessionUser, getOrCreateProfile, fetchProfileByUserId } from './auth';
import { getStreak, getActivityStats, updateStreak, getProfileId } from './gamification';

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
      let authUserId = localStorage.getItem('edu_ai_user_id');

      if (!authUserId) {
        const authUser = await getAuthSessionUser();
        authUserId = authUser?.id || null;
        if (authUserId) {
          localStorage.setItem('edu_ai_user_id', authUserId);
        }
      }

      if (!authUserId) {
        setNeedsOnboarding(true);
        setLoading(false);
        return;
      }

      // Fetch the latest profile row from the database to ensure we have the correct profiles.id (auto-UUID)
      let dbProfile = null;
      try {
        dbProfile = await fetchProfileByUserId(authUserId);
        if (dbProfile) {
          localStorage.setItem('edu_ai_profile', JSON.stringify(dbProfile));
          setProfile(dbProfile);
        }
      } catch (err) {
        console.warn('Failed to refresh profile from database on init:', err);
      }

      // Fallback to cached profile if DB query failed (e.g. offline)
      // Guard: only use the cached id if it differs from authUserId.
      // If they are equal, the cache is stale and using it would cause a
      // user_streaks FK violation (profiles.id ≠ auth.users.id).
      let profileId = dbProfile?.id || null;
      if (!profileId) {
        try {
          const cached = localStorage.getItem('edu_ai_profile');
          if (cached) {
            const cachedId = JSON.parse(cached)?.id || null;
            // Only trust the cached id if it is NOT the auth user ID
            if (cachedId && cachedId !== authUserId) {
              profileId = cachedId;
            }
          }
        } catch { /* ignore */ }
      }

      if (profileId) {
        try {
          await updateStreak(profileId);
        } catch (err) {
          console.warn('Auto streak update failed on load:', err);
        }
        await fetchRemoteData(profileId);
      } else {
        // If we still don't have a profileId, the user needs to complete onboarding
        setNeedsOnboarding(true);
      }

      setLoading(false);
    };
    init();
  }, [fetchRemoteData]);

  const createProfile = useCallback(async ({ name, avatar, gradeGroup = '1-4', password = null }) => {
    setLoading(true);
    const created = await getOrCreateProfile({ name, avatar, gradeGroup, password });
    if (created) {
      setProfile(created);
      localStorage.setItem('edu_ai_profile', JSON.stringify(created));
      // created.id = profiles.id (auto-UUID), used by user_streaks & activity_logs
      await fetchRemoteData(created.id);
      setNeedsOnboarding(false);
    }
    setLoading(false);
    return created;
  }, [fetchRemoteData]);

  const refetch = useCallback(async () => {
    const profileId = getProfileId();
    if (profileId) await fetchRemoteData(profileId);
  }, [fetchRemoteData]);

  return { profile, streak, stats, loading, needsOnboarding, createProfile, refetch };
}

/**
 * Returns profiles.id (auto-UUID) — use this for gamification, badges,
 * activity_logs, notebook_notes, chat_sessions, user_streaks queries.
 * All those tables have user_id FK → profiles.id.
 */
export function getStoredUserId() {
  try {
    const raw = localStorage.getItem('edu_ai_profile');
    return raw ? JSON.parse(raw)?.id ?? null : null;
  } catch {
    return null;
  }
}

/**
 * Returns the Supabase auth user ID (auth.users.id).
 * Use this only for auth-level checks (session, route guards, profile lookup).
 */
export function getAuthUserId() {
  return localStorage.getItem('edu_ai_user_id');
}
