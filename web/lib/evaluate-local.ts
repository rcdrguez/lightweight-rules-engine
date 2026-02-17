import { EvaluationLog, EvaluationResult, Facts, Rule, RuleSet } from '@/types/rules';

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

const decisionScore: Record<EvaluationResult['decision'], number> = {
  APPROVE: 91,
  REVIEW: 62,
  REJECT: 24
};

export function evaluateLocally(ruleSet: RuleSet, facts: Facts, explain: boolean): EvaluationResult {
  const logs: EvaluationLog[] = [];
  const steps: EvaluationResult['steps'] = [];
  const sorted = [...ruleSet.rules]
    .filter((rule) => rule.enabled !== false)
    .sort((a, b) => a.priority - b.priority);

  logs.push({ level: 'INFO', message: 'Starting rule evaluation...' });
  logs.push({ level: 'INFO', message: `Input: ${Object.entries(facts).map(([k, v]) => `${k}=${String(v)}`).join(', ')}` });

  const matches: Rule[] = [];

  sorted.forEach((rule) => {
    logs.push({ level: 'CHECK', message: `Evaluating ${rule.id} (Priority ${rule.priority})` });
    const conditionResults = rule.conditions.map((condition) => {
      const actual = facts[condition.field];
      const passed = compare(actual, condition.operator, condition.value);
      const message = `${condition.field} ${condition.operator} ${String(condition.value)} → ${passed ? 'TRUE' : 'FALSE'}`;
      logs.push({ level: passed ? 'PASS' : 'FAIL', message });
      steps?.push({ ruleId: rule.id, conditionLabel: `${condition.field} ${condition.operator} ${String(condition.value)}`, passed });
      return passed;
    });

    if (conditionResults.every(Boolean)) {
      matches.push(rule);
      logs.push({ level: 'RESULT', message: `${rule.id} triggered → ${rule.decision}` });
    }
  });

  const top = matches[0];

  if (!top) {
    logs.push({ level: 'WARNING', message: 'No rule matched, fallback decision → REVIEW' });
    logs.push({ level: 'INFO', message: 'Final decision: REVIEW' });
    return {
      decision: 'REVIEW',
      matchedRuleIds: [],
      tags: ['no-match'],
      score: decisionScore.REVIEW,
      logs,
      steps,
      explanation: explain ? 'No rule matched the supplied facts, so the default fallback decision is REVIEW.' : undefined,
      raw: { matches }
    };
  }

  logs.push({ level: 'INFO', message: `Final decision: ${top.decision}` });

  return {
    decision: top.decision,
    matchedRuleIds: matches.map((rule) => rule.id),
    tags: [...new Set(matches.flatMap((rule) => rule.tags))],
    winnerRuleId: top.id,
    score: decisionScore[top.decision],
    logs,
    steps,
    explanation: explain
      ? `Matched ${top.id} first by priority. All conditions in that rule evaluated to true for the current facts.`
      : undefined,
    raw: { matches }
  };
}
