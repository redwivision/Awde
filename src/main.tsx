import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);

// Progressive Web App: register the offline shell in production. Service
// workers only run on secure origins (https or localhost), so this is safe.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      // A new build (changed sw.js → cache names) activates and takes over
      // while an old tab is open. Reload once so the app picks up the new
      // shell instead of serving the stale cached bundle until the next visit.
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });
      // Proactively check for updates so deploys propagate without waiting
      // for several navigations.
      registration.update().catch(() => {});
    }).catch(() => {
      /* offline shell unavailable — app still works online */
    });
  });
}
