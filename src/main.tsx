import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/geist-sans';
import '@fontsource/jetbrains-mono';
import '@/styles/index.css';
import { App } from '@/App';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
