export function randomDateWithinDays(daysAgo: number): string {
  const now = Date.now();
  const msAgo = daysAgo * 24 * 60 * 60 * 1000;
  const randomMs = Math.floor(Math.random() * msAgo);
  return new Date(now - randomMs).toISOString();
}
