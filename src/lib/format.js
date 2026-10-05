export const displayName = (m) => (m.brandNames.length ? m.brandNames.join(' / ') : 'Unnamed product');

const sentence = (s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

/** "HUMAN OTC DRUG" -> { short: 'OTC', long: 'Over the counter' } */
export function productType(raw) {
  const t = raw.toUpperCase();
  if (t.includes('OTC')) return { short: 'OTC', long: 'Over the counter', kind: 'otc' };
  if (t.includes('PRESCRIPTION')) return { short: 'Rx', long: 'Prescription only', kind: 'rx' };
  const label = sentence(raw.replace(/^HUMAN\s+/i, ''));
  return { short: label, long: label, kind: 'other' };
}

export const formatRoute = sentence;

/** "20240115" -> "15 Jan 2024" */
export function formatLabelDate(yyyymmdd) {
  if (!/^\d{8}$/.test(yyyymmdd ?? '')) return null;
  const d = new Date(`${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? null
    : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}
