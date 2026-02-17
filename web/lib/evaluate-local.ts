import { EvaluationResult, Facts, Rule, RuleSet } from '@/types/rules';

function compare(actual: unknown, operator: Rule['conditions'][number]['operator'], expected: unknown): boolean {
  if (operator === 'includes' && typeof actual === 'string') return actual.includes(String(expected));
  if (operator === 'not_includes' && typeof actual === 'string') return !actual.includes(String(expected));
  if (operator === '==') return actual === expected;
  if (operator === '!=') return actual !== expected;

  if (typeof actual !== 'number' || typeof expected !== 'number') return false;

  if (operator === '>') return actual > expected;
  if (operator === '>=') return actual >= expected;
  if (operator === '<') return actual < expected;
  if (operator === '<=') return actual <= expected;

  return false;
}

export function evaluateLocally(ruleSet: RuleSet, facts: Facts, explain: boolean): EvaluationResult {
  const sorted = [...ruleSet.rules].sort((a, b) => a.priority - b.priority);
  const matches = sorted.filter((rule) =>
    rule.conditions.every((condition) => compare(facts[condition.field], condition.operator, condition.value))
  );

  const top = matches[0];

  if (!top) {
    return {
      decision: 'REVIEW',
      matchedRuleIds: [],
      tags: ['no-match'],
      explanation: explain ? 'No rule matched the supplied facts, so the default fallback decision is REVIEW.' : undefined,
      raw: { matches }
    };
  }

  return {
    decision: top.decision,
    matchedRuleIds: matches.map((rule) => rule.id),
    tags: [...new Set(matches.flatMap((rule) => rule.tags))],
    explanation: explain
      ? `Matched ${top.id} first by priority. All conditions in that rule evaluated to true for the current facts.`
      : undefined,
    raw: { matches }
  };
}
