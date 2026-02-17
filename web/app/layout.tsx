import type { Metadata } from 'next';
import Link from 'next/link';
import { Providers } from '@/components/providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Lightweight Rules Engine',
  description: 'Frontend integrado al API de Lightweight Rules Engine'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-slate-50 text-slate-900">
        <Providers>
          <header className="border-b bg-white">
            <nav className="mx-auto flex max-w-7xl gap-6 px-6 py-4 text-sm font-medium">
              <Link href="/rules/manual">Reglas Manuales</Link>
              <Link href="/rules/flow">Reglas en Flujo</Link>
              <Link href="/simulate">Simular</Link>
            </nav>
          </header>
          <main className="mx-auto max-w-7xl px-6 py-6">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
