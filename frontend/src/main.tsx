import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import Admin from './Admin';
import { LanguageProvider } from './i18n';
import './styles.css';
const isAdmin = window.location.pathname.replace(/\/$/, '') === '/admin';
createRoot(document.getElementById('root')!).render(<StrictMode><LanguageProvider>{isAdmin ? <Admin /> : <App />}</LanguageProvider></StrictMode>);
