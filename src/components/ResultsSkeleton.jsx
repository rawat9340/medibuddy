export default function ResultsSkeleton() {
  return (
    <ul className="results" aria-hidden="true">
      {Array.from({ length: 6 }, (_, i) => (
        <li key={i} className="card card--skeleton">
          <span className="sk sk--title" />
          <span className="sk sk--line" />
          <span className="sk sk--line sk--short" />
        </li>
      ))}
    </ul>
  );
}
