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

type Language = 'en' | 'es';

const copy = {
  en: {
    subtitle: 'Build decision policies visually. Explain decisions. Share scenarios.',
    run: 'Run',
    validate: 'Validate',
    share: 'Share',
    builder: 'Builder',
    simple: 'Simple',
    advanced: 'Advanced',
    explain: 'Explain',
    strict: 'Strict',
    langLabel: 'Language',
    playground: 'Playground',
    docs: 'Docs',
    about: 'About',
    tryFast: 'Try it in 10 seconds',
    tryFastSteps: '1) Load demo facts 2) Press Run 3) Expand “Why this decision?” to explain the result.',
    runDemo: 'Run Demo',
    rulesetJson: 'RuleSet JSON',
    factsTitle: 'Facts',
    factsHelper: 'Use the guided facts builder or load defaults for a quick scenario.',
    loadFacts: 'Load example facts',
    jsonPreview: 'JSON preview',
    output: 'Results (easy view)',
    resultSummary: 'Quick summary',
    decision: 'Decision',
    approve: 'Approved',
    reject: 'Rejected',
    review: 'Needs review',
    matchedRules: 'Matched rules',
    matchedRulesHelp: 'Shows which rules were triggered with the current facts.',
    tags: 'Tags',
    tagsHelp: 'Quick labels to identify the outcome type.',
    noTags: 'No tags',
    whyDecision: 'Why this decision?',
    whyDecisionHelp: 'Human explanation generated from the rules and facts.',
    rawJson: 'Raw JSON (advanced)',
    none: 'None',
    explainHint: 'Enable Explain to generate a decision narrative.',
    docsBody: 'Use /validate to verify rule integrity, /evaluate for runtime decisions, and /health for service health.',
    aboutBody: 'A polished demo interface for business-friendly decision policy authoring.',
    evaluationComplete: 'Evaluation complete',
    localFallback: 'API not configured, used local evaluation fallback.',
    unknownError: 'Unknown error while evaluating.',
    validationSkipped: 'API not configured. Rule validation skipped.',
    validationReady: 'Rules are valid. Ready to share.',
    validationFailed: 'Validation failed.',
    inserted: 'Inserted',
    ruleManager: {
      title: 'Rules',
      subtitle: 'Create visual policies your team can understand at a glance.',
      addRule: 'Add Rule',
      noRules: 'No rules yet. Add one to get started.',
      priority: 'Priority',
      ifLabel: 'IF',
      andLabel: 'AND',
      thenLabel: 'THEN',
      edit: 'Edit',
      duplicate: 'Duplicate',
      delete: 'Delete'
    },
    ruleBuilder: {
      title: 'Rule Builder',
      subtitle: 'Build rules with a guided wizard, then insert directly into your ruleset.',
      stepTemplate: 'Step 1: Template',
      stepConditions: 'Step 2: Conditions',
      stepOutcome: 'Step 3: Outcome',
      templateHints: {
        Loan: 'Use credit score and debt-to-income ratio to route application outcomes.',
        Fraud: 'Use transaction velocity, location mismatch, and amount thresholds to flag risk.',
        Discount: 'Use basket value and customer loyalty to personalize discount decisions.'
      },
      ruleIdPlaceholder: 'Rule ID',
      priorityPlaceholder: 'Priority',
      fieldPlaceholder: 'Field',
      valuePlaceholder: 'Value',
      addCondition: 'Condition',
      tagsPlaceholder: 'tags (comma-separated)',
      insertRule: 'Insert Rule',
      insertAndRun: 'Insert & Run'
    }
  },
  es: {
    subtitle: 'Crea políticas de decisión visualmente. Explica decisiones. Comparte escenarios.',
    run: 'Ejecutar',
    validate: 'Validar',
    share: 'Compartir',
    builder: 'Constructor',
    simple: 'Simple',
    advanced: 'Avanzado',
    explain: 'Explicar',
    strict: 'Estricto',
    langLabel: 'Idioma',
    playground: 'Pruebas',
    docs: 'Documentación',
    about: 'Acerca de',
    tryFast: 'Pruébalo en 10 segundos',
    tryFastSteps: '1) Carga datos demo 2) Presiona Ejecutar 3) Abre “¿Por qué esta decisión?” para explicar el resultado.',
    runDemo: 'Ejecutar demo',
    rulesetJson: 'JSON de reglas',
    factsTitle: 'Datos',
    factsHelper: 'Usa el editor guiado o carga datos por defecto para una prueba rápida.',
    loadFacts: 'Cargar datos de ejemplo',
    jsonPreview: 'Vista previa JSON',
    output: 'Resultados (vista fácil)',
    resultSummary: 'Resumen rápido',
    decision: 'Decisión',
    approve: 'Aprobado',
    reject: 'Rechazado',
    review: 'Necesita revisión',
    matchedRules: 'Reglas aplicadas',
    matchedRulesHelp: 'Muestra qué reglas se activaron con los datos actuales.',
    tags: 'Etiquetas',
    tagsHelp: 'Etiquetas rápidas para identificar el tipo de resultado.',
    noTags: 'Sin etiquetas',
    whyDecision: '¿Por qué esta decisión?',
    whyDecisionHelp: 'Explicación en lenguaje humano basada en reglas y datos.',
    rawJson: 'JSON crudo (avanzado)',
    none: 'Ninguna',
    explainHint: 'Activa Explicar para generar una narrativa de decisión.',
    docsBody: 'Usa /validate para verificar reglas, /evaluate para decisiones en ejecución y /health para estado del servicio.',
    aboutBody: 'Una interfaz pulida para crear políticas de decisión fáciles para negocio.',
    evaluationComplete: 'Evaluación completada',
    localFallback: 'API no configurada, se usó la evaluación local.',
    unknownError: 'Error desconocido al evaluar.',
    validationSkipped: 'API no configurada. Se omitió la validación.',
    validationReady: 'Las reglas son válidas. Listas para compartir.',
    validationFailed: 'La validación falló.',
    inserted: 'Insertada',
    ruleManager: {
      title: 'Reglas',
      subtitle: 'Crea políticas visuales que tu equipo pueda entender rápidamente.',
      addRule: 'Agregar regla',
      noRules: 'Aún no hay reglas. Agrega una para comenzar.',
      priority: 'Prioridad',
      ifLabel: 'SI',
      andLabel: 'Y',
      thenLabel: 'ENTONCES',
      edit: 'Editar',
      duplicate: 'Duplicar',
      delete: 'Eliminar'
    },
    ruleBuilder: {
      title: 'Constructor de reglas',
      subtitle: 'Crea reglas con asistente y luego insértalas directamente al set de reglas.',
      stepTemplate: 'Paso 1: Plantilla',
      stepConditions: 'Paso 2: Condiciones',
      stepOutcome: 'Paso 3: Resultado',
      templateHints: {
        Loan: 'Usa score crediticio y relación deuda/ingreso para decidir resultados.',
        Fraud: 'Usa velocidad de transacciones, ubicación y monto para marcar riesgo.',
        Discount: 'Usa valor de carrito y lealtad del cliente para personalizar descuentos.'
      },
      ruleIdPlaceholder: 'ID de regla',
      priorityPlaceholder: 'Prioridad',
      fieldPlaceholder: 'Campo',
      valuePlaceholder: 'Valor',
      addCondition: 'Condición',
      tagsPlaceholder: 'etiquetas (separadas por coma)',
      insertRule: 'Insertar regla',
      insertAndRun: 'Insertar y ejecutar'
    }
  }
} as const;

