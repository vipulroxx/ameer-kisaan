import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import * as serviceWorkerRegistration from './serviceWorkerRegistration'; // Change to this import
import { BrowserRouter } from 'react-router-dom';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <link
  rel="stylesheet"
  href="https://unpkg.com/leaflet/dist/leaflet.css"
/>
  {/* basename lets the app run under a sub-path, e.g. GitHub Pages' /ameer-kisaan */}
  <BrowserRouter basename={process.env.PUBLIC_URL}>
    <App />
  </BrowserRouter>  
  </React.StrictMode>
);

// Register service worker
serviceWorkerRegistration.register();

reportWebVitals();
