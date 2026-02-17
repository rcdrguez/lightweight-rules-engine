import { EvaluationResult, Facts, RuleSet } from '@/types/rules';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type EngineError = { code?: string; message?: string; ruleId?: string };
type EngineEvaluateResponse = {
  output?: Record<string, unknown>;
  matchedRules?: string[];
  tags?: string[];
  trace?: Array<{ steps?: Array<{ expr?: string; result?: boolean }> }>;
  errors?: EngineError[];
};

type EngineValidateResponse = { errors?: EngineError[] };

async function safeJsonParse<T>(res: Response): Promise<T | null> {
  const text = await res.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function toEngineRuleSet(ruleSet: RuleSet) {
  return {
    specVersion: '1.0',
    name: ruleSet.name,
    version: ruleSet.version,
    default: { set: { decision: 'REVIEW' } },
    rules: ruleSet.rules.map((rule) => ({
      id: rule.id,
      priority: rule.priority,
      when: {
        all: rule.conditions.map((condition) => ({
          [condition.operator]: [{ var: condition.field }, condition.value]
        }))
      },
      then: {
        set: { decision: rule.decision },
        addTags: rule.tags
      }
    }))
  };
}

function toEvaluationResult(data: EngineEvaluateResponse): EvaluationResult {
  const output = data.output ?? {};
  const decision = (output.decision as EvaluationResult['decision']) ?? 'REVIEW';
  const traceText = data.trace?.flatMap((r) => r.steps ?? []).map((s) => `${s.expr} => ${s.result}`).join('\n');

  return {
    decision,
    matchedRuleIds: Array.isArray(data.matchedRules) ? data.matchedRules : [],
    tags: Array.isArray(data.tags) ? data.tags : [],
    explanation: traceText || undefined,
    raw: data
  };
}

export async function checkHealth() {
  if (!API_BASE_URL) return { ok: false, message: 'NEXT_PUBLIC_API_BASE_URL is not configured.' };

  const res = await fetch(`${API_BASE_URL}/`, { method: 'GET' });
  const data = await safeJsonParse<{ status?: string }>(res);
  return { ok: res.ok, message: data?.status ?? (res.ok ? 'Healthy' : 'Health check failed') };
}

export async function evaluateRuleSet(payload: {
  ruleSet: RuleSet;
  facts: Facts;
  explain: boolean;
  strict: boolean;
}): Promise<EvaluationResult | null> {
  if (!API_BASE_URL) return null;

  const res = await fetch(`${API_BASE_URL}/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ruleset: toEngineRuleSet(payload.ruleSet),
      facts: payload.facts,
      options: {
        explain: payload.explain,
        strictMode: payload.strict
      }
    })
  });

  if (!res.ok) {
    throw new Error(`Evaluation failed (${res.status})`);
  }

  const data = await safeJsonParse<EngineEvaluateResponse>(res);
  if (!data) return null;

  if (Array.isArray(data.errors) && data.errors.length > 0) {
    throw new Error(data.errors.map((error) => error.message || error.code || 'Unknown evaluation error').join('\n'));
  }

  return toEvaluationResult(data);
}

export async function validateRuleSet(ruleSet: RuleSet): Promise<{ valid: boolean; errors: string[] } | null> {
  if (!API_BASE_URL) return null;

  const res = await fetch(`${API_BASE_URL}/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(toEngineRuleSet(ruleSet))
  });

  if (!res.ok) {
    throw new Error(`Validation failed (${res.status})`);
  }

  const data = await safeJsonParse<EngineValidateResponse>(res);
  const errors = (data?.errors ?? []).map((error) => error.message || error.code || 'Unknown validation error');

  return {
    valid: errors.length === 0,
    errors
  };
}
