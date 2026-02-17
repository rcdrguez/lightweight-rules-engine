'use client';

import { GripVertical, Plus, Power, Trash2 } from 'lucide-react';
import { Dispatch, SetStateAction, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Rule, RuleSet } from '@/types/rules';

type RuleRow = Rule & { enabled?: boolean };

type Props = {
  ruleSet: RuleSet;
  setRuleSet: Dispatch<SetStateAction<RuleSet>>;
};

const decisionStyles: Record<Rule['decision'], string> = {
  APPROVE: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  REJECT: 'bg-rose-100 text-rose-800 border-rose-200',
  REVIEW: 'bg-amber-100 text-amber-800 border-amber-200'
};

export function RulesDecisionTable({ ruleSet, setRuleSet }: Props) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dynamicColumns, setDynamicColumns] = useState<string[]>([]);
  const orderedRules = useMemo(() => [...ruleSet.rules].sort((a, b) => a.priority - b.priority), [ruleSet.rules]);

  function syncPriorities(rules: RuleRow[]) {
    return rules.map((rule, index) => ({ ...rule, priority: index + 1 }));
  }

  function updateRule(index: number, updater: (rule: RuleRow) => RuleRow) {
    setRuleSet((prev) => {
      const ordered = [...(prev.rules as RuleRow[])].sort((a, b) => a.priority - b.priority);
      ordered[index] = updater(ordered[index]);
      return { ...prev, rules: syncPriorities(ordered) };
    });
  }

  function addRule() {
    setRuleSet((prev) => ({
      ...prev,
      rules: [
        ...syncPriorities([...(prev.rules as RuleRow[])].sort((a, b) => a.priority - b.priority)),
        {
          id: `RULE-${String(prev.rules.length + 1).padStart(3, '0')}`,
          priority: prev.rules.length + 1,
          conditions: [{ field: 'creditScore', operator: '>=', value: 650 }],
          decision: 'REVIEW',
          tags: ['draft'],
          enabled: true
        }
      ]
    }));
  }

  function reorderRows(sourceId: string, targetId: string) {
    setRuleSet((prev) => {
      const ordered = [...(prev.rules as RuleRow[])].sort((a, b) => a.priority - b.priority);
      const sourceIndex = ordered.findIndex((rule) => rule.id === sourceId);
      const targetIndex = ordered.findIndex((rule) => rule.id === targetId);
      if (sourceIndex < 0 || targetIndex < 0) return prev;
      const [moved] = ordered.splice(sourceIndex, 1);
      ordered.splice(targetIndex, 0, moved);
      return { ...prev, rules: syncPriorities(ordered) };
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Decision Table</CardTitle>
          <p className="text-sm text-slate-500">Editor visual estilo Excel para diseñar prioridades y outcomes.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setDynamicColumns((prev) => [...prev, `Columna ${prev.length + 1}`])}>Agregar columna</Button>
          <Button onClick={addRule}><Plus className="mr-2 h-4 w-4" />Nueva regla</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-auto rounded-xl border border-slate-200">
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="p-3">Orden</th>
                <th className="p-3">Regla</th>
                <th className="p-3">Prioridad</th>
                <th className="p-3">Condiciones</th>
                <th className="p-3">Operadores</th>
                <th className="p-3">Resultado</th>
                <th className="p-3">Estado</th>
                {dynamicColumns.map((column) => (
                  <th key={column} className="p-3">{column}</th>
                ))}
                <th className="p-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {orderedRules.map((rule, index) => {
                const row = rule as RuleRow;
                const enabled = row.enabled !== false;
                const primaryCondition = rule.conditions[0];
                return (
                  <tr
                    key={rule.id}
                    draggable
                    onDragStart={() => setDraggingId(rule.id)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => {
                      if (draggingId && draggingId !== rule.id) reorderRows(draggingId, rule.id);
                      setDraggingId(null);
                    }}
                    className="border-t border-slate-100 transition-colors hover:bg-slate-50"
                  >
                    <td className="p-3 text-slate-400"><GripVertical className="h-4 w-4" /></td>
                    <td className="p-3"><Input value={rule.id} onChange={(event) => updateRule(index, (current) => ({ ...current, id: event.target.value }))} /></td>
                    <td className="p-3">
                      <Input
                        type="number"
                        min={1}
                        value={rule.priority}
                        onChange={(event) => {
                          const nextPriority = Number(event.target.value || index + 1);
                          setRuleSet((prev) => {
                            const ordered = [...(prev.rules as RuleRow[])].sort((a, b) => a.priority - b.priority);
                            const current = ordered[index];
                            ordered.splice(index, 1);
                            ordered.splice(Math.max(0, Math.min(nextPriority - 1, ordered.length)), 0, current);
                            return { ...prev, rules: syncPriorities(ordered) };
                          });
                        }}
                      />
                    </td>
                    <td className="p-3"><Input value={primaryCondition?.field ?? ''} onChange={(event) => updateRule(index, (current) => ({ ...current, conditions: [{ ...current.conditions[0], field: event.target.value }] }))} /></td>
                    <td className="p-3"><Input value={primaryCondition?.operator ?? '=='} onChange={(event) => updateRule(index, (current) => ({ ...current, conditions: [{ ...current.conditions[0], operator: event.target.value as Rule['conditions'][number]['operator'] }] }))} /></td>
                    <td className="p-3">
                      <select className="w-full rounded-xl border border-slate-200 px-3 py-2" value={rule.decision} onChange={(event) => updateRule(index, (current) => ({ ...current, decision: event.target.value as Rule['decision'] }))}>
                        <option value="APPROVE">APPROVE</option><option value="REJECT">REJECT</option><option value="REVIEW">REVIEW</option>
                      </select>
                      <Badge className={`mt-2 border ${decisionStyles[rule.decision]}`}>{rule.decision}</Badge>
                    </td>
                    <td className="p-3">
                      <Button variant={enabled ? 'secondary' : 'outline'} onClick={() => updateRule(index, (current) => ({ ...current, enabled: !enabled }))}><Power className="mr-2 h-4 w-4" />{enabled ? 'Activa' : 'Inactiva'}</Button>
                    </td>
                    {dynamicColumns.map((column) => <td key={`${rule.id}-${column}`} className="p-3 text-xs text-slate-400">editable</td>)}
                    <td className="p-3"><Button variant="ghost" onClick={() => setRuleSet((prev) => ({ ...prev, rules: syncPriorities((prev.rules as RuleRow[]).filter((item) => item.id !== rule.id)) }))}><Trash2 className="h-4 w-4" /></Button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
