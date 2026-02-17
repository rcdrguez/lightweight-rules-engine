export type Decision = 'APPROVE' | 'REJECT' | 'REVIEW';
export type TemplateType = 'Loan' | 'Fraud' | 'Discount';

export type Operator =
  | '=='
  | '!='
  | '>'
  | '>='
  | '<'
  | '<='
  | 'includes'
  | 'not_includes';

export interface Condition {
  field: string;
  operator: Operator;
  value: string | number | boolean;
}

export interface Rule {
  id: string;
  priority: number;
  conditions: Condition[];
  decision: Decision;
  tags: string[];
  enabled?: boolean;
}

export interface RuleSet {
  name: string;
  version: string;
  rules: Rule[];
}

export type Facts = Record<string, string | number | boolean>;

export interface EvaluationLog {
  level: 'INFO' | 'CHECK' | 'PASS' | 'FAIL' | 'RESULT' | 'WARNING';
  message: string;
}

export interface EvaluationStep {
  ruleId: string;
  conditionLabel: string;
  passed: boolean;
}

export interface EvaluationResult {
  decision: Decision;
  matchedRuleIds: string[];
  tags: string[];
  explanation?: string;
  raw?: unknown;
  score?: number;
  winnerRuleId?: string;
  logs?: EvaluationLog[];
  steps?: EvaluationStep[];
}
