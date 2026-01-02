export function normalizeDate(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
export function normalizeTime(time: Date) {
  const t = new Date(time);
  t.setSeconds(0, 0);
  return t;
}
