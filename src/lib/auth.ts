import type { OperatorSession } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';

const DEMO_OPERATOR_KEY = 'project_tracker_demo_active_operator';
const DEMO_PASSWORD = 'demo123';

/**
 * Convert user-facing contributor username to synthetic internal email
 * (e.g., 'metastab' -> 'metastab@contributors.internal')
 */
export function toInternalEmail(contributorName: string): string {
  return `${contributorName.trim().toLowerCase()}@contributors.internal`;
}

/**
 * Extract contributor name from internal email
 */
export function fromInternalEmail(email?: string | null): string | null {
  if (!email) return null;
  const atIndex = email.indexOf('@');
  if (atIndex <= 0) return null;
  return email.substring(0, atIndex);
}

/**
 * Non-destructive operator authentication.
 * If authentication fails, the current session is strictly preserved.
 */
export async function authenticateOperator(
  targetContributor: string,
  password: string
): Promise<OperatorSession> {
  const cleanTarget = targetContributor.trim().toLowerCase();

  // 1. Live Supabase Authentication
  if (isSupabaseConfigured && supabase) {
    const internalEmail = toInternalEmail(cleanTarget);
    
    // Attempt sign-in with password for target contributor
    const { data, error } = await supabase.auth.signInWithPassword({
      email: internalEmail,
      password,
    });

    if (error) {
      // Current session is preserved by Supabase if signInWithPassword fails
      throw new Error(`Authentication failed for operator [${targetContributor}]: ${error.message}`);
    }

    if (!data.user) {
      throw new Error('No user data returned from authentication service.');
    }

    const derivedName = fromInternalEmail(data.user.email) || cleanTarget;

    return {
      contributorName: derivedName,
      userId: data.user.id,
      email: data.user.email,
      isDemo: false,
    };
  }

  // 2. Offline Demo Mode Simulation
  const storedDemoPw = localStorage.getItem(`project_tracker_demo_pw_${cleanTarget}`);
  const expectedPw = storedDemoPw || DEMO_PASSWORD;

  if (password !== expectedPw && password !== `${cleanTarget}123`) {
    throw new Error(`Access denied for [${targetContributor}]. (Offline Demo hint: use ${expectedPw})`);
  }

  const demoSession: OperatorSession = {
    contributorName: cleanTarget,
    isDemo: true,
  };

  try {
    localStorage.setItem(DEMO_OPERATOR_KEY, JSON.stringify(demoSession));
  } catch {
    // Ignore localStorage write failures
  }

  return demoSession;
}

/**
 * Update operator password in the database.
 * Re-verifies old password before updating to new password.
 */
export async function updateContributorPassword(
  contributorName: string,
  oldPassword: string,
  newPassword: string
): Promise<void> {
  const cleanName = contributorName.trim().toLowerCase();

  if (!oldPassword.trim() || !newPassword.trim()) {
    throw new Error('Both current and new passwords are required.');
  }

  if (newPassword.length < 6) {
    throw new Error('New password must be at least 6 characters.');
  }

  if (isSupabaseConfigured && supabase) {
    const internalEmail = toInternalEmail(cleanName);

    // 1. Verify current password
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: internalEmail,
      password: oldPassword,
    });

    if (signInErr) {
      throw new Error(`Current password incorrect for [${contributorName}]: ${signInErr.message}`);
    }

    // 2. Update password in Supabase Auth DB
    const { error: updateErr } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateErr) {
      throw new Error(`Database error updating password: ${updateErr.message}`);
    }

    return;
  }

  // Demo mode password update
  const storedDemoPw = localStorage.getItem(`project_tracker_demo_pw_${cleanName}`);
  const expectedPw = storedDemoPw || DEMO_PASSWORD;

  if (oldPassword !== expectedPw && oldPassword !== `${cleanName}123`) {
    throw new Error(`Current password incorrect for [${contributorName}].`);
  }

  try {
    localStorage.setItem(`project_tracker_demo_pw_${cleanName}`, newPassword);
  } catch (err) {
    console.warn('Failed to write new demo password:', err);
  }
}

/**
 * Sign out current operator session
 */
export async function signOutOperator(): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out error:', error);
      throw new Error(`Failed to sign out: ${error.message}`);
    }
  } else {
    try {
      localStorage.removeItem(DEMO_OPERATOR_KEY);
    } catch {
      // Ignore
    }
  }
}

/**
 * Restore current operator session upon application launch or page refresh
 */
export async function getInitialOperator(): Promise<OperatorSession | null> {
  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      const derivedName = fromInternalEmail(data.session.user.email);
      if (derivedName) {
        return {
          contributorName: derivedName,
          userId: data.session.user.id,
          email: data.session.user.email,
          isDemo: false,
        };
      }
    }
    return null;
  }

  // Offline demo mode restore
  try {
    const raw = localStorage.getItem(DEMO_OPERATOR_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Listen to auth state changes from Supabase
 */
export function subscribeAuthState(callback: (session: OperatorSession | null) => void) {
  if (isSupabaseConfigured && supabase) {
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const derivedName = fromInternalEmail(session.user.email);
        if (derivedName) {
          callback({
            contributorName: derivedName,
            userId: session.user.id,
            email: session.user.email,
            isDemo: false,
          });
          return;
        }
      }
      callback(null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }

  return () => {};
}
