// src/components/ClientProviders.tsx
'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import QueryProvider from './QueryProvider'; // Assume this exists
import { BiometricGate } from '@/app/BiometricGate';

interface ClientProvidersProps {
  children: React.ReactNode;
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <AuthProvider>
      <BiometricGate>

      <QueryProvider>
        {children}
      </QueryProvider>

      </BiometricGate>
    </AuthProvider>
  );
}