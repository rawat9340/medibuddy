# Medicine lookup

web app to search 

## Features
- Search medicines by brand name (e.g. Advil, Tylenol, Zyrtec)
- Results update automatically as you type (400 ms debounce)
- Search query is saved in the URL (`?q=advil`), so refresh, sharing and the Back button all keep your search
- Detail page for each medicine: generic name, manufacturer, product type, route, and label sections (uses, directions, warnings, side effects, etc.)
- Link to the full official label on DailyMed
- Basic in-memory caching, so going back to results or opening a medicine from the list is instant

## Project structure
```
src/
  main.jsx                 router and page layout
  api.js                   openFDA requests, cache, and label normalising
  pages/SearchPage.jsx     search box and results list
  pages/MedicinePage.jsx   medicine detail page
  styles.css               basic styling
```

## How it works

- **Search:** queries the openFDA endpoint `drug/label.json` with `openfda.brand_name:"<query>"`, returning up to 20 results. openFDA answers "no matches" with a 404, which the app shows as "No results".
- **Out-of-order responses:** each search uses an `AbortController`, so an older, slower request can't overwrite newer results.
- **Detail page:** if you came from the results list, the medicine is already cached and shows instantly. If the page is opened directly or refreshed, it is fetched by its label id.
- **Back button:** returns to the results list with your search and scroll position intact. If the page was opened directly, it goes to the search page instead.

## Deployment

`vercel.json` (Vercel) and `public/_redirects` (Netlify) send every path to `index.html`, so links like `/medicine/:id` work when opened directly or refreshed.


