'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import { CheckCircle2, MonitorCog, Play, TerminalSquare } from 'lucide-react';
import { RuleBuilder } from '@/components/playground/rule-builder';
import { RuleFlowBuilder } from '@/components/playground/rule-flow-builder';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { defaultFacts, defaultRuleSet } from '@/data/defaults';
import { evaluateRuleSet, validateRuleSet } from '@/lib/api';
import { evaluateLocally } from '@/lib/evaluate-local';
import { EvaluationResult, Facts, Rule, RuleSet } from '@/types/rules';
import { toast } from 'sonner';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

type ViewMode = 'flow' | 'table' | 'json';
type ResultView = 'summary' | 'activated' | 'step' | 'logs';

export default function HomePage() {
  const [ruleSet, setRuleSet] = useState<RuleSet>(defaultRuleSet);
  const [facts, setFacts] = useState<Facts>(defaultFacts);
  const [result, setResult] = useState<EvaluationResult>({ decision: 'REVIEW', matchedRuleIds: [], tags: [] });
  const [viewMode, setViewMode] = useState<ViewMode>('flow');
  const [resultView, setResultView] = useState<ResultView>('summary');
  const [builderOpen, setBuilderOpen] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [debugMode, setDebugMode] = useState(true);
  const [productionMode, setProductionMode] = useState(false);
  const [selectedRuleId, setSelectedRuleId] = useState(ruleSet.rules[0]?.id);
  const [activeNodeId, setActiveNodeId] = useState<string>('input');
  const [running, setRunning] = useState(false);

  const score = result.score ?? (result.decision === 'APPROVE' ? 90 : result.decision === 'REJECT' ? 25 : 60);

  const stateTone =
    result.decision === 'APPROVE'
      ? { label: 'APPROVE', className: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50' }
      : result.decision === 'REJECT'
        ? { label: 'REJECT', className: 'bg-rose-500/20 text-rose-300 border-rose-500/50' }
        : { label: 'REVIEW', className: 'bg-amber-500/20 text-amber-300 border-amber-500/50' };

  async function animateExecution(nextResult: EvaluationResult) {
    const sequence = ['input', ...(nextResult.steps ?? []).map((_, idx) => {
      const step = nextResult.steps?.[idx];
      return `${step?.ruleId}-condition-${(nextResult.steps ?? []).filter((s) => s.ruleId === step?.ruleId).indexOf(step!)}`;
    })];
    if (nextResult.winnerRuleId) sequence.push(`${nextResult.winnerRuleId}-result`);

    for (const nodeId of sequence) {
      setActiveNodeId(nodeId);
      await new Promise((resolve) => setTimeout(resolve, 280));
    }
  }

  async function runEvaluation() {
    setRunning(true);
    try {
      const apiResponse = await evaluateRuleSet(ruleSet, facts, { explain: true, trace: debugMode || productionMode });
      const localResult = evaluateLocally(ruleSet, facts, true);
      const nextResult: EvaluationResult = apiResponse
        ? { ...localResult, ...apiResponse, logs: localResult.logs, steps: localResult.steps, score: localResult.score, winnerRuleId: localResult.winnerRuleId }
        : localResult;

      setResult(nextResult);
      setTerminalOpen(true);
      setResultView('summary');
      await animateExecution(nextResult);
      toast.success('Evaluation complete');
    } catch {
      toast.error('Evaluation failed');
    } finally {
      setRunning(false);
    }
  }

  async function runValidation() {
    const response = await validateRuleSet(ruleSet);
    if (!response) {
      toast.info('API not configured. Local visual mode active.');
      return;
    }
    if (response.valid) toast.success('Rules are valid.');
    else toast.error(response.errors.join('\n'));
  }

  const sortedRules = useMemo(() => [...ruleSet.rules].sort((a, b) => a.priority - b.priority), [ruleSet.rules]);

  function updateRule(ruleId: string, patch: Partial<Rule>) {
    setRuleSet((prev) => ({ ...prev, rules: prev.rules.map((rule) => (rule.id === ruleId ? { ...rule, ...patch } : rule)) }));
  }

  function updateCondition(ruleId: string, index: number, patch: Partial<Rule['conditions'][number]>) {
    setRuleSet((prev) => ({
      ...prev,
      rules: prev.rules.map((rule) =>
        rule.id === ruleId
          ? {
              ...rule,
              conditions: rule.conditions.map((condition, conditionIdx) => (conditionIdx === index ? { ...condition, ...patch } : condition))
            }
          : rule
      )
    }));
  }

  function reorderRules(sourceId: string, targetId: string) {
    const ordered = [...sortedRules];
    const sourceIndex = ordered.findIndex((rule) => rule.id === sourceId);
    const targetIndex = ordered.findIndex((rule) => rule.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;
    const [moved] = ordered.splice(sourceIndex, 1);
    ordered.splice(targetIndex, 0, moved);
    setRuleSet((prev) => ({
      ...prev,
      rules: ordered.map((rule, idx) => ({ ...rule, priority: idx + 1 }))
    }));
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-4 px-4 py-4 lg:grid-cols-[220px_1fr]">
        <aside className="rounded-2xl border border-slate-800 bg-slate-900 p-4 lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)]">
          <div className="flex items-center gap-2 text-cyan-300"><MonitorCog className="h-4 w-4" /> Rule Engine</div>
          <p className="mt-2 text-xs text-slate-400">Visual + técnico con trazabilidad en vivo.</p>
          <div className="mt-6 space-y-2 text-sm">
            <button className="w-full rounded-lg bg-slate-800 px-3 py-2 text-left">Builder</button>
            <button className="w-full rounded-lg px-3 py-2 text-left text-slate-400">Simulación</button>
            <button className="w-full rounded-lg px-3 py-2 text-left text-slate-400">Auditoría</button>
          </div>
        </aside>

        <section className="space-y-4">
          <header className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h1 className="text-2xl font-semibold">Lightweight Rules Engine · Visual Debugger</h1>
                <p className="text-sm text-slate-400">Flujo gráfico + simulación paso a paso + logs estilo Azure CLI.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={runEvaluation} disabled={running}><Play className="mr-2 h-4 w-4" />Simular</Button>
                <Button variant="secondary" onClick={runValidation}><CheckCircle2 className="mr-2 h-4 w-4" />Validar</Button>
                <Button variant="outline" onClick={() => setBuilderOpen(true)}>Nueva regla</Button>
                <Button variant="outline" onClick={() => setTerminalOpen((prev) => !prev)}><TerminalSquare className="mr-2 h-4 w-4" />Terminal</Button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-4">
              <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
                <TabsList>
                  <TabsTrigger value="flow">Vista Flujo</TabsTrigger>
                  <TabsTrigger value="table">Vista Tabla</TabsTrigger>
                  <TabsTrigger value="json">Vista JSON</TabsTrigger>
                </TabsList>
              </Tabs>
              <label className="flex items-center gap-2 text-sm">Debug <Switch checked={debugMode} onCheckedChange={setDebugMode} /></label>
              <label className="flex items-center gap-2 text-sm">Producción <Switch checked={productionMode} onCheckedChange={setProductionMode} /></label>
            </div>
          </header>

          {viewMode === 'flow' && (
            <RuleFlowBuilder
              ruleSet={ruleSet}
              selectedRuleId={selectedRuleId}
              activeNodeId={activeNodeId}
              onSelectRule={setSelectedRuleId}
              onUpdateRule={updateRule}
              onUpdateCondition={updateCondition}
              onAddRule={() => setBuilderOpen(true)}
              onReorderRules={reorderRules}
            />
          )}

          {viewMode === 'table' && (
            <Card className="border-slate-800 bg-slate-900">
              <CardHeader><CardTitle>Vista tabla técnica</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-auto rounded-xl border border-slate-800">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-800 text-slate-300">
                      <tr><th className="p-2 text-left">Priority</th><th className="text-left">Rule</th><th className="text-left">Conditions</th><th className="text-left">Decision</th></tr>
                    </thead>
                    <tbody>
                      {sortedRules.map((rule) => (
                        <tr key={rule.id} className="border-t border-slate-800">
                          <td className="p-2">{rule.priority}</td>
                          <td>{rule.id}</td>
                          <td>{rule.conditions.map((c) => `${c.field} ${c.operator} ${String(c.value)}`).join(' AND ')}</td>
                          <td><Badge variant={rule.decision === 'APPROVE' ? 'success' : rule.decision === 'REJECT' ? 'danger' : 'warning'}>{rule.decision}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {viewMode === 'json' && (
            <Card className="border-slate-800 bg-slate-900">
              <CardHeader><CardTitle>Vista JSON</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <MonacoEditor height="360px" defaultLanguage="json" value={JSON.stringify(ruleSet, null, 2)} onChange={(value) => {
                  try { if (value) setRuleSet(JSON.parse(value) as RuleSet); } catch {}
                }} />
                <MonacoEditor height="220px" defaultLanguage="json" value={JSON.stringify(facts, null, 2)} onChange={(value) => {
                  try { if (value) setFacts(JSON.parse(value) as Facts); } catch {}
                }} />
              </CardContent>
            </Card>
          )}

          <Card className="border-slate-800 bg-slate-900">
            <CardHeader><CardTitle>Resultados interactivos</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className={`rounded-xl border px-4 py-3 text-lg font-semibold ${stateTone.className}`}>{stateTone.label}</div>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3"><p className="text-xs text-slate-400">Score calculado</p><p className="text-xl font-semibold">{score}</p></div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3"><p className="text-xs text-slate-400">Regla ganadora</p><p className="text-xl font-semibold">{result.winnerRuleId ?? 'N/A'}</p></div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3"><p className="text-xs text-slate-400">Tags</p><p className="text-sm">{result.tags.join(', ') || 'Sin tags'}</p></div>
              </div>

              <Tabs value={resultView} onValueChange={(value) => setResultView(value as ResultView)}>
                <TabsList>
                  <TabsTrigger value="summary">Resumen</TabsTrigger>
                  <TabsTrigger value="activated">Reglas activadas</TabsTrigger>
                  <TabsTrigger value="step">Paso a paso</TabsTrigger>
                  <TabsTrigger value="logs">Logs técnicos</TabsTrigger>
                </TabsList>
                <TabsContent value="summary" className="mt-3 text-sm text-slate-300">{result.explanation ?? 'Ejecuta una simulación para ver la explicación.'}</TabsContent>
                <TabsContent value="activated" className="mt-3 space-y-2">
                  {result.matchedRuleIds.length > 0 ? result.matchedRuleIds.map((id) => <Badge key={id} variant="secondary">{id}</Badge>) : <p className="text-sm text-slate-400">Sin reglas activadas</p>}
                </TabsContent>
                <TabsContent value="step" className="mt-3 space-y-2 text-sm">
                  {(result.steps ?? []).map((step, idx) => (
                    <div key={`${step.ruleId}-${idx}`} className="rounded-lg border border-slate-800 bg-slate-950 p-2">
                      <span className={step.passed ? 'text-emerald-300' : 'text-rose-300'}>{step.passed ? 'PASS' : 'FAIL'}</span> · {step.ruleId} · {step.conditionLabel}
                    </div>
                  ))}
                </TabsContent>
                <TabsContent value="logs" className="mt-3 space-y-1 font-mono text-xs">
                  {(result.logs ?? []).map((log, idx) => (
                    <div
                      key={`${log.level}-${idx}`}
                      className={
                        log.level === 'PASS' ? 'text-emerald-300' : log.level === 'FAIL' ? 'text-rose-300' : log.level === 'WARNING' ? 'text-amber-300' : 'text-cyan-300'
                      }
                    >
                      [{log.level}] {log.message}
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </section>
      </div>

      {terminalOpen && (
        <div className="sticky bottom-0 z-50 border-t border-slate-700 bg-[#0b1220] p-3 font-mono text-xs">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-slate-300">_ Terminal · Azure CLI style</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => {
                const blob = new Blob([(result.logs ?? []).map((l) => `[${l.level}] ${l.message}`).join('\n')], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'rules-evaluation.log';
                link.click();
                URL.revokeObjectURL(url);
              }}>Export logs</Button>
              <Button size="sm" variant="secondary" onClick={() => setTerminalOpen(false)}>Cerrar</Button>
            </div>
          </div>
          <div className="max-h-48 overflow-auto rounded-lg border border-slate-800 bg-slate-950 p-2">
            {(result.logs ?? []).map((log, idx) => (
              <div
                key={`${log.level}-terminal-${idx}`}
                className={
                  log.level === 'PASS' ? 'text-emerald-300' : log.level === 'FAIL' ? 'text-rose-300' : log.level === 'WARNING' ? 'text-amber-300' : 'text-sky-300'
                }
              >
                [{log.level}] {log.message}
              </div>
            ))}
          </div>
        </div>
      )}

      <RuleBuilder
        open={builderOpen}
        onOpenChange={setBuilderOpen}
        copy={{
          title: 'Rule Builder',
          subtitle: 'Crea una nueva regla y añádela al flujo.',
          stepTemplate: 'Plantilla',
          stepConditions: 'Condiciones',
          stepOutcome: 'Resultado',
          templateHints: {
            Loan: 'Aprobación por score y dti',
            Fraud: 'Detección de fraude por señales',
            Discount: 'Descuento por fidelidad'
          },
          ruleIdPlaceholder: 'Rule ID',
          priorityPlaceholder: 'Priority',
          fieldPlaceholder: 'Variable',
          valuePlaceholder: 'Valor',
          addCondition: 'Agregar condición',
          tagsPlaceholder: 'tags separadas por coma',
          insertRule: 'Insertar regla',
          insertAndRun: 'Insertar y simular'
        }}
        onInsert={(rule, runAfterInsert) => {
          setRuleSet((prev) => ({ ...prev, rules: [...prev.rules, { ...rule, enabled: true }] }));
          if (runAfterInsert) void runEvaluation();
        }}
      />
    </main>
  );
}
