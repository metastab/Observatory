export interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  contributors: string[];
  created_at: string;
}

export interface Update {
  id: string;
  project_id: string;
  author_id?: string;
  contributor_name: string;
  content: string;
  created_at: string;
}

export interface OperatorSession {
  contributorName: string;
  userId?: string;
  email?: string;
  isDemo?: boolean;
}

export type PulseLevel = 'high' | 'medium' | 'low' | 'dormant';

export interface PulseInfo {
  level: PulseLevel;
  label: string;
  description: string;
  color: string;
  glowColor: string;
  score: number; // 0 - 100
  updates24h: number;
  updates3d: number;
  updates7d: number;
  lastUpdateAt: string | null;
  lastUpdateRelative: string;
}

export interface DayActivity {
  dayLabel: string;
  dateStr: string;
  count: number;
  isToday: boolean;
}

export interface ProjectWithStats extends Project {
  updateCount: number;
  pulse: PulseInfo;
  recentDaysActivity: DayActivity[];
  latestUpdate?: Update;
}
