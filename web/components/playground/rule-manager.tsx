'use client';

import { Copy, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RuleSet } from '@/types/rules';

interface RuleManagerProps {
  ruleSet: RuleSet;
  onDelete: (ruleId: string) => void;
  onDuplicate: (ruleId: string) => void;
  onEdit: (ruleId: string) => void;
  onAddRule: () => void;
}

export function RuleManager({ ruleSet, onDelete, onDuplicate, onEdit, onAddRule }: RuleManagerProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Rules</CardTitle>
          <p className="text-sm text-slate-600">Create visual policies your team can understand at a glance.</p>
        </div>
        <Button variant="secondary" onClick={onAddRule}>+ Add Rule</Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {ruleSet.rules.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">
            No rules yet. Add one to get started.
          </div>
        ) : (
          ruleSet.rules.map((rule) => (
            <div key={rule.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{rule.id}</Badge>
                <Badge variant="secondary">Priority {rule.priority}</Badge>
                <Badge
                  variant={rule.decision === 'APPROVE' ? 'success' : rule.decision === 'REJECT' ? 'danger' : 'warning'}
                >
                  {rule.decision}
                </Badge>
              </div>
              <p className="text-sm text-slate-700">
                IF {rule.conditions.map((c) => `${c.field} ${c.operator} ${String(c.value)}`).join(' AND ')} THEN {rule.decision}
              </p>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" onClick={() => onEdit(rule.id)}><Pencil className="mr-1 h-4 w-4" />Edit</Button>
                <Button variant="outline" onClick={() => onDuplicate(rule.id)}><Copy className="mr-1 h-4 w-4" />Duplicate</Button>
                <Button variant="ghost" onClick={() => onDelete(rule.id)}><Trash2 className="mr-1 h-4 w-4" />Delete</Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
