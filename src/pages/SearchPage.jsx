import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import ResultsList from '../components/ResultsList';
import ResultsSkeleton from '../components/ResultsSkeleton';
import StatusMessage from '../components/StatusMessage';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { MIN_QUERY_LENGTH, useMedicineSearch } from '../hooks/useMedicineSearch';
import { RESULT_LIMIT } from '../api/fda';

const DEBOUNCE_MS = 400;
const EXAMPLES = ['Advil', 'Tylenol', 'Zyrtec', 'Lipitor'];

const ERROR_TITLES = {
  network: 'You seem to be offline',
  'rate-limit': 'Slow down a little',
  'bad-query': 'Can’t search for that',
  server: 'The FDA database isn’t responding',
};

export default function SearchPage() {
  // The URL (?q=) is the source of truth for the committed query, so a
  // refresh, a shared link, or Back from a detail page restores the search.
  const [params, setParams] = useSearchParams();
  const urlQuery = params.get('q') ?? '';

  const [input, setInput] = useState(urlQuery);
  const debouncedInput = useDebouncedValue(input, DEBOUNCE_MS);

  // setSearchParams changes identity whenever the params change; keep the
  // latest in a ref so `commit` stays stable and the effect below only runs
  // when the debounced text changes.
  const setParamsRef = useRef(setParams);
  useEffect(() => {
    setParamsRef.current = setParams;
  });

  const lastCommitted = useRef(urlQuery);
  const commit = useCallback((value) => {
    const next = value.trim();
    if (next === lastCommitted.current) return;
    lastCommitted.current = next;
    // replace: one history entry per search session, not one per pause in typing
    setParamsRef.current(next ? { q: next } : {}, { replace: true });
  }, []);

  useEffect(() => {
    commit(debouncedInput);
  }, [debouncedInput, commit]);

  // If the URL changes from outside (e.g. the header link to "/"), follow it.
  useEffect(() => {
    if (urlQuery !== lastCommitted.current) {
      lastCommitted.current = urlQuery;
      setInput(urlQuery);
    }
  }, [urlQuery]);

  const { status, results, error, query, retry } = useMedicineSearch(urlQuery);

  const pickExample = (name) => {
    setInput(name);
    commit(name);
  };

  let body;
  if (status === 'idle') {
    body =
      input.trim().length > 0 && input.trim().length < MIN_QUERY_LENGTH ? (
        <p className="hint">Keep typing — enter at least {MIN_QUERY_LENGTH} letters.</p>
      ) : (
        <div className="hint">
          <p>Type the brand name printed on the box. Try:</p>
          <ul className="examples">
            {EXAMPLES.map((name) => (
              <li key={name}>
                <button type="button" className="chip" onClick={() => pickExample(name)}>
                  {name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      );
  } else if (status === 'loading' && results.length === 0) {
    body = <ResultsSkeleton />;
  } else if (status === 'error') {
    body = (
      <StatusMessage
        tone="error"
        title={ERROR_TITLES[error?.kind] ?? 'Something went wrong'}
        action={
          error?.kind !== 'bad-query' && (
            <button type="button" className="button" onClick={retry}>
              Try again
            </button>
          )
        }
      >
        <p>{error?.message ?? 'The search failed. Try again.'}</p>
      </StatusMessage>
    );
  } else if (status === 'empty') {
    body = (
      <StatusMessage title={`No results for “${query}”`}>
        <p>Check the spelling, or search the brand name rather than the active ingredient — “Advil”, not “ibuprofen”.</p>
      </StatusMessage>
    );
  } else {
    body = <ResultsList results={results} stale={status === 'loading'} />;
  }

  const summary =
    status === 'loading'
      ? `Searching for “${query}”…`
      : status === 'success'
        ? results.length === RESULT_LIMIT
          ? `Showing the first ${RESULT_LIMIT} labels for “${query}”`
          : `${results.length} ${results.length === 1 ? 'label' : 'labels'} for “${query}”`
        : '';

  return (
    <>
      <section className="intro">
        <h1 className="intro__title">Look up a medicine</h1>
        <p className="intro__lede">Search U.S. FDA drug labels by brand name.</p>
        <SearchBar value={input} onChange={setInput} onSubmit={commit} loading={status === 'loading'} />
      </section>

      <p className="summary" aria-live="polite">
        {summary}
      </p>

      {body}
    </>
  );
}
