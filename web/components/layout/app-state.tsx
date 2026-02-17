'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { EngineExecutionResponse, EngineRule } from '@/types/rules';

type AppState = {
  rules: EngineRule[];
  input: Record<string, unknown>;
  result: EngineExecutionResponse | null;
  setRules: (rules: EngineRule[]) => void;
  addRule: (rule: EngineRule) => void;
  updateRule: (rule: EngineRule) => void;
  removeRule: (id: string) => void;
  setInput: (input: Record<string, unknown>) => void;
  setResult: (result: EngineExecutionResponse | null) => void;
};

const STORAGE_KEY = 'lightweight-rules-engine-state-v1';

const defaultRules: EngineRule[] = [
  {
    id: 'RULE-APPROVE-01',
    name: 'Aprobación score alto',
    priority: 1,
    enabled: true,
    action: 'APPROVE',
    conditions: [
      { id: 'condition-credit-score', variable: 'creditScore', operator: '>=', value: 700 },
      { id: 'condition-dti', variable: 'dti', operator: '<=', value: 0.35 }
    ]
  }
];

const defaultInput = { creditScore: 720, dti: 0.29, income: 4500 };

const Context = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [rules, setRulesState] = useState<EngineRule[]>(defaultRules);
  const [input, setInputState] = useState<Record<string, unknown>>(defaultInput);
  const [result, setResult] = useState<EngineExecutionResponse | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as Partial<Pick<AppState, 'rules' | 'input' | 'result'>>;
      if (parsed.rules) setRulesState(parsed.rules);
      if (parsed.input) setInputState(parsed.input);
      if (parsed.result) setResult(parsed.result);
    } catch {
      // ignore corrupted local cache
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ rules, input, result }));
  }, [rules, input, result]);

  const value = useMemo<AppState>(
    () => ({
      rules,
      input,
      result,
      setRules: setRulesState,
      addRule: (rule) => setRulesState((prev) => [...prev, rule]),
      updateRule: (rule) => setRulesState((prev) => prev.map((item) => (item.id === rule.id ? rule : item))),
      removeRule: (id) => setRulesState((prev) => prev.filter((rule) => rule.id !== id)),
      setInput: setInputState,
      setResult
    }),
    [rules, input, result]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useAppState() {
  const context = useContext(Context);
  if (!context) throw new Error('useAppState must be used inside AppStateProvider');
  return context;
}
