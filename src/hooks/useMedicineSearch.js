import { useCallback, useEffect, useState } from 'react';
import { fetchByBrand, sanitizeQuery } from '../api/fda';
import { getSearch, setSearch } from '../api/cache';
import { toMedicine } from '../lib/normalize';

export const MIN_QUERY_LENGTH = 2;

const IDLE = { status: 'idle', results: [], error: null, query: '' };

function fromCache(query) {
  const items = getSearch(query);
  return items ? { status: items.length ? 'success' : 'empty', results: items, error: null, query } : null;
}

/**
 * status: 'idle' | 'loading' | 'success' | 'empty' | 'error'
 *
 * While a new query loads, the previous results stay in `results` so the list
 * can dim instead of collapsing to a skeleton on every refinement.
 */
export function useMedicineSearch(rawQuery) {
  const query = sanitizeQuery(rawQuery);

  // Read the cache during initialisation, not only in the effect: when the
  // user comes back from a detail page the results are in the very first
  // render, so the list doesn't flash and scroll restoration has content
  // to land on.
  const [state, setState] = useState(() =>
    query.length < MIN_QUERY_LENGTH ? IDLE : fromCache(query) ?? { ...IDLE, status: 'loading', query },
  );
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (query.length < MIN_QUERY_LENGTH) {
      setState(IDLE);
      return;
    }

    const cached = fromCache(query);
    if (cached) {
      setState((prev) => (prev.results === cached.results && prev.query === query ? prev : cached));
      return;
    }

    // Each query owns a controller. When the query changes (or the page
    // unmounts) the cleanup aborts the old request, so a slow response for
    // "adv" can never overwrite the results for "advil".
    const controller = new AbortController();
    setState((prev) => ({ status: 'loading', results: prev.results, error: null, query }));

    fetchByBrand(query, controller.signal)
      .then((raw) => {
        if (controller.signal.aborted) return;
        const items = raw.map(toMedicine);
        setSearch(query, items);
        setState({ status: items.length ? 'success' : 'empty', results: items, error: null, query });
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        setState({ status: 'error', results: [], error, query });
      });

    return () => controller.abort();
  }, [query, attempt]);

  // Errors are never cached, so bumping `attempt` re-runs the effect and refetches.
  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return { ...state, retry };
}
