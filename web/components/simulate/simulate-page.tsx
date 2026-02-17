'use client';

import { Terminal } from 'lucide-react';
import { useState } from 'react';
import { useAppState } from '@/components/layout/app-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { variableCatalog } from '@/lib/rule-engine';

export function SimulatePage() {
  const { simulationInput, setSimulationInput, runSimulation, lastEvaluation } = useAppState();
  const [mode, setMode] = useState<'simple' | 'advanced'>('simple');
  const [jsonDraft, setJsonDraft] = useState(JSON.stringify(simulationInput, null, 2));
  const [showLogs, setShowLogs] = useState(false);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-12 xl:col-span-4">
          <CardHeader><CardTitle>Inputs (Simulación)</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Button variant={mode === 'simple' ? 'default' : 'outline'} onClick={() => setMode('simple')}>Simple</Button>
              <Button variant={mode === 'advanced' ? 'default' : 'outline'} onClick={() => setMode('advanced')}>Avanzado</Button>
              <Button variant="secondary" onClick={() => setSimulationInput({ creditScore: 710, dti: 26, income: 64000, age: 40, employmentYears: 8, existingCustomer: true })}>Cargar ejemplo</Button>
            </div>
            {mode === 'simple' ? (
              <div className="space-y-2">
                {variableCatalog.map((field) => (
                  <div key={field.key}>
                    <label className="text-xs text-slate-500">{field.label}</label>
                    {field.type === 'number' ? (
                      <Input type="number" value={String(simulationInput[field.key])} onChange={(event) => setSimulationInput({ ...simulationInput, [field.key]: Number(event.target.value) })} />
                    ) : (
                      <select className="w-full rounded-xl border border-slate-300 p-2" value={String(simulationInput[field.key])} onChange={(event) => setSimulationInput({ ...simulationInput, [field.key]: event.target.value === 'true' })}>
                        <option value="true">true</option><option value="false">false</option>
                      </select>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <>
                <textarea className="h-72 w-full rounded-xl border border-slate-300 p-3 font-mono text-xs" value={jsonDraft} onChange={(event) => setJsonDraft(event.target.value)} />
                <Button variant="outline" onClick={() => setSimulationInput(JSON.parse(jsonDraft))}>Aplicar JSON</Button>
              </>
            )}
            <Button className="w-full" onClick={runSimulation}>Ejecutar prueba</Button>
          </CardContent>
        </Card>

        <Card className="col-span-12 xl:col-span-8">
          <CardHeader><CardTitle>Resultados</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Estado final</p>
              <p className="text-3xl font-bold">{lastEvaluation.finalAction}</p>
              <p className="text-sm text-slate-500">Regla ganadora: {lastEvaluation.winningRuleId ?? 'Ninguna'}</p>
            </div>
            <div>
              <h3 className="mb-2 font-semibold">Reglas evaluadas</h3>
              <div className="space-y-2">
                {lastEvaluation.breakdown.map((item) => (
                  <div key={item.ruleId} className="rounded-lg border border-slate-200 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="font-medium">{item.ruleId}</p>
                      <Badge variant={item.passed ? 'success' : 'danger'}>{item.passed ? 'PASS' : 'FAIL'}</Badge>
                    </div>
                    {item.conditionResults.map((condition) => (
                      <p key={condition.id} className="text-xs text-slate-600">{condition.var} {condition.op} {String(condition.value)} → actual {String(condition.actual)}</p>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold">¿Por qué esta decisión?</h3>
              <ol className="list-decimal space-y-1 pl-4 text-sm text-slate-700">
                {lastEvaluation.explanation.map((step) => <li key={step}>{step}</li>)}
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">Logs técnicos <Button variant="outline" onClick={() => setShowLogs((prev) => !prev)}><Terminal className="mr-2 h-4 w-4" /> &gt;_</Button></CardTitle>
        </CardHeader>
        {showLogs && (
          <CardContent>
            <div className="max-h-48 overflow-auto rounded-xl bg-slate-950 p-3 font-mono text-xs">
              {lastEvaluation.logs.map((log, index) => (
                <p key={index} className={log.level === 'PASS' ? 'text-emerald-300' : log.level === 'FAIL' ? 'text-rose-300' : log.level === 'WARN' ? 'text-amber-300' : 'text-sky-300'}>
                  [{log.level}] {log.message}
                </p>
              ))}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
