import { Buffer } from 'buffer';
import Long from 'long';

// Polyfill Buffer and Long for libraries that expect them in the global scope.
// @ts-ignore
window.Buffer = Buffer;
// @ts-ignore
window.Long = Long;

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);