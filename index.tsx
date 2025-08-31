
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary'; // <-- Import it

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    {/* --- WRAP YOUR APP HERE --- */}
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
    {/* --- END OF WRAPPER --- */}
  </React.StrictMode>
);
