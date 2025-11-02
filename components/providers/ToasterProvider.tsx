'use client';

import { Toaster } from 'react-hot-toast';

interface ToasterProviderProps {
  children: React.ReactNode;
}

export const ToasterProvider = ({ children }: ToasterProviderProps) => {
  return (
    <>
      {children}
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#333',
            color: '#fff',
            padding: '12px 16px',
            borderRadius: '8px',
          },
          success: {
            style: {
              background: '#10B981',
            },
          },
          error: {
            style: {
              background: '#EF4444',
            },
          },
          loading: {
            style: {
              background: '#3B82F6',
            },
          },
        }}
      />
    </>
  );
};