'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Play, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppState } from '@/components/layout/app-state';
import { cn } from '@/lib/utils';

const nav = [
  { href: '/rules/manual', label: 'Reglas (Manual)' },
  { href: '/rules/flow', label: 'Reglas (Flujo)' },
  { href: '/simulate', label: 'Simulador / Pruebas' },
  { href: '/history', label: 'Historial' },
  { href: '/documentation', label: 'Documentación' },
  { href: '/settings', label: 'Configuración' }
];

export function SaaSShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { runSimulation } = useAppState();

  return (
    <div className="flex min-h-screen">
      <aside className="w-72 border-r border-slate-200 bg-white/90 p-5">
        <h1 className="mb-6 text-lg font-semibold">Lightweight Rules Engine</h1>
        <nav className="space-y-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'block rounded-lg px-3 py-2 text-sm',
                pathname === item.href ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white/70 px-6 py-4">
          <p className="font-medium">Lightweight Rules Engine</p>
          <div className="flex items-center gap-3">
            <select className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
              <option>ES</option>
              <option>EN</option>
            </select>
            <Button variant="outline" className="gap-2">
              <ShieldCheck className="h-4 w-4" /> Validar
            </Button>
            <Button className="gap-2" onClick={runSimulation}>
              <Play className="h-4 w-4" /> Ejecutar
            </Button>
          </div>
        </header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
