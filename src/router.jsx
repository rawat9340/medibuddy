import { createBrowserRouter, Link, Outlet, ScrollRestoration } from 'react-router-dom';
import SearchPage from './pages/SearchPage';
import MedicinePage from './pages/MedicinePage';
import NotFoundPage from './pages/NotFoundPage';

function Layout() {
  return (
    <div className="shell">
      <header className="topbar">
        <Link to="/" className="topbar__brand">
          <span className="topbar__mark" aria-hidden="true">Rx</span>
          Medicine lookup
        </Link>
      </header>
      <main className="page">
        <Outlet />
      </main>
      <footer className="footnote">
        Data from <a href="https://open.fda.gov/" target="_blank" rel="noreferrer">openFDA</a>, the U.S. Food and Drug
        Administration’s public API.
      </footer>
      {/* Data router required for this: restores scroll on Back, resets it on new pages */}
      <ScrollRestoration />
    </div>
  );
}

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <SearchPage /> },
      { path: 'medicine/:id', element: <MedicinePage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
