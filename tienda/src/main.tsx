import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './app/App';
import './shared/styles/tokens.css';
import './shared/styles/global.css';

const basename =
  typeof window !== 'undefined' && window.location.pathname.startsWith('/tienda')
    ? '/tienda'
    : '';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </StrictMode>,
);

