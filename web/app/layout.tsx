import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'sonner';
import { AppStateProvider } from '@/components/layout/app-state';

export const metadata: Metadata = {
  title: 'Lightweight Rules Engine',
  description: 'SaaS para crear, probar y explicar reglas de decisión.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AppStateProvider>{children}</AppStateProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
