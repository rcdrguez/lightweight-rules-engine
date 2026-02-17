export type DecisionAction = 'APPROVE' | 'REJECT' | 'REVIEW';
export type LogicGate = 'AND' | 'OR';
export type VariableKey = 'creditScore' | 'dti' | 'income' | 'age' | 'employmentYears' | 'existingCustomer';
export type ConditionOperator = '>=' | '<=' | '==' | '!=' | 'IN' | 'BETWEEN';

export interface RuleCondition {
  id: string;
  var: VariableKey;
  op: ConditionOperator;
  value: string | number | boolean | [number, number] | string[];
}

export interface Rule {
  id: string;
  priority: number;
  enabled: boolean;
  logic: LogicGate;
  conditions: RuleCondition[];
  action: DecisionAction;
}

export interface SimulationInput {
  creditScore: number;
  dti: number;
  income: number;
  age: number;
  employmentYears: number;
  existingCustomer: boolean;
}

export interface ConditionResult extends RuleCondition {
  pass: boolean;
  actual: string | number | boolean;
}

export interface EvaluationRuleBreakdown {
  ruleId: string;
  priority: number;
  action: DecisionAction;
  passed: boolean;
  conditionResults: ConditionResult[];
}

export interface EvaluationResult {
  finalAction: DecisionAction;
  winningRuleId: string | null;
  score?: number;
  breakdown: EvaluationRuleBreakdown[];
  explanation: string[];
  logs: Array<{ level: 'INFO' | 'PASS' | 'FAIL' | 'WARN'; message: string }>;
}

export const variableCatalog: Array<{ key: VariableKey; label: string; type: 'number' | 'boolean' }> = [
  { key: 'creditScore', label: 'Credit Score', type: 'number' },
  { key: 'dti', label: 'Debt-to-Income (DTI)', type: 'number' },
  { key: 'income', label: 'Income', type: 'number' },
  { key: 'age', label: 'Age', type: 'number' },
  { key: 'employmentYears', label: 'Employment Years', type: 'number' },
  { key: 'existingCustomer', label: 'Existing Customer', type: 'boolean' }
];

export const defaultSimulationInput: SimulationInput = {
  creditScore: 690,
  dti: 33,
  income: 52000,
  age: 34,
  employmentYears: 6,
  existingCustomer: true
};

export const defaultRules: Rule[] = [
  {
    id: 'RULE-APPROVE-01',
    priority: 1,
    enabled: true,
    logic: 'AND',
    action: 'APPROVE',
    conditions: [
      { id: 'c1', var: 'creditScore', op: '>=', value: 680 },
      { id: 'c2', var: 'dti', op: '<=', value: 35 }
    ]
  },
  {
    id: 'RULE-REVIEW-01',
    priority: 2,
    enabled: true,
    logic: 'AND',
    action: 'REVIEW',
    conditions: [{ id: 'c3', var: 'creditScore', op: '>=', value: 620 }]
  },
  {
    id: 'RULE-REJECT-01',
    priority: 3,
    enabled: true,
    logic: 'AND',
    action: 'REJECT',
    conditions: [{ id: 'c4', var: 'creditScore', op: '<=', value: 619 }]
  }
];

function compare(actual: string | number | boolean, op: ConditionOperator, expected: RuleCondition['value']) {
  if (op === 'IN') {
    if (Array.isArray(expected)) return (expected as Array<string | number | boolean>).includes(actual);
    return false;
  }

  if (op === 'BETWEEN') {
    if (Array.isArray(expected) && expected.length === 2 && typeof actual === 'number') {
      return actual >= Number(expected[0]) && actual <= Number(expected[1]);
    }
    return false;
  }

  if (op === '==') return actual === expected;
  if (op === '!=') return actual !== expected;

  if (typeof actual !== 'number' || typeof expected !== 'number') return false;

  if (op === '>=') return actual >= expected;
  if (op === '<=') return actual <= expected;

  return false;
}

export function evaluateRules(rules: Rule[], input: SimulationInput): EvaluationResult {
  const logs: EvaluationResult['logs'] = [{ level: 'INFO', message: 'Starting evaluation pipeline.' }];
  const sortedRules = [...rules].filter((rule) => rule.enabled).sort((a, b) => a.priority - b.priority);
  const breakdown: EvaluationRuleBreakdown[] = [];

  for (const rule of sortedRules) {
    logs.push({ level: 'INFO', message: `Evaluating ${rule.id} (priority ${rule.priority})` });
    const conditionResults = rule.conditions.map((condition) => {
      const actual = input[condition.var];
      const pass = compare(actual, condition.op, condition.value);
      logs.push({ level: pass ? 'PASS' : 'FAIL', message: `${rule.id} :: ${condition.var} ${condition.op} ${String(condition.value)} => ${pass ? 'PASS' : 'FAIL'}` });
      return { ...condition, actual, pass };
    });

    const passed = rule.logic === 'AND' ? conditionResults.every((condition) => condition.pass) : conditionResults.some((condition) => condition.pass);
    breakdown.push({ ruleId: rule.id, priority: rule.priority, action: rule.action, passed, conditionResults });

    if (passed) {
      logs.push({ level: 'PASS', message: `${rule.id} matched. Action: ${rule.action}` });
      const explanation = [
        `Se evaluaron ${sortedRules.length} reglas activas por prioridad.`,
        `${rule.id} fue la primera regla que cumplió sus condiciones (${rule.logic}).`,
        `Por eso el estado final es ${rule.action}.`
      ];
      return { finalAction: rule.action, winningRuleId: rule.id, score: Math.max(300, Math.min(850, Number(input.creditScore))), breakdown, explanation, logs };
    }
  }

  logs.push({ level: 'WARN', message: 'No rule matched. Defaulting to REVIEW.' });
  return {
    finalAction: 'REVIEW',
    winningRuleId: null,
    breakdown,
    explanation: ['Ninguna regla activa cumplió sus condiciones.', 'El sistema aplica fallback de seguridad a REVIEW.'],
    logs
  };
}
