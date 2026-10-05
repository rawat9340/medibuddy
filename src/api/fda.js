const BASE_URL = 'https://api.fda.gov/drug/label.json';
export const RESULT_LIMIT = 20;

/** Error with a `kind` the UI can switch on. */
export class FdaError extends Error {
  constructor(kind, message, status) {
    super(message);
    this.name = 'FdaError';
    this.kind = kind; // 'network' | 'rate-limit' | 'bad-query' | 'server'
    this.status = status;
  }
}

/**
 * The query goes inside a quoted Lucene phrase, so a stray `"` or `\` would
 * break the syntax and return a 400. Strip those and collapse whitespace.
 */
export function sanitizeQuery(raw) {
  return raw.replace(/["\\]/g, '').replace(/\s+/g, ' ').trim();
}

async function request(search, limit, signal) {
  const url = `${BASE_URL}?search=${encodeURIComponent(search)}&limit=${limit}`;

  let res;
  try {
    res = await fetch(url, { signal });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new FdaError('network', "Couldn't reach the FDA database. Check your connection and try again.");
  }

  // openFDA answers "no matches" with a 404, not an empty list.
  // That's a normal outcome for a search, so it maps to "no results", not an error.
  if (res.status === 404) return [];
  if (res.status === 429) {
    throw new FdaError('rate-limit', 'Too many searches in a short time. Wait a few seconds and try again.', 429);
  }
  if (res.status === 400) {
    throw new FdaError('bad-query', 'That search term contains characters the FDA database can’t handle. Try letters and numbers only.', 400);
  }
  if (!res.ok) {
    throw new FdaError('server', `The FDA database returned an error (${res.status}). Try again in a moment.`, res.status);
  }

  const data = await res.json();
  return Array.isArray(data.results) ? data.results : [];
}

export function fetchByBrand(query, signal) {
  return request(`openfda.brand_name:"${query}"`, RESULT_LIMIT, signal);
}

/** Resolves to the raw label, or null if no label has this id. */
export async function fetchById(id, signal) {
  // Label ids are UUIDs. Anything else can't exist, so skip the network call.
  if (!/^[A-Za-z0-9-]+$/.test(id)) return null;
  const results = await request(`id:"${id}"`, 1, signal);
  return results[0] ?? null;
}
