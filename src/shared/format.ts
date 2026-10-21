/** "2026-10-19" → local Date. new Date("2026-10-19") would parse as UTC midnight. */
export function ymdToLocalDate(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** "2026-10-19" → "Mon, 19 Oct 2026" for reading on site; storage stays YYYY-MM-DD. */
export function formatYmd(ymd: string): string {
  return ymdToLocalDate(ymd).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** ISO timestamp → "21 Oct, 12:05". */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

/** ISO timestamp → "12:05". */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/** Short, readable form reference from the device uuid: "A8C1-6134". */
export function shortId(id: string): string {
  return id
    .replace(/-/g, '')
    .slice(0, 8)
    .toUpperCase()
    .replace(/(.{4})/, '$1-');
}
