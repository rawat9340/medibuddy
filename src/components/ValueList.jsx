import { useState } from 'react';

const VISIBLE = 6;

/** Some fields (package NDCs) can have dozens of entries; show a few, expand on demand. */
export default function ValueList({ values, tabular }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? values : values.slice(0, VISIBLE);
  const hidden = values.length - shown.length;

  return (
    <>
      <ul className={`value-list${tabular ? ' tabular' : ''}`}>
        {shown.map((v) => (
          <li key={v}>{v}</li>
        ))}
      </ul>
      {hidden > 0 && (
        <button type="button" className="link-button" onClick={() => setExpanded(true)}>
          Show {hidden} more
        </button>
      )}
    </>
  );
}
