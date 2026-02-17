'use client';

import { createContext, useContext, useMemo, useState } from 'react';
import {
  DecisionAction,
  Rule,
  RuleCondition,
  SimulationInput,
  defaultRules,
  defaultSimulationInput,
  evaluateRules
} from '@/lib/rule-engine';

export type FlowNodeType = 'start' | 'condition' | 'decision' | 'end';

export interface FlowNode {
  id: string;
  type: FlowNodeType;
  x: number;
  y: number;
  label: string;
  condition?: RuleCondition;
  action?: DecisionAction;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label: 'TRUE' | 'FALSE' | 'NEXT';
}

interface AppState {
  rules: Rule[];
  setRules: (rules: Rule[]) => void;
  upsertRule: (rule: Rule) => void;
  deleteRule: (id: string) => void;
  simulationInput: SimulationInput;
  setSimulationInput: (value: SimulationInput) => void;
  lastEvaluation: ReturnType<typeof evaluateRules>;
  runSimulation: () => void;
  flowNodes: FlowNode[];
  flowEdges: FlowEdge[];
  setFlow: (nodes: FlowNode[], edges: FlowEdge[]) => void;
}

const defaultFlowNodes: FlowNode[] = [
  { id: 'start', type: 'start', x: 80, y: 180, label: 'Start/Input' },
  {
    id: 'cond-1',
    type: 'condition',
    x: 320,
    y: 180,
    label: 'IF creditScore >= 680',
    condition: { id: 'fc1', var: 'creditScore', op: '>=', value: 680 }
  },
  { id: 'decision-approve', type: 'decision', x: 560, y: 90, label: 'APPROVE', action: 'APPROVE' },
  {
    id: 'decision-review',
    type: 'decision',
    x: 560,
    y: 260,
    label: 'REVIEW',
    action: 'REVIEW'
  },
  { id: 'end', type: 'end', x: 800, y: 180, label: 'End' }
];

const defaultFlowEdges: FlowEdge[] = [
  { id: 'e1', source: 'start', target: 'cond-1', label: 'NEXT' },
  { id: 'e2', source: 'cond-1', target: 'decision-approve', label: 'TRUE' },
  { id: 'e3', source: 'cond-1', target: 'decision-review', label: 'FALSE' },
  { id: 'e4', source: 'decision-approve', target: 'end', label: 'NEXT' },
  { id: 'e5', source: 'decision-review', target: 'end', label: 'NEXT' }
];

const Context = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [rules, setRules] = useState<Rule[]>(defaultRules);
  const [simulationInput, setSimulationInput] = useState<SimulationInput>(defaultSimulationInput);
  const [lastEvaluation, setLastEvaluation] = useState(() => evaluateRules(defaultRules, defaultSimulationInput));
  const [flowNodes, setFlowNodes] = useState<FlowNode[]>(defaultFlowNodes);
  const [flowEdges, setFlowEdges] = useState<FlowEdge[]>(defaultFlowEdges);

  const value = useMemo<AppState>(
    () => ({
      rules,
      setRules,
      upsertRule: (rule) => setRules((prev) => [...prev.filter((item) => item.id !== rule.id), rule].sort((a, b) => a.priority - b.priority)),
      deleteRule: (id) => setRules((prev) => prev.filter((rule) => rule.id !== id)),
      simulationInput,
      setSimulationInput,
      lastEvaluation,
      runSimulation: () => setLastEvaluation(evaluateRules(rules, simulationInput)),
      flowNodes,
      flowEdges,
      setFlow: (nodes, edges) => {
        setFlowNodes(nodes);
        setFlowEdges(edges);
      }
    }),
    [rules, simulationInput, lastEvaluation, flowNodes, flowEdges]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useAppState() {
  const context = useContext(Context);
  if (!context) throw new Error('useAppState must be used inside AppStateProvider');
  return context;
}
