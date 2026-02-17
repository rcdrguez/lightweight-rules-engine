'use client';

import { BarChart3, Clock3, Cog, FlaskConical, PlayCircle, Workflow } from 'lucide-react';
import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

type Props = {
  projectName: string;
  workspace: string;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onRun: () => void;
  onValidate: () => void;
  onSimulate: () => void;
  children: ReactNode;
};

const navItems = [
  { icon: BarChart3, label: 'Dashboard' },
  { icon: Workflow, label: 'Reglas' },
  { icon: FlaskConical, label: 'Escenarios' },
  { icon: PlayCircle, label: 'Ejecutar' },
  { icon: Clock3, label: 'Historial' },
  { icon: Cog, label: 'Configuración' }
];

export function SaaSShell({ projectName, workspace, darkMode, onToggleDarkMode, onRun, onValidate, onSimulate, children }: Props) {
  return (
    <main className="flex min-h-screen bg-[#f5f7fa] dark:bg-slate-950">
      <aside className="hidden w-64 border-r border-slate-200 bg-white p-4 lg:block dark:border-slate-800 dark:bg-slate-900">
        <p className="text-xs uppercase tracking-wider text-slate-500">{workspace}</p>
        <h1 className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">Lightweight Rules Engine</h1>
        <nav className="mt-6 space-y-1">
          {navItems.map((item) => (
            <button key={item.label} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <section className="flex-1">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs text-slate-500">Proyecto activo</p>
              <p className="font-semibold text-slate-900 dark:text-slate-100">{projectName}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={onRun}>Ejecutar</Button>
              <Button variant="secondary" onClick={onValidate}>Validar</Button>
              <Button variant="outline" onClick={onSimulate}>Simular</Button>
              <Button variant="outline">Publicar</Button>
              <Button variant="ghost" onClick={onToggleDarkMode}>{darkMode ? 'Light' : 'Dark'}</Button>
              <div className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700">Ana PM</div>
            </div>
          </div>
        </header>
        <div className="p-4">{children}</div>
      </section>
    </main>
  );
}
