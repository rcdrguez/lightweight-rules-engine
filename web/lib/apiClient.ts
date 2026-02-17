import type { EngineRule, EngineExecutionPayload, EngineExecutionResponse, EngineValidationResult } from '@/types/rules';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

export const API_ENDPOINTS = {
  health: '/',
  validate: '/validate',
  execute: '/evaluate',
  shareScenario: '/share'
} as const;

async function parseJson<T>(response: Response): Promise<T | null> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

async function post<TRequest, TResponse>(path: string, payload: TRequest): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await parseJson<TResponse>(response);

  if (!response.ok) {
    throw new Error(`API error ${response.status} on ${path}`);
  }

  return (data ?? {}) as TResponse;
}

function mapRulesToBackend(rules: EngineRule[]) {
  return {
    specVersion: '1.0',
    name: 'frontend-rules',
    version: '1.0.0',
    default: { set: { decision: 'NO_MATCH' } },
    rules: rules
      .filter((rule) => rule.enabled)
      .map((rule) => ({
        id: rule.id,
        priority: rule.priority,
        when: {
          all: rule.conditions.map((condition) => ({
            [condition.operator]: [{ var: condition.variable }, condition.value]
          }))
        },
        then: {
          set: { decision: rule.action }
        }
      }))
  };
}

export async function validateRules(payload: { rules: EngineRule[] }): Promise<EngineValidationResult> {
  if (!API_BASE_URL) return { valid: true, errors: [] };

  const response = await post<any, { errors?: Array<{ ruleId?: string; message?: string }> }>(
    API_ENDPOINTS.validate,
    mapRulesToBackend(payload.rules)
  );

  const errors = response.errors?.map((error) => ({
    ruleId: error.ruleId,
    message: error.message ?? 'Validation error'
  })) ?? [];

  return { valid: errors.length === 0, errors };
}

export async function executeRules(payload: EngineExecutionPayload): Promise<EngineExecutionResponse> {
  if (!API_BASE_URL) {
    return {
      decision: 'NO_MATCH',
      matchedRule: null,
      evaluatedRules: [],
      explanation: 'Set NEXT_PUBLIC_API_BASE_URL para ejecutar contra API.',
      logs: ['[WARN] API base URL no configurada']
    };
  }

  const backendPayload = {
    ruleset: mapRulesToBackend(payload.rules),
    facts: payload.input,
    options: {
      explain: payload.options.explain,
      strictMode: payload.options.strict,
      locale: payload.options.locale
    }
  };

  const response = await post<typeof backendPayload, any>(API_ENDPOINTS.execute, backendPayload);
  const decision = response?.output?.decision ?? 'NO_MATCH';

  return {
    decision,
    matchedRule: payload.rules.find((rule) => rule.id === response?.matchedRules?.[0]) ?? null,
    evaluatedRules: payload.rules.map((rule, index) => ({
      ruleId: rule.id,
      action: rule.action,
      priority: rule.priority,
      passed: Boolean(response?.matchedRules?.includes(rule.id)),
      order: index + 1
    })),
    explanation: response?.trace ? JSON.stringify(response.trace, null, 2) : undefined,
    logs: response?.trace?.flatMap((trace: any) => trace.steps?.map((step: any) => `[TRACE] ${step.expr} => ${step.result}`) ?? [])
  };
}

export async function shareScenario(payload: unknown): Promise<{ id: string }> {
  if (!API_BASE_URL) return { id: 'local-demo' };
  return post(API_ENDPOINTS.shareScenario, payload);
}
