import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'
import { Toaster } from 'sonner'
import ErrorBoundary from './ErrorBoundary'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </QueryClientProvider>
    <Toaster richColors theme="dark" position="top-right" />
  </React.StrictMode>
)
