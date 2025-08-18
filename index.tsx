import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { DocProvider } from './contexts/DocContext';
import type { PdfjsLib } from './types';

declare global {
  interface Window {
    pdfjsLib: PdfjsLib;
  }
}

// Set up PDF.js worker
if (window.pdfjsLib) {
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <DocProvider>
      <App />
    </DocProvider>
  </React.StrictMode>
);