// src/components/ClientProviders.tsx
'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import QueryProvider from './QueryProvider'; // Assume this exists

interface ClientProvidersProps {
  children: React.ReactNode;
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <AuthProvider>
      <QueryProvider>
        {children}
      </QueryProvider>
    </AuthProvider>
  );
}