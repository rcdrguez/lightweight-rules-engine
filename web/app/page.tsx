'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { SaaSShell } from '@/components/layout/saas-shell';
import { defaultFacts, defaultRuleSet } from '@/data/defaults';
import { ExplainabilityPanel } from '@/features/results/explainability-panel';
import { ResultsPanel } from '@/features/results/results-panel';
import { RulesDecisionTable } from '@/features/rules/rules-decision-table';
import { InputSimulationPanel } from '@/features/simulation/input-simulation-panel';
import { evaluateRuleSet, validateRuleSet } from '@/lib/api';
import { evaluateLocally } from '@/lib/evaluate-local';
import { EvaluationResult, Facts, RuleSet } from '@/types/rules';

export default function HomePage() {
  const [ruleSet, setRuleSet] = useState<RuleSet>(defaultRuleSet);
  const [facts, setFacts] = useState<Facts>(defaultFacts);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<EvaluationResult>(() => evaluateLocally(defaultRuleSet, defaultFacts, true));
  const [darkMode, setDarkMode] = useState(false);
  const [changeLog, setChangeLog] = useState<string[]>(['Versión inicial cargada']);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const timeline = useMemo(() => {
    const ordered = [...ruleSet.rules].sort((a, b) => a.priority - b.priority);
    const firstMatch = result.matchedRuleIds[0];
    return ordered.map((rule) => {
      const matched = result.matchedRuleIds.includes(rule.id);
      if (matched && rule.id !== firstMatch) {
        return { ruleId: rule.id, status: 'conflict' as const, reason: 'Coincide, pero queda detrás por prioridad.' };
      }
      if (matched) {
        return { ruleId: rule.id, status: 'matched' as const, reason: 'Regla activada con datos actuales.' };
      }
      return { ruleId: rule.id, status: 'discarded' as const, reason: 'No cumplió condiciones o quedó fuera de ejecución.' };
    });
  }, [ruleSet.rules, result.matchedRuleIds]);

  async function runEvaluation() {
    setRunning(true);
    try {
      const response = await evaluateRuleSet({ ruleSet, facts, explain: true, strict: false });
      if (response) {
        setResult(response);
      } else {
        setResult(evaluateLocally(ruleSet, facts, true));
      }
      toast.success('Evaluación ejecutada');
      setChangeLog((prev) => [`Evaluación ${new Date().toLocaleTimeString()}`, ...prev].slice(0, 8));
    } catch {
      toast.error('No fue posible evaluar en este momento');
    } finally {
      setRunning(false);
    }
  }

  async function runValidation() {
    const response = await validateRuleSet(ruleSet);
    if (!response) {
      toast.info('API no disponible. Validación omitida.');
      return;
    }
    if (response.valid) toast.success('Reglas validadas');
    else toast.error(response.errors.join('\n'));
  }

  return (
    <SaaSShell
      projectName={ruleSet.name}
      workspace="Risk Operations Workspace"
      darkMode={darkMode}
      onToggleDarkMode={() => setDarkMode((prev) => !prev)}
      onRun={runEvaluation}
      onValidate={runValidation}
      onSimulate={runEvaluation}
    >
      <div className="mb-4 grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wider text-slate-500">Workspace</p>
          <p className="mt-1 font-semibold dark:text-slate-100">Risk Operations</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wider text-slate-500">Versión de reglas</p>
          <p className="mt-1 font-semibold dark:text-slate-100">{ruleSet.version}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wider text-slate-500">Estado</p>
          <p className="mt-1 font-semibold text-amber-600">Borrador</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wider text-slate-500">Historial de cambios</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{changeLog[0]}</p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <RulesDecisionTable ruleSet={ruleSet} setRuleSet={setRuleSet} />
          <InputSimulationPanel facts={facts} setFacts={setFacts} onSimulate={runEvaluation} running={running} />
          <ResultsPanel result={result} timeline={timeline} />
        </div>
        <div>
          <ExplainabilityPanel ruleSet={ruleSet} facts={facts} matchedRules={result.matchedRuleIds} />
        </div>
      </div>
    </SaaSShell>
  );
}
