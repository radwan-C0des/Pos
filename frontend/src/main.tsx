import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ConfigProvider } from 'antd';
import { LocalizationProvider } from './context/LocalizationContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LocalizationProvider>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#1677ff',
            borderRadius: 8,
            colorBgLayout: '#f8f9fa',
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
          },
          components: {
            Button: {
              borderRadius: 6,
              controlHeight: 40,
            },
            Input: {
              controlHeight: 40,
            },
            Card: {
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
            },
          },
        }}
      >
        <App />
      </ConfigProvider>
    </LocalizationProvider>
  </React.StrictMode>,
);
