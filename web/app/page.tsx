'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import { CheckCircle2, FlaskConical, Info, Play, Share2 } from 'lucide-react';
import { RuleBuilder } from '@/components/playground/rule-builder';
import { RuleManager } from '@/components/playground/rule-manager';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { defaultFacts, defaultRuleSet } from '@/data/defaults';
import { evaluateRuleSet, validateRuleSet } from '@/lib/api';
import { evaluateLocally } from '@/lib/evaluate-local';
import { Facts, RuleSet } from '@/types/rules';
import { toast } from 'sonner';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

export default function HomePage() {
  // Architecture decision: keep API + local evaluator in one page container for demo speed and a predictable state model.
  const [mode, setMode] = useState<'simple' | 'advanced'>('simple');
  const [explain, setExplain] = useState(true);
  const [strict, setStrict] = useState(false);
  const [running, setRunning] = useState(false);
  const [ruleSet, setRuleSet] = useState<RuleSet>(defaultRuleSet);
  const [facts, setFacts] = useState<Facts>(defaultFacts);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [result, setResult] = useState(() => evaluateLocally(defaultRuleSet, defaultFacts, true));
  const [error, setError] = useState<string | null>(null);

  const decisionVariant = useMemo(() => {
    if (result.decision === 'APPROVE') return 'success';
    if (result.decision === 'REJECT') return 'danger';
    return 'warning';
  }, [result.decision]);

  async function runEvaluation() {
    setRunning(true);
    setError(null);
    try {
      const response = await evaluateRuleSet({ ruleSet, facts, explain, strict });
      if (response) {
        setResult(response);
        toast.success('Evaluation complete');
      } else {
        const local = evaluateLocally(ruleSet, facts, explain);
        setResult(local);
        toast.info('API not configured, used local evaluation fallback.');
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error while evaluating.';
      setError(message);
      toast.error(message);
    } finally {
      setRunning(false);
    }
  }

  async function runValidation() {
    try {
      const response = await validateRuleSet(ruleSet);
      if (!response) {
        toast.info('API not configured. Rule validation skipped.');
        return;
      }
      if (response.valid) toast.success('Rules are valid. Ready to share.');
      else toast.error(response.errors.join('\n') || 'Validation failed.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Validation failed.');
    }
  }

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6">
      <header className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-soft backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold md:text-3xl">Lightweight Rules Engine</h1>
            <p className="mt-1 text-slate-600">Build decision policies visually. Explain decisions. Share scenarios.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={runEvaluation} disabled={running}><Play className="mr-2 h-4 w-4" />Run</Button>
            <Button variant="secondary" onClick={runValidation}><CheckCircle2 className="mr-2 h-4 w-4" />Validate</Button>
            <Button variant="outline"><Share2 className="mr-2 h-4 w-4" />Share</Button>
            <Button variant="outline" onClick={() => setBuilderOpen(true)}><FlaskConical className="mr-2 h-4 w-4" />Builder</Button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-6 text-sm">
          <label className="flex items-center gap-2">Simple <Switch checked={mode === 'advanced'} onCheckedChange={(checked) => setMode(checked ? 'advanced' : 'simple')} /> Advanced</label>
          <label className="flex items-center gap-2">Explain <Switch checked={explain} onCheckedChange={setExplain} /></label>
          <label className="flex items-center gap-2">Strict <Switch checked={strict} onCheckedChange={setStrict} /></label>
        </div>
      </header>

      <Tabs defaultValue="playground">
        <TabsList>
          <TabsTrigger value="playground">Playground</TabsTrigger>
          <TabsTrigger value="docs">Docs</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
        </TabsList>

        <TabsContent value="playground" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Try it in 10 seconds</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-slate-600">1) Load demo facts 2) Press Run 3) Expand “Why this decision?” to explain the result to stakeholders.</p>
              <Button variant="secondary" onClick={() => { setFacts(defaultFacts); void runEvaluation(); }}>Run Demo</Button>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-4">
              {mode === 'simple' ? (
                <RuleManager
                  ruleSet={ruleSet}
                  onAddRule={() => setBuilderOpen(true)}
                  onEdit={() => setBuilderOpen(true)}
                  onDelete={(ruleId) => setRuleSet((prev) => ({ ...prev, rules: prev.rules.filter((rule) => rule.id !== ruleId) }))}
                  onDuplicate={(ruleId) => setRuleSet((prev) => {
                    const rule = prev.rules.find((r) => r.id === ruleId);
                    if (!rule) return prev;
                    return { ...prev, rules: [...prev.rules, { ...rule, id: `${rule.id}-COPY` }] };
                  })}
                />
              ) : (
                <Card>
                  <CardHeader><CardTitle>RuleSet JSON</CardTitle></CardHeader>
                  <CardContent>
                    <MonacoEditor height="400px" defaultLanguage="json" value={JSON.stringify(ruleSet, null, 2)} onChange={(value) => {
                      try { if (value) setRuleSet(JSON.parse(value) as RuleSet); } catch {}
                    }} />
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle>Facts</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {mode === 'simple' ? (
                    <>
                      <p className="text-sm text-slate-600">Use the guided facts builder or load defaults for a quick scenario.</p>
                      <Button variant="secondary" onClick={() => setFacts(defaultFacts)}>Load example facts</Button>
                      <Collapsible>
                        <CollapsibleTrigger className="text-sm font-medium text-slate-700">JSON preview</CollapsibleTrigger>
                        <CollapsibleContent>
                          <pre className="mt-2 overflow-auto rounded-xl bg-slate-900 p-3 text-xs text-slate-100">{JSON.stringify(facts, null, 2)}</pre>
                        </CollapsibleContent>
                      </Collapsible>
                    </>
                  ) : (
                    <MonacoEditor height="260px" defaultLanguage="json" value={JSON.stringify(facts, null, 2)} onChange={(value) => {
                      try { if (value) setFacts(JSON.parse(value) as Facts); } catch {}
                    }} />
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Output</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <Badge variant={decisionVariant} className="text-base">{result.decision}</Badge>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Matched rules</p>
                    <p className="text-sm text-slate-700">{result.matchedRuleIds.join(', ') || 'None'}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.tags.map((tag) => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                  </div>
                  <Collapsible>
                    <CollapsibleTrigger className="text-sm font-semibold text-slate-700">Why this decision?</CollapsibleTrigger>
                    <CollapsibleContent className="pt-2 text-sm text-slate-600">{result.explanation ?? 'Enable Explain to generate a decision narrative.'}</CollapsibleContent>
                  </Collapsible>
                  <Separator />
                  <Collapsible>
                    <CollapsibleTrigger className="text-sm text-slate-700">Raw JSON</CollapsibleTrigger>
                    <CollapsibleContent>
                      <pre className="mt-2 overflow-auto rounded-xl bg-slate-900 p-3 text-xs text-slate-100">{JSON.stringify(result.raw, null, 2)}</pre>
                    </CollapsibleContent>
                  </Collapsible>
                  {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="docs" className="mt-4">
          <Card><CardContent className="pt-5 text-sm text-slate-600">Use /validate to verify rule integrity, /evaluate for runtime decisions, and /health for service health.</CardContent></Card>
        </TabsContent>
        <TabsContent value="about" className="mt-4">
          <Card><CardContent className="pt-5 text-sm text-slate-600">A polished demo interface for business-friendly decision policy authoring.</CardContent></Card>
        </TabsContent>
      </Tabs>

      <div className="sticky bottom-0 z-30 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-soft md:hidden">
        <div className="flex gap-2">
          <Button className="flex-1" onClick={runEvaluation}>Run</Button>
          <Button className="flex-1" variant="secondary" onClick={() => setBuilderOpen(true)}>Builder</Button>
        </div>
      </div>

      <RuleBuilder
        open={builderOpen}
        onOpenChange={setBuilderOpen}
        onInsert={(rule, runAfterInsert) => {
          setRuleSet((prev) => ({ ...prev, rules: [...prev.rules, rule] }));
          toast.success(`Inserted ${rule.id}`);
          if (runAfterInsert) void runEvaluation();
        }}
      />
    </main>
  );
}
