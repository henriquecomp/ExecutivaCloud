import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import 'axios';

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

// Add global animation styles
const style = document.createElement('style');
style.textContent = `
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes fade-in-fast {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  .animate-fade-in {
    animation: fade-in 0.5s ease-out forwards;
  }
  .animate-fade-in-fast {
    animation: fade-in-fast 0.3s ease-out forwards;
  }
`;
document.head.appendChild(style);
