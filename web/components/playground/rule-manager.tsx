'use client';

import { Copy, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RuleSet } from '@/types/rules';

interface RuleManagerCopy {
  title: string;
  subtitle: string;
  addRule: string;
  noRules: string;
  priority: string;
  ifLabel: string;
  andLabel: string;
  thenLabel: string;
  edit: string;
  duplicate: string;
  delete: string;
}

interface RuleManagerProps {
  ruleSet: RuleSet;
  onDelete: (ruleId: string) => void;
  onDuplicate: (ruleId: string) => void;
  onEdit: (ruleId: string) => void;
  onAddRule: () => void;
  copy: RuleManagerCopy;
}

export function RuleManager({ ruleSet, onDelete, onDuplicate, onEdit, onAddRule, copy }: RuleManagerProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>{copy.title}</CardTitle>
          <p className="text-sm text-slate-600">{copy.subtitle}</p>
        </div>
        <Button variant="secondary" onClick={onAddRule}>+ {copy.addRule}</Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {ruleSet.rules.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">
            {copy.noRules}
          </div>
        ) : (
          ruleSet.rules.map((rule) => (
            <div key={rule.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{rule.id}</Badge>
                <Badge variant="secondary">{copy.priority} {rule.priority}</Badge>
                <Badge
                  variant={rule.decision === 'APPROVE' ? 'success' : rule.decision === 'REJECT' ? 'danger' : 'warning'}
                >
                  {rule.decision}
                </Badge>
              </div>
              <p className="text-sm text-slate-700">
                {copy.ifLabel} {rule.conditions.map((c) => `${c.field} ${c.operator} ${String(c.value)}`).join(` ${copy.andLabel} `)} {copy.thenLabel} {rule.decision}
              </p>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" onClick={() => onEdit(rule.id)}><Pencil className="mr-1 h-4 w-4" />{copy.edit}</Button>
                <Button variant="outline" onClick={() => onDuplicate(rule.id)}><Copy className="mr-1 h-4 w-4" />{copy.duplicate}</Button>
                <Button variant="ghost" onClick={() => onDelete(rule.id)}><Trash2 className="mr-1 h-4 w-4" />{copy.delete}</Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
