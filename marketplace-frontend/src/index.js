import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { store } from './store';
import App from './App';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#0a0a0f',
            color: '#f8f6f1',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '0.875rem',
            borderRadius: '12px',
            boxShadow: '0 12px 40px rgba(10,10,15,0.25)',
          },
          success: { iconTheme: { primary: '#1a7f5a', secondary: '#f8f6f1' } },
          error:   { iconTheme: { primary: '#c0392b', secondary: '#f8f6f1' } },
        }}
      />
    </Provider>
  </React.StrictMode>
);
