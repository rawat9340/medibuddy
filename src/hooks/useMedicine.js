import { useCallback, useEffect, useState } from 'react';
import { fetchById } from '../api/fda';
import { getMedicine, setMedicine } from '../api/cache';
import { toMedicine } from '../lib/normalize';

const initial = (id) => {
  const m = getMedicine(id);
  return m ? { status: 'success', medicine: m, error: null } : { status: 'loading', medicine: null, error: null };
};

/**
 * Coming from a search result, the medicine is already cached, so the page
 * renders instantly. On a direct visit or refresh the cache is empty, so the
 * label is fetched by its id instead.
 *
 * status: 'loading' | 'success' | 'not-found' | 'error'
 */
export function useMedicine(id) {
  const [state, setState] = useState(() => initial(id));
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const cached = getMedicine(id);
    if (cached) {
      setState((prev) => (prev.medicine === cached ? prev : { status: 'success', medicine: cached, error: null }));
      return;
    }
    const controller = new AbortController();
    setState({ status: 'loading', medicine: null, error: null });

    fetchById(id, controller.signal)
      .then((raw) => {
        if (controller.signal.aborted) return;
        if (!raw) {
          setState({ status: 'not-found', medicine: null, error: null });
          return;
        }
        const medicine = toMedicine(raw);
        setMedicine(medicine);
        setState({ status: 'success', medicine, error: null });
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        setState({ status: 'error', medicine: null, error });
      });

    return () => controller.abort();
  }, [id, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return { ...state, retry };
}
