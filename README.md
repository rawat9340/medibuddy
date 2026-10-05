# Medicine lookup

Search U.S. FDA drug labels by brand name, scan results as cards, and open a detail page per label. Built with React 18, React Router 6 and Vite. No UI or data-fetching libraries.

## Run it

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build in dist/
npm run preview   # serve the build locally
```

Node 18+ required. No API key needed (openFDA allows ~240 requests/minute without one).

**Deploying:** `vercel.json` (Vercel) and `public/_redirects` (Netlify) rewrite every path to `index.html`, so `/medicine/:id` works when opened directly or refreshed.

## Structure

```
src/
  api/fda.js              fetch + mapping HTTP outcomes to UI states
  api/cache.js            LRU + TTL cache for searches and individual medicines
  lib/normalize.js        raw label -> flat, UI-ready object (arrays, gaps, dedupe)
  lib/format.js           display helpers (product type, route, dates)
  hooks/useDebouncedValue.js
  hooks/useMedicineSearch.js   search state, cancellation, cache, retry
  hooks/useMedicine.js         detail state; cache first, fetch by id on direct visit
  pages/SearchPage.jsx
  pages/MedicinePage.jsx
  components/…
```

## How each state is handled

| Situation | What the user sees |
|---|---|
| Empty input | Hint with example brands to tap |
| 1 character | "Keep typing" — single letters aren't useful brand searches |
| Request in flight, no previous results | Skeleton cards + spinner in the input |
| Request in flight, refining a previous search | Previous results stay, dimmed — no layout jump |
| **404** from openFDA | **"No results" state.** openFDA returns 404 for "no matches", which is a normal search outcome, not a failure |
| Network failure | Error with **Try again** |
| 429 rate limit | Error asking to wait, with **Try again** |
| 400 (odd characters) | Explanation, no retry (retrying the same input won't help). Quotes and backslashes are stripped before sending to prevent most of these |
| 5xx | Error with **Try again** |
| Detail id doesn't exist | "Not in the FDA database" with a link to search |

## Detail page: direct open and refresh

- Search results are normalised and cached by id, so clicking a card renders the detail page **instantly with no extra request**.
- On direct open or refresh the cache is empty, so the page fetches `search=id:"<id>"` and caches it.
- The query lives in the URL (`/?q=advil`). **Back to results** calls `navigate(-1)`, which restores the query, the cached results and — via `ScrollRestoration` — the scroll position.
- If the page was opened directly (no results list behind it), the button becomes **Search medicines** and links to `/` instead of sending the user out of the app.

## Performance decisions

### Debouncing — `useDebouncedValue`, 400 ms
Requests fire 400 ms after typing stops. Pressing Enter commits immediately, so the delay is never in the way of someone who knows what they want. The URL is updated with `replace`, so pauses while typing don't flood browser history.

### Request cancellation — `AbortController` per query
Each query's effect owns a controller; the effect cleanup aborts it when the query changes or the page unmounts. A slow response for "adv" therefore can't overwrite the results for "advil". Debouncing reduces how often this happens; cancellation makes it impossible. Results are also ignored if `signal.aborted` is set, as a guard against a response that resolves in the same tick as the abort.

### Caching — `api/cache.js`
- Keyed by the normalised query (trimmed, whitespace collapsed, lowercased), so `Advil`, `advil ` and `ADVIL` share one entry.
- Empty results are cached too: "no matches" won't change in ten minutes.
- Errors are never cached, so **Try again** really retries.
- 10-minute TTL and LRU cap (50 searches, 500 medicines) so a tab left open doesn't serve stale data or grow forever.
- Results are cached **after** normalisation, so the work happens once.

### Memoization — where it's used, and where it deliberately isn't
- **`memo(ResultsList)`** — the input's state lives in `SearchPage`, so the page re-renders on every keystroke. `results` keeps the same array reference until a new search resolves (it comes from state/cache), so memo skips re-rendering the cards while the user types. This is the one place the re-render is both frequent and avoidable.
- **No `useMemo` for card fields.** Instead of memoizing derived values inside components, `normalize.js` turns raw labels into display-ready objects once, at the data boundary. There's nothing expensive left to recompute on render.
- **No `memo` on `MedicineCard`.** The list is already memoized; the cards only re-render when the list does, which is exactly when they should.
- **`useCallback`** only where identity matters: `retry` (returned from hooks), and `commit`, which is an effect dependency. `setSearchParams` changes identity whenever the params change, so it's read through a ref to keep `commit` stable and stop the debounce effect from re-firing.

### Efficient rendering
- Stable keys (label `id`), never array indices, for results.
- Hook state is initialised **from the cache synchronously**, so returning to a cached search or opening a cached medicine renders final content on the first paint — no loading flash, and scroll restoration has the content it needs.
- Not used: virtualisation (20 results max) and route-level code splitting (the whole app is ~73 kB gzipped). Both would add complexity without a measurable gain at this size.

## Card and detail content

Cards use only `results[].openfda`, as required: brand name, generic name, manufacturer, drug class, first product NDC, product type (OTC / Rx) and route. Missing fields are omitted rather than shown as blanks; arrays are de-duplicated case-insensitively (`['Advil', 'ADVIL']` → `Advil`). The NDC helps tell apart the many near-identical labels a brand often has.

The detail page shows every useful `openfda` field (substance, pharmacologic classes, application number, NDCs, RxCUI, UNII) plus the human-readable label sections that exist for that product (uses, directions, warnings, boxed warning, etc.) as collapsible sections, and links to the full label on DailyMed.

## Trade-offs and what I'd do next

- **In-memory cache only.** A refresh clears it, so a refreshed detail page makes one request. `sessionStorage` would avoid that but adds serialisation and staleness handling; not worth it for one small request.
- **Max 20 results**, per the spec. Pagination (`skip`) would be the next step for broad brands.
- **Exact phrase matching.** openFDA's quoted search doesn't do prefix matching, so "adv" won't find "Advil". A wildcard query is possible but returns noisier results; I kept the spec's query.
- **Label text is shown as provided.** Sections sometimes repeat their own heading at the start; cleaning that reliably needs per-section rules.
- **Tests.** Next additions would be unit tests for `normalize.js` and the cache, and a hook test proving an aborted response never reaches state.

Data from [openFDA](https://open.fda.gov/). For information only — not medical advice.
