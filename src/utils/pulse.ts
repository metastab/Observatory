import type { Update, PulseInfo, DayActivity, PulseLevel } from '../types';

/**
 * Format relative time string from ISO timestamp
 */
export function formatRelativeTime(dateString: string | null | undefined): string {
  if (!dateString) return 'No updates yet';
  
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));

  if (diffInSeconds < 60) {
    return 'Just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) {
    return 'Yesterday';
  }
  if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  }
  if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  }

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * Calculate Activity Pulse strictly based on recent update timestamps
 * (Last 24 hours, Last 3 days, Last 7 days, and elapsed time since last update).
 */
export function calculatePulse(updates: Update[]): PulseInfo {
  if (!updates || updates.length === 0) {
    return {
      level: 'dormant',
      label: 'Dormant',
      description: 'No recent activity',
      color: '#64748b', // slate-500
      glowColor: 'rgba(100, 116, 139, 0.25)',
      score: 5,
      updates24h: 0,
      updates3d: 0,
      updates7d: 0,
      lastUpdateAt: null,
      lastUpdateRelative: 'No updates yet',
    };
  }

  // Sort newest first
  const sortedUpdates = [...updates].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const now = new Date().getTime();
  const ONE_HOUR = 3600 * 1000;

  const latestUpdate = sortedUpdates[0];
  const lastUpdateMs = new Date(latestUpdate.created_at).getTime();
  const hoursSinceLast = Math.max(0, (now - lastUpdateMs) / ONE_HOUR);
  const daysSinceLast = hoursSinceLast / 24;

  let updates24h = 0;
  let updates3d = 0;
  let updates7d = 0;

  for (const update of sortedUpdates) {
    const updateTime = new Date(update.created_at).getTime();
    const ageHours = (now - updateTime) / ONE_HOUR;
    if (ageHours <= 24) updates24h++;
    if (ageHours <= 72) updates3d++;
    if (ageHours <= 168) updates7d++;
  }

  // Determine pulse category & score based on momentum windows
  let level: PulseLevel;
  let label: string;
  let description: string;
  let color: string;
  let glowColor: string;
  let score: number;

  if (updates24h >= 2 || (updates24h >= 1 && hoursSinceLast <= 6) || (updates3d >= 4 && hoursSinceLast <= 24)) {
    // High pulse: Multiple updates recently, very active today
    level = 'high';
    label = 'High Momentum';
    description = 'Project is actively moving';
    color = '#10b981'; // emerald-500
    glowColor = 'rgba(16, 185, 129, 0.4)';
    score = Math.min(100, 80 + updates24h * 5 + updates3d * 2);
  } else if (updates3d >= 1 || updates7d >= 2 || hoursSinceLast <= 48) {
    // Medium pulse: Some recent activity within 3 days or steady in past week
    level = 'medium';
    label = 'Steady Progress';
    description = 'Steady progress';
    color = '#06b6d4'; // cyan-500
    glowColor = 'rgba(6, 182, 212, 0.35)';
    score = Math.min(79, 50 + updates3d * 8 + updates7d * 3);
  } else if (daysSinceLast <= 7 || updates7d >= 1) {
    // Low pulse: no updates in 3+ days
    level = 'low';
    label = 'Low Activity';
    description = 'Needs attention';
    color = '#f59e0b'; // amber-500
    glowColor = 'rgba(245, 158, 11, 0.35)';
    score = Math.min(49, 25 + updates7d * 10);
  } else {
    // Dormant: no updates in > 7 days
    level = 'dormant';
    label = 'Dormant';
    description = 'No recent activity';
    color = '#64748b'; // slate-500
    glowColor = 'rgba(100, 116, 139, 0.2)';
    score = 10;
  }

  return {
    level,
    label,
    description,
    color,
    glowColor,
    score,
    updates24h,
    updates3d,
    updates7d,
    lastUpdateAt: latestUpdate.created_at,
    lastUpdateRelative: formatRelativeTime(latestUpdate.created_at),
  };
}

/**
 * Generate 7-day activity histogram distribution (from 6 days ago up to today)
 */
export function calculate7DayActivity(updates: Update[]): DayActivity[] {
  const days: DayActivity[] = [];
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = 6; i >= 0; i--) {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() - i);

    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const day = String(targetDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    // Count updates on this calendar day
    const count = (updates || []).filter((u) => {
      const uDate = new Date(u.created_at);
      const uYear = uDate.getFullYear();
      const uMonth = String(uDate.getMonth() + 1).padStart(2, '0');
      const uDay = String(uDate.getDate()).padStart(2, '0');
      return `${uYear}-${uMonth}-${uDay}` === dateStr;
    }).length;

    days.push({
      dayLabel: i === 0 ? 'Today' : dayLabels[targetDate.getDay()],
      dateStr,
      count,
      isToday: i === 0,
    });
  }

  return days;
}
