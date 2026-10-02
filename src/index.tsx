import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { DataProvider } from './data';
import { AuthProvider } from './contexts/AuthContext';
import { SyncProvider } from './contexts/SyncContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <SyncProvider>
        <DataProvider>
          <App />
        </DataProvider>
      </SyncProvider>
    </AuthProvider>
  </React.StrictMode>
);
