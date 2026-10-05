export default function SearchBar({ value, onChange, onSubmit, loading }) {
  return (
    <form
      className="search"
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(value); // Enter skips the debounce
      }}
    >
      <label htmlFor="search-input" className="visually-hidden">
        Brand name
      </label>
      <svg className="search__icon" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        id="search-input"
        className="search__input"
        type="search"
        inputMode="search"
        autoComplete="off"
        spellCheck="false"
        placeholder="Brand name, e.g. Advil"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus={!value}
      />
      {loading && <span className="search__spinner" aria-hidden="true" />}
      {value && !loading && (
        <button
          type="button"
          className="search__clear"
          onClick={() => {
            onChange('');
            onSubmit('');
            document.getElementById('search-input')?.focus();
          }}
          aria-label="Clear search"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      )}
    </form>
  );
}
