import { useEffect } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useMedicine } from '../hooks/useMedicine';
import { displayName, formatLabelDate } from '../lib/format';
import Badges from '../components/Badges';
import LabelSection from '../components/LabelSection';
import StatusMessage from '../components/StatusMessage';
import ValueList from '../components/ValueList';

function BackLink() {
  const location = useLocation();
  const navigate = useNavigate();

  // Arrived from a result card: go back in history, which restores the
  // query (?q=), the cached results, and the scroll position.
  if (location.state?.fromResults) {
    return (
      <button type="button" className="back" onClick={() => navigate(-1)}>
        <Chevron /> Back to results
      </button>
    );
  }
  // Opened directly (shared link, bookmark, new tab): there's no list to return to.
  return (
    <Link className="back" to="/">
      <Chevron /> Search medicines
    </Link>
  );
}

const Chevron = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M15 5l-7 7 7 7" />
  </svg>
);

function detailRows(m) {
  return [
    ['Active substance', m.substances],
    ['Generic name', m.genericNames],
    ['Manufacturer', m.manufacturers],
    ['Drug class', m.drugClasses],
    ['Mechanism of action', m.mechanisms],
    ['Physiologic effect', m.physiologicEffects],
    ['Chemical class', m.chemicalClasses],
    ['Application number', m.applicationNumbers, true],
    ['Product NDC', m.productNdcs, true],
    ['Package NDC', m.packageNdcs, true],
    ['RxCUI', m.rxcui, true],
    ['UNII', m.unii, true],
  ].filter(([, values]) => values.length > 0);
}

function MedicineDetail({ medicine: m }) {
  const updated = formatLabelDate(m.effectiveTime);
  const rows = detailRows(m);

  return (
    <article className="facts">
      <header className="facts__head">
        <h1 className="facts__title">{displayName(m)}</h1>
        {m.genericNames.length > 0 && <p className="facts__generic">{m.genericNames.join(', ')}</p>}
        <Badges medicine={m} />
      </header>

      {rows.length > 0 && (
        <section className="facts__section" aria-labelledby="details-heading">
          <h2 id="details-heading" className="facts__heading">
            Product details
          </h2>
          <dl className="facts__grid">
            {rows.map(([label, values, tabular]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>
                  <ValueList values={values} tabular={tabular} />
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {m.label.length > 0 && (
        <section className="facts__section" aria-labelledby="label-heading">
          <h2 id="label-heading" className="facts__heading">
            From the label
          </h2>
          {m.label.map((s) => (
            <LabelSection key={s.key} section={s} />
          ))}
        </section>
      )}

      <footer className="facts__foot">
        {updated && <p>Label updated {updated}</p>}
        {m.splSetId && (
          <a
            href={`https://dailymed.nlm.nih.gov/dailymed/lookup.cfm?setid=${encodeURIComponent(m.splSetId)}`}
            target="_blank"
            rel="noreferrer"
          >
            Read the full label on DailyMed
          </a>
        )}
      </footer>
    </article>
  );
}

export default function MedicinePage() {
  const { id } = useParams();
  const { status, medicine, error, retry } = useMedicine(id);

  useEffect(() => {
    document.title = medicine ? `${displayName(medicine)} · Medicine lookup` : 'Medicine lookup';
  }, [medicine]);

  let content;
  if (status === 'loading') {
    content = (
      <div className="facts facts--skeleton" aria-busy="true" aria-label="Loading medicine">
        <span className="sk sk--title" />
        <span className="sk sk--line" />
        <span className="sk sk--line sk--short" />
      </div>
    );
  } else if (status === 'not-found') {
    content = (
      <StatusMessage
        title="This medicine isn’t in the FDA database"
        action={
          <Link className="button" to="/">
            Search medicines
          </Link>
        }
      >
        <p>The link may be mistyped, or the label may have been replaced by a newer version.</p>
      </StatusMessage>
    );
  } else if (status === 'error') {
    content = (
      <StatusMessage
        tone="error"
        title="Couldn’t load this medicine"
        action={
          <button type="button" className="button" onClick={retry}>
            Try again
          </button>
        }
      >
        <p>{error?.message}</p>
      </StatusMessage>
    );
  } else {
    content = <MedicineDetail medicine={medicine} />;
  }

  return (
    <div className="detail">
      <BackLink />
      {content}
      <p className="disclaimer">
        For information only. Not a substitute for advice from a doctor or pharmacist.
      </p>
    </div>
  );
}
