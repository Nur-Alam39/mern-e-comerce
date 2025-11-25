import React from 'react';
import { createRoot } from 'react-dom/client';
// Ensure axios points to backend
import './utils/api';
import App from './App';
import 'bootstrap/dist/css/bootstrap.min.css';
// Font Awesome (import when installed via npm)
import '@fortawesome/fontawesome-free/css/all.min.css';

const root = createRoot(document.getElementById('root'));
root.render(<App />);