export default function HomePage() {
  const [mode, setMode] = useState<'simple' | 'advanced'>('simple');
  const [explain, setExplain] = useState(true);
  const [strict, setStrict] = useState(false);
  const [running, setRunning] = useState(false);
  const [ruleSet, setRuleSet] = useState<RuleSet>(defaultRuleSet);
  const [facts, setFacts] = useState<Facts>(defaultFacts);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [result, setResult] = useState(() => evaluateLocally(defaultRuleSet, defaultFacts, true));
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>('es');
  const t = copy[language];

  const decisionVariant = useMemo(() => {
    if (result.decision === 'APPROVE') return 'success';
    if (result.decision === 'REJECT') return 'danger';
    return 'warning';
  }, [result.decision]);

  const decisionLabel = useMemo(() => {
    if (result.decision === 'APPROVE') return t.approve;
    if (result.decision === 'REJECT') return t.reject;
    return t.review;
  }, [result.decision, t]);

  const matchedRuleIds = Array.isArray(result.matchedRuleIds) ? result.matchedRuleIds : [];
  const resultTags = Array.isArray(result.tags) ? result.tags : [];

  async function runEvaluation() {
    setRunning(true);
    setError(null);
    try {
      const response = await evaluateRuleSet({ ruleSet, facts, explain, strict });
      if (response) {
        setResult({
          ...response,
          matchedRuleIds: Array.isArray(response.matchedRuleIds) ? response.matchedRuleIds : [],
          tags: Array.isArray(response.tags) ? response.tags : []
        });
        toast.success(t.evaluationComplete);
      } else {
        const local = evaluateLocally(ruleSet, facts, explain);
        setResult(local);
        toast.info(t.localFallback);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : t.unknownError;
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
        toast.info(t.validationSkipped);
        return;
      }
      if (response.valid) toast.success(t.validationReady);
      else toast.error(response.errors.join('\n') || t.validationFailed);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t.validationFailed);
    }
  }

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6">
      <header className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-soft backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold md:text-3xl">Lightweight Rules Engine</h1>
            <p className="mt-1 text-slate-600">{t.subtitle}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={runEvaluation} disabled={running}><Play className="mr-2 h-4 w-4" />{t.run}</Button>
            <Button variant="secondary" onClick={runValidation}><CheckCircle2 className="mr-2 h-4 w-4" />{t.validate}</Button>
            <Button variant="outline"><Share2 className="mr-2 h-4 w-4" />{t.share}</Button>
            <Button variant="outline" onClick={() => setBuilderOpen(true)}><FlaskConical className="mr-2 h-4 w-4" />{t.builder}</Button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-6 text-sm">
          <label className="flex items-center gap-2">{t.simple} <Switch checked={mode === 'advanced'} onCheckedChange={(checked) => setMode(checked ? 'advanced' : 'simple')} /> {t.advanced}</label>
          <label className="flex items-center gap-2">{t.explain} <Switch checked={explain} onCheckedChange={setExplain} /></label>
          <label className="flex items-center gap-2">{t.strict} <Switch checked={strict} onCheckedChange={setStrict} /></label>
          <label className="flex items-center gap-2">
            {t.langLabel}
            <select
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
              value={language}
              onChange={(event) => setLanguage(event.target.value as Language)}
            >
              <option value="es">Español</option>
              <option value="en">English</option>
            </select>
          </label>
        </div>
      </header>

      <Tabs defaultValue="playground">
        <TabsList>
          <TabsTrigger value="playground">{t.playground}</TabsTrigger>
          <TabsTrigger value="docs">{t.docs}</TabsTrigger>
          <TabsTrigger value="about">{t.about}</TabsTrigger>
        </TabsList>

        <TabsContent value="playground" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t.tryFast}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-slate-600">{t.tryFastSteps}</p>
              <Button variant="secondary" onClick={() => { setFacts(defaultFacts); void runEvaluation(); }}>{t.runDemo}</Button>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-4">
              {mode === 'simple' ? (
                <RuleManager
                  ruleSet={ruleSet}
                  copy={t.ruleManager}
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
                  <CardHeader><CardTitle>{t.rulesetJson}</CardTitle></CardHeader>
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
                <CardHeader><CardTitle>{t.factsTitle}</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {mode === 'simple' ? (
                    <>
                      <p className="text-sm text-slate-600">{t.factsHelper}</p>
                      <Button variant="secondary" onClick={() => setFacts(defaultFacts)}>{t.loadFacts}</Button>
                      <Collapsible>
                        <CollapsibleTrigger className="text-sm font-medium text-slate-700">{t.jsonPreview}</CollapsibleTrigger>
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
                <CardHeader><CardTitle>{t.output}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500">{t.resultSummary}</p>
                    <p className="mt-1 text-sm text-slate-700">{decisionLabel}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-slate-500">{t.decision}</p>
                    <Badge variant={decisionVariant} className="text-base">{result.decision}</Badge>
                  </div>

                  <div>
                    <p className="flex items-center gap-1 text-xs uppercase tracking-wide text-slate-500">{t.matchedRules} <Info className="h-3.5 w-3.5" title={t.matchedRulesHelp} /></p>
                    <p className="text-sm text-slate-700">{matchedRuleIds.join(', ') || t.none}</p>
                  </div>

                  <div>
                    <p className="mb-2 flex items-center gap-1 text-xs uppercase tracking-wide text-slate-500">{t.tags} <Info className="h-3.5 w-3.5" title={t.tagsHelp} /></p>
                    <div className="flex flex-wrap gap-2">
                      {resultTags.length > 0 ? resultTags.map((tag) => <Badge key={tag} variant="secondary">{tag}</Badge>) : <p className="text-sm text-slate-600">{t.noTags}</p>}
                    </div>
                  </div>

                  <Collapsible>
                    <CollapsibleTrigger className="flex items-center gap-1 text-sm font-semibold text-slate-700">{t.whyDecision} <Info className="h-3.5 w-3.5" title={t.whyDecisionHelp} /></CollapsibleTrigger>
                    <CollapsibleContent className="pt-2 text-sm text-slate-600">{result.explanation ?? t.explainHint}</CollapsibleContent>
                  </Collapsible>

                  <Separator />

                  <Collapsible>
                    <CollapsibleTrigger className="text-sm text-slate-700">{t.rawJson}</CollapsibleTrigger>
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
          <Card><CardContent className="pt-5 text-sm text-slate-600">{t.docsBody}</CardContent></Card>
        </TabsContent>
        <TabsContent value="about" className="mt-4">
          <Card><CardContent className="pt-5 text-sm text-slate-600">{t.aboutBody}</CardContent></Card>
        </TabsContent>
      </Tabs>

      <div className="sticky bottom-0 z-30 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-soft md:hidden">
        <div className="flex gap-2">
          <Button className="flex-1" onClick={runEvaluation}>{t.run}</Button>
          <Button className="flex-1" variant="secondary" onClick={() => setBuilderOpen(true)}>{t.builder}</Button>
        </div>
      </div>

      <RuleBuilder
        open={builderOpen}
        onOpenChange={setBuilderOpen}
        copy={t.ruleBuilder}
        onInsert={(rule, runAfterInsert) => {
          setRuleSet((prev) => ({ ...prev, rules: [...prev.rules, rule] }));
          toast.success(`${t.inserted} ${rule.id}`);
          if (runAfterInsert) void runEvaluation();
        }}
      />
    </main>
  );
}
