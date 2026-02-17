'use client';

import { useMutation } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { executeRules, validateRules } from '@/lib/apiClient';
import { useRulesStore } from '@/store/useRulesStore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogDrawer } from '@/components/terminal/log-drawer';

export function SimulateWorkbench() {
  const { rules, input, setInput, result, setResult, setRules } = useRulesStore();
  const [locale, setLocale] = useState<'es' | 'en'>('es');

  const executeMutation = useMutation({
    mutationFn: executeRules,
    onSuccess: (data) => setResult(data)
  });

  const validateMutation = useMutation({ mutationFn: validateRules });

  const payload = useMemo(
    () => ({ rules, input, options: { explain: true, strict: true, locale } }),
    [rules, input, locale]
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Probar / Simular</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setInput({ creditScore: 720, dti: 0.29, age: 33, income: 4500, requestedAmount: 15000 })}>
              Cargar datos de ejemplo
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                setRules([
                  {
                    id: 'RULE-APPROVE-01',
                    name: 'Demo approve',
                    priority: 1,
                    enabled: true,
                    action: 'APPROVE',
                    conditions: [
                      { id: crypto.randomUUID(), variable: 'creditScore', operator: '>=', value: 700 },
                      { id: crypto.randomUUID(), variable: 'dti', operator: '<=', value: 0.35 }
                    ]
                  }
                ])
              }
            >
              Cargar reglas demo
            </Button>
            <Button onClick={() => validateMutation.mutate({ rules })}>Validar reglas</Button>
            <Button onClick={() => executeMutation.mutate(payload)}>Ejecutar</Button>
            <select className="h-10 rounded-xl border px-3" value={locale} onChange={(e) => setLocale(e.target.value as 'es' | 'en')}>
              <option value="es">es</option>
              <option value="en">en</option>
            </select>
          </div>

          <Input value={JSON.stringify(input)} onChange={(e) => setInput(JSON.parse(e.target.value || '{}'))} />

          {result ? (
            <Tabs defaultValue="summary">
              <div className="flex items-center justify-between">
                <TabsList>
                  <TabsTrigger value="summary">Resumen</TabsTrigger>
                  <TabsTrigger value="evaluated">Reglas evaluadas</TabsTrigger>
                  <TabsTrigger value="steps">Paso a paso</TabsTrigger>
                  <TabsTrigger value="logs">Logs técnicos</TabsTrigger>
                </TabsList>
                <LogDrawer logs={result.logs ?? []} payloadSummary={`rules=${rules.length} input=${Object.keys(input).length} fields`} />
              </div>

              <TabsContent value="summary" className="space-y-3 pt-3">
                <Badge variant={result.decision === 'APPROVE' ? 'success' : result.decision === 'REJECT' ? 'danger' : 'warning'}>
                  {result.decision}
                </Badge>
                <div>
                  <h4 className="font-semibold">Regla ganadora</h4>
                  <p>{result.matchedRule ? `${result.matchedRule.id} | p=${result.matchedRule.priority} | ${result.matchedRule.action}` : 'Sin match'}</p>
                </div>
                <div>
                  <h4 className="font-semibold">¿Por qué esta decisión?</h4>
                  <pre className="rounded bg-slate-100 p-2 text-xs">{result.explanation ?? 'No explanation returned by API'}</pre>
                </div>
              </TabsContent>

              <TabsContent value="evaluated" className="pt-3">
                <ul className="space-y-2 text-sm">
                  {result.evaluatedRules.map((item) => (
                    <li key={item.ruleId}>{`${item.order}. ${item.ruleId} => ${item.passed ? 'PASS' : 'FAIL'} (${item.action})`}</li>
                  ))}
                </ul>
              </TabsContent>

              <TabsContent value="steps" className="pt-3 text-sm">
                {result.explanation ?? 'No step-by-step explanation'}
              </TabsContent>

              <TabsContent value="logs" className="pt-3">
                <pre className="rounded bg-slate-950 p-3 text-xs text-emerald-300">{(result.logs ?? []).join('\n') || 'No API logs available'}</pre>
              </TabsContent>
            </Tabs>
          ) : null}
        </CardContent>
      </Card>

      {validateMutation.data?.errors?.length ? (
        <Card>
          <CardContent className="pt-5 text-sm text-rose-600">
            {validateMutation.data.errors.map((error) => (
              <p key={`${error.ruleId}-${error.message}`}>{`${error.ruleId ?? 'Global'}: ${error.message}`}</p>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
