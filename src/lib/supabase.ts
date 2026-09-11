import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Project, Update } from '../types';
import {
  getLocalProjects,
  getLocalUpdates,
  saveLocalUpdate,
  deleteLocalUpdate,
} from './mockData';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verify whether Supabase credentials are genuinely configured
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabasePublishableKey &&
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('your-project-id')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabasePublishableKey!)
  : null;

/**
 * Fetch all active projects
 */
export async function fetchProjects(): Promise<Project[]> {
  if (!isSupabaseConfigured || !supabase) {
    // Graceful offline demo mode
    return getLocalProjects();
  }

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Supabase fetchProjects error:', error);
    throw new Error(`Failed to load projects from Supabase: ${error.message}`);
  }

  return (data || []).map((p) => ({
    ...p,
    // Ensure contributors is an array
    contributors: Array.isArray(p.contributors) ? p.contributors : JSON.parse(p.contributors || '[]'),
  }));
}

/**
 * Fetch all updates across all projects (for overview pulse & momentum calculations)
 */
export async function fetchAllUpdates(): Promise<Update[]> {
  if (!isSupabaseConfigured || !supabase) {
    return getLocalUpdates();
  }

  const { data, error } = await supabase
    .from('updates')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Supabase fetchAllUpdates error:', error);
    throw new Error(`Failed to fetch updates from Supabase: ${error.message}`);
  }

  return data || [];
}

/**
 * Fetch updates for a specific project
 */
export async function fetchProjectUpdates(projectId: string): Promise<Update[]> {
  if (!isSupabaseConfigured || !supabase) {
    return getLocalUpdates(projectId);
  }

  const { data, error } = await supabase
    .from('updates')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Supabase fetchProjectUpdates error:', error);
    throw new Error(`Failed to fetch project updates: ${error.message}`);
  }

  return data || [];
}

/**
 * Publish a new progress update row into the `updates` table.
 * Attaches the authenticated user's ID as author_id for RLS enforcement.
 */
export async function publishProjectUpdate(
  projectId: string,
  contributorName: string,
  content: string
): Promise<Update> {
  const trimmed = content.trim();
  if (!trimmed) {
    throw new Error('Update content cannot be empty.');
  }

  if (!isSupabaseConfigured || !supabase) {
    return saveLocalUpdate(projectId, contributorName, trimmed);
  }

  // Get current authenticated user ID
  const { data: sessionData } = await supabase.auth.getSession();
  const authorId = sessionData?.session?.user?.id;
  if (!authorId) {
    throw new Error('Authorization required: You must authorize as an operator before publishing.');
  }

  const { data, error } = await supabase
    .from('updates')
    .insert([
      {
        project_id: projectId,
        author_id: authorId,
        contributor_name: contributorName,
        content: trimmed,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Supabase publishProjectUpdate error:', error);
    throw new Error(`Database error publishing update: ${error.message}`);
  }

  return data;
}

/**
 * Delete an observation update row from `updates`.
 * RLS enforces author_id = auth.uid() and created_at > now() - 30 minutes.
 */
export async function deleteProjectUpdate(updateId: string, operatorName?: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    deleteLocalUpdate(updateId, operatorName || '');
    return;
  }

  const { error } = await supabase
    .from('updates')
    .delete()
    .eq('id', updateId);

  if (error) {
    console.error('Supabase deleteProjectUpdate error:', error);
    throw new Error(`Database error deleting update: ${error.message}`);
  }
}
