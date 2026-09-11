import type { Project, Update } from '../types';

const STORAGE_KEY_PROJECTS = 'project_tracker_demo_projects';
const STORAGE_KEY_UPDATES = 'project_tracker_demo_updates';
const STORAGE_KEY_CONTRIBUTOR = 'project_tracker_active_contributor';

// Calculate relative ISO times dynamically relative to now
const now = new Date();
const minutesAgo = (m: number) => new Date(now.getTime() - m * 60 * 1000).toISOString();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600 * 1000).toISOString();
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400 * 1000).toISOString();

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-cultural',
    name: 'Cultural Heritage',
    description: "An interactive platform for exploring India's cultural heritage, traditions, art, history, and regional identity.",
    status: 'Active',
    contributors: ['metastab', 'sneha', 'shivam', 'ankit', 'rounak'],
    created_at: daysAgo(14),
  },
  {
    id: 'proj-nexus',
    name: 'Nexus Engine',
    description: 'High-throughput telemetry aggregator and distributed event routing pipeline for real-time edge devices.',
    status: 'Active',
    contributors: ['Liam', 'Elena', 'Priya', 'Marcus'],
    created_at: daysAgo(20),
  },
  {
    id: 'proj-pulse',
    name: 'Pulse CLI',
    description: 'Minimalist terminal developer tool to inspect repository activity, code metrics, and team momentum.',
    status: 'Active',
    contributors: ['metastab', 'Dev', 'Liam'],
    created_at: daysAgo(30),
  },
  {
    id: 'proj-aether',
    name: 'Aether UI',
    description: 'Zero-runtime React and CSS design system tailored for high-density developer internal tooling.',
    status: 'Review',
    contributors: ['Elena', 'Arjun', 'Sofia'],
    created_at: daysAgo(45),
  },
];

export const INITIAL_UPDATES: Update[] = [
  {
    id: 'upd-1',
    project_id: 'proj-cultural',
    contributor_name: 'metastab',
    content: 'Synchronized regional archive taxonomy with cultural metadata schema.',
    created_at: minutesAgo(22),
  },
  {
    id: 'upd-2',
    project_id: 'proj-cultural',
    contributor_name: 'sneha',
    content: 'Finished the regional content structure and 3D terrain viewer.',
    created_at: hoursAgo(3),
  },
  {
    id: 'upd-3',
    project_id: 'proj-cultural',
    contributor_name: 'shivam',
    content: 'Connected Postgres client and verified real-time query performance.',
    created_at: hoursAgo(25),
  },
  {
    id: 'upd-4',
    project_id: 'proj-cultural',
    contributor_name: 'ankit',
    content: 'Implemented audio narration controls and dynamic playback pitch.',
    created_at: daysAgo(2),
  },
  {
    id: 'upd-5',
    project_id: 'proj-cultural',
    contributor_name: 'rounak',
    content: 'Added responsive navigation drawer for tablet and mobile viewports.',
    created_at: daysAgo(5),
  },
  // Nexus Engine
  {
    id: 'upd-6',
    project_id: 'proj-nexus',
    contributor_name: 'Liam',
    content: 'Reduced edge telemetry buffering latency by 34% with zero-copy buffer pools.',
    created_at: hoursAgo(18),
  },
  {
    id: 'upd-7',
    project_id: 'proj-nexus',
    contributor_name: 'Elena',
    content: 'Added Prometheus metrics exporter endpoint for cluster load balancing.',
    created_at: daysAgo(2),
  },
  {
    id: 'upd-8',
    project_id: 'proj-nexus',
    contributor_name: 'Marcus',
    content: 'Stabilized TCP heartbeat reconnect backoff during network partitions.',
    created_at: daysAgo(4),
  },
  // Pulse CLI
  {
    id: 'upd-9',
    project_id: 'proj-pulse',
    contributor_name: 'Dev',
    content: 'Added terminal color output formatter for git momentum graph.',
    created_at: daysAgo(5),
  },
  {
    id: 'upd-10',
    project_id: 'proj-pulse',
    contributor_name: 'Liam',
    content: 'Resolved Windows PowerShell stdin buffering bug on large git log outputs.',
    created_at: daysAgo(6),
  },
  // Aether UI (Dormant)
  {
    id: 'upd-11',
    project_id: 'proj-aether',
    contributor_name: 'Sofia',
    content: 'Initial tokens definition for glassmorphism and elevated card borders.',
    created_at: daysAgo(14),
  },
];

// Helper functions for localStorage Demo mode
export function getLocalProjects(): Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROJECTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(INITIAL_PROJECTS));
      return INITIAL_PROJECTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_PROJECTS;
  }
}

export function getLocalUpdates(projectId?: string): Update[] {
  try {
    let updates: Update[];
    const raw = localStorage.getItem(STORAGE_KEY_UPDATES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_UPDATES, JSON.stringify(INITIAL_UPDATES));
      updates = INITIAL_UPDATES;
    } else {
      updates = JSON.parse(raw);
    }
    if (projectId) {
      return updates.filter((u) => u.project_id === projectId);
    }
    return updates;
  } catch {
    return projectId ? INITIAL_UPDATES.filter((u) => u.project_id === projectId) : INITIAL_UPDATES;
  }
}

export function saveLocalUpdate(projectId: string, contributorName: string, content: string): Update {
  const currentUpdates = getLocalUpdates();
  const newUpdate: Update = {
    id: 'demo-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    project_id: projectId,
    contributor_name: contributorName,
    content,
    created_at: new Date().toISOString(),
  };

  const updatedList = [newUpdate, ...currentUpdates];
  try {
    localStorage.setItem(STORAGE_KEY_UPDATES, JSON.stringify(updatedList));
  } catch (err) {
    console.warn('Failed to save to localStorage:', err);
  }
  return newUpdate;
}

export function deleteLocalUpdate(updateId: string, operatorName: string): void {
  const currentUpdates = getLocalUpdates();
  const target = currentUpdates.find((u) => u.id === updateId);
  if (!target) {
    throw new Error('Observation record not found.');
  }

  // Enforce ownership
  if (target.contributor_name.toLowerCase() !== operatorName.toLowerCase()) {
    throw new Error('Access denied: You may only delete your own observation records.');
  }

  // Enforce 30-minute window
  const ageMs = Date.now() - new Date(target.created_at).getTime();
  if (ageMs > 30 * 60 * 1000) {
    throw new Error('Observation record locked: Deletion window (30 minutes) has expired.');
  }

  const filtered = currentUpdates.filter((u) => u.id !== updateId);
  try {
    localStorage.setItem(STORAGE_KEY_UPDATES, JSON.stringify(filtered));
  } catch (err) {
    console.warn('Failed to delete from localStorage:', err);
  }
}

// Contributor Identity Persistence
export function getStoredContributor(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY_CONTRIBUTOR);
  } catch {
    return null;
  }
}

export function setStoredContributor(name: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_CONTRIBUTOR, name);
  } catch (err) {
    console.warn('Failed to save contributor to localStorage:', err);
  }
}
