import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useJsonLd } from '../hooks/useJsonLd';
import { usePageMeta } from '../hooks/usePageMeta';
import { buildNotFoundGraph } from '../lib/schema/buildNotFoundGraph';

export default function NotFound() {
  const jsonLd = useMemo(() => buildNotFoundGraph(), []);

  usePageMeta({
    title: 'Page not found',
    description: 'The page you requested could not be found.',
  });
  useJsonLd(jsonLd);

  return (
    <div className="app">
      <Navbar />
      <main className="app-main">
        <section className="section">
          <div className="container not-found">
            <h1>404</h1>
            <p>This frame is still developing. The page you asked for is not here.</p>
            <Link to="/" className="not-found__link">
              Return home
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
