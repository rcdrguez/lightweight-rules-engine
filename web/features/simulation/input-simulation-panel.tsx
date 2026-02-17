'use client';

import dynamic from 'next/dynamic';
import { Dispatch, SetStateAction, useMemo, useState } from 'react';
import { ChevronDown, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Facts } from '@/types/rules';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

type Props = {
  facts: Facts;
  setFacts: Dispatch<SetStateAction<Facts>>;
  onSimulate: () => void;
  running: boolean;
};

export function InputSimulationPanel({ facts, setFacts, onSimulate, running }: Props) {
  const [mode, setMode] = useState<'simple' | 'advanced'>('simple');
  const [showPreview, setShowPreview] = useState(false);

  const fieldEntries = useMemo(() => Object.entries(facts), [facts]);

  function inferType(value: string): string | number | boolean {
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (value.trim() !== '' && !Number.isNaN(Number(value))) return Number(value);
    return value;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Input Simulation</CardTitle>
        <div className="mt-3 flex gap-2 text-sm">
          <Button variant={mode === 'simple' ? 'default' : 'outline'} onClick={() => setMode('simple')}>Modo simple</Button>
          <Button variant={mode === 'advanced' ? 'default' : 'outline'} onClick={() => setMode('advanced')}>Modo avanzado</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {mode === 'simple' ? (
          <div className="space-y-3">
            {fieldEntries.map(([field, value]) => {
              const isInvalid = field.trim().length === 0;
              return (
                <div key={field} className="grid grid-cols-2 gap-2">
                  <Input value={field} disabled className="bg-slate-50" />
                  <div>
                    <Input
                      value={String(value)}
                      onChange={(event) => setFacts((prev) => ({ ...prev, [field]: inferType(event.target.value) }))}
                      className={isInvalid ? 'border-rose-400 focus-visible:ring-rose-300' : ''}
                    />
                    {isInvalid && <p className="mt-1 text-xs text-rose-500">El campo no puede estar vacío.</p>}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <MonacoEditor
            height="260px"
            defaultLanguage="json"
            value={JSON.stringify(facts, null, 2)}
            onChange={(value) => {
              try {
                if (value) setFacts(JSON.parse(value) as Facts);
              } catch {
                return;
              }
            }}
          />
        )}

        <button className="flex items-center gap-2 text-sm text-slate-600" onClick={() => setShowPreview((prev) => !prev)}>
          JSON preview <ChevronDown className={`h-4 w-4 transition-transform ${showPreview ? 'rotate-180' : ''}`} />
        </button>
        {showPreview && <pre className="overflow-auto rounded-xl bg-slate-900 p-3 text-xs text-slate-100">{JSON.stringify(facts, null, 2)}</pre>}

        <Button className="w-full" onClick={onSimulate} disabled={running}><Play className="mr-2 h-4 w-4" />Simular decisión</Button>
      </CardContent>
    </Card>
  );
}
