import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import App from './App';
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);

// PWA app-shell caching. Only registered for a real production build
// (not `vite dev`), and the service worker itself never touches Supabase
// or any cross-origin request -- see public/sw.js. A fetch failure here
// (e.g. this exact asset blocked offline on first-ever load) is caught
// and ignored; it isn't fatal to the app either way.
const isProdBuild = (import.meta as ImportMeta & { env: Record<string, string | undefined> }).env.PROD;

if ('serviceWorker' in navigator && isProdBuild) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
