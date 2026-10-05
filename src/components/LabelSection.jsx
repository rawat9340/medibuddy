export default function LabelSection({ section }) {
  return (
    <details className={`label-section${section.tone === 'danger' ? ' label-section--danger' : ''}`} open={section.open}>
      <summary>{section.title}</summary>
      <div className="label-section__body">
        {section.paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </details>
  );
}
