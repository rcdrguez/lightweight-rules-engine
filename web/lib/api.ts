import { EvaluationResult, Facts, RuleSet } from '@/types/rules';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

async function safeJsonParse<T>(res: Response): Promise<T | null> {
  const text = await res.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export async function checkHealth() {
  if (!API_BASE_URL) return { ok: false, message: 'NEXT_PUBLIC_API_BASE_URL is not configured.' };

  const res = await fetch(`${API_BASE_URL}/health`, { method: 'GET' });
  const data = await safeJsonParse<{ message?: string }>(res);
  return { ok: res.ok, message: data?.message ?? (res.ok ? 'Healthy' : 'Health check failed') };
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
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error(`Evaluation failed (${res.status})`);
  }

  return safeJsonParse<EvaluationResult>(res);
}

export async function validateRuleSet(ruleSet: RuleSet): Promise<{ valid: boolean; errors: string[] } | null> {
  if (!API_BASE_URL) return null;

  const res = await fetch(`${API_BASE_URL}/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ruleSet })
  });

  if (!res.ok) {
    throw new Error(`Validation failed (${res.status})`);
  }

  return safeJsonParse<{ valid: boolean; errors: string[] }>(res);
}
