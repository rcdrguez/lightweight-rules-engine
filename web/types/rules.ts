export type RuleAction = 'APPROVE' | 'REJECT' | 'REVIEW';
export type RuleDecision = RuleAction | 'NO_MATCH';
export type RuleOperator = '==' | '!=' | '>' | '>=' | '<' | '<=';

export interface RuleCondition {
  id: string;
  variable: string;
  operator: RuleOperator;
  value: string | number;
}

export interface EngineRule {
  id: string;
  name: string;
  priority: number;
  enabled: boolean;
  action: RuleAction;
  conditions: RuleCondition[];
}

export interface EngineExecutionPayload {
  rules: EngineRule[];
  input: Record<string, unknown>;
  options: {
    explain: boolean;
    strict: boolean;
    locale: 'es' | 'en';
  };
}

export interface EvaluatedRule {
  ruleId: string;
  action: RuleAction;
  priority: number;
  passed: boolean;
  order: number;
}

export interface EngineExecutionResponse {
  decision: RuleDecision;
  matchedRule: EngineRule | null;
  evaluatedRules: EvaluatedRule[];
  explanation?: string;
  logs?: string[];
}

export interface EngineValidationResult {
  valid: boolean;
  errors: Array<{ ruleId?: string; message: string }>;
}
