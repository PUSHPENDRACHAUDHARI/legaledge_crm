export const ACTIVITY_RETENTION_MS = 12 * 60 * 60 * 1000;

export function getActivityTimestamp(activity) {
  const rawValue = activity?.at || activity?.createdAt || activity?.created_at || null;
  if (!rawValue) return null;

  const parsed = new Date(rawValue);
  const timestamp = parsed.getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

export function isWithinActivityRetention(activity, now = Date.now()) {
  const timestamp = getActivityTimestamp(activity);
  if (timestamp == null) return false;
  return now - timestamp <= ACTIVITY_RETENTION_MS;
}

export function getRecentActivities(activities, now = Date.now()) {
  return (Array.isArray(activities) ? activities : [])
    .filter((activity) => isWithinActivityRetention(activity, now))
    .slice()
    .sort((a, b) => (getActivityTimestamp(b) || 0) - (getActivityTimestamp(a) || 0));
}
