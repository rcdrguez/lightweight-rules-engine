'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Facts, RuleSet } from '@/types/rules';

type Props = {
  ruleSet: RuleSet;
  facts: Facts;
  matchedRules: string[];
};

export function ExplainabilityPanel({ ruleSet, facts, matchedRules }: Props) {
  const ordered = [...ruleSet.rules].sort((a, b) => a.priority - b.priority);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>¿Por qué esta decisión?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {ordered.map((rule) => {
          const isMatched = matchedRules.includes(rule.id);
          return (
            <div key={rule.id} className="rounded-xl border border-slate-200 p-3">
              <div className="flex items-center justify-between">
                <p className="font-medium">{rule.id}</p>
                <span className={isMatched ? 'text-emerald-600' : 'text-slate-400'}>{isMatched ? 'Aplicada' : 'Ignorada por prioridad'}</span>
              </div>
              <ul className="mt-2 space-y-1 text-slate-600">
                {rule.conditions.map((condition, index) => (
                  <li key={`${rule.id}-${index}`}>
                    {condition.field} {condition.operator} {String(condition.value)} | valor actual: <strong>{String(facts[condition.field] ?? 'N/A')}</strong>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
