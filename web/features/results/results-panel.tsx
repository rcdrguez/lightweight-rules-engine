'use client';

import { CheckCircle2, CircleX, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EvaluationResult } from '@/types/rules';

type Props = {
  result: EvaluationResult;
  timeline: Array<{ ruleId: string; status: 'matched' | 'discarded' | 'conflict'; reason: string }>;
};

export function ResultsPanel({ result, timeline }: Props) {
  const decisionStyle =
    result.decision === 'APPROVE'
      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
      : result.decision === 'REJECT'
        ? 'bg-rose-100 text-rose-800 border-rose-200'
        : 'bg-amber-100 text-amber-800 border-amber-200';

  const score = Math.max(0, 100 - timeline.filter((item) => item.status !== 'matched').length * 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Decision Result</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={`rounded-2xl border p-5 text-center text-2xl font-semibold ${decisionStyle}`}>{result.decision}</div>
        <div className="rounded-xl bg-slate-100 p-3 text-sm text-slate-700">Score: <strong>{score}</strong></div>
        <div>
          <p className="mb-2 text-xs uppercase tracking-wider text-slate-500">Reglas activadas</p>
          <div className="flex flex-wrap gap-2">
            {result.matchedRuleIds.length > 0 ? result.matchedRuleIds.map((id) => <Badge key={id} variant="secondary">{id}</Badge>) : <span className="text-sm text-slate-500">Sin match</span>}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs uppercase tracking-wider text-slate-500">Timeline de evaluación</p>
          <div className="space-y-2">
            {timeline.map((item) => (
              <div key={item.ruleId} className="flex items-start gap-2 rounded-lg border border-slate-200 p-2 text-sm">
                {item.status === 'matched' && <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" />}
                {item.status === 'discarded' && <CircleX className="mt-0.5 h-4 w-4 text-rose-500" />}
                {item.status === 'conflict' && <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-500" />}
                <div>
                  <p className="font-medium">{item.ruleId}</p>
                  <p className="text-slate-500">{item.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
