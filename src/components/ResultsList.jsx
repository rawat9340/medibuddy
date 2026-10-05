import { memo } from 'react';
import MedicineCard from './MedicineCard';

/**
 * memo is justified here: the search input's state lives in the page, so the
 * page re-renders on every keystroke. `results` keeps the same array
 * reference until a new search actually resolves (it comes from state / the
 * cache), so typing doesn't re-render up to 20 cards for nothing.
 */
function ResultsList({ results, stale }) {
  return (
    <ul className={`results${stale ? ' results--stale' : ''}`} aria-busy={stale}>
      {results.map((m) => (
        <MedicineCard key={m.id} medicine={m} />
      ))}
    </ul>
  );
}

export default memo(ResultsList);
