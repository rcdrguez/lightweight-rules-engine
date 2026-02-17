'use client';

import { Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAppState } from '@/components/layout/app-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Rule, RuleCondition, variableCatalog } from '@/lib/rule-engine';

const operators: RuleCondition['op'][] = ['>=', '<=', '==', '!=', 'IN', 'BETWEEN'];

function createDraft(): Rule {
  return {
    id: `RULE-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    priority: 99,
    enabled: true,
    logic: 'AND',
    action: 'REVIEW',
    conditions: [{ id: crypto.randomUUID(), var: 'creditScore', op: '>=', value: 650 }]
  };
}

export function ManualRulesPage() {
  const { rules, upsertRule, deleteRule } = useAppState();
  const [selectedRuleId, setSelectedRuleId] = useState(rules[0]?.id ?? '');
  const selectedRule = useMemo(() => rules.find((rule) => rule.id === selectedRuleId) ?? createDraft(), [rules, selectedRuleId]);

  function updateRule(patch: Partial<Rule>) {
    upsertRule({ ...selectedRule, ...patch });
    setSelectedRuleId((patch.id ?? selectedRule.id) as string);
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Reglas (Manual)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="secondary" onClick={() => { const draft = createDraft(); upsertRule(draft); setSelectedRuleId(draft.id); }}>
            <Plus className="mr-2 h-4 w-4" /> Agregar regla
          </Button>
          {rules.map((rule) => (
            <div key={rule.id} className={`rounded-xl border p-3 ${selectedRuleId === rule.id ? 'border-slate-900' : 'border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <button className="text-sm font-semibold" onClick={() => setSelectedRuleId(rule.id)}>{rule.id}</button>
                <Badge variant={rule.enabled ? 'success' : 'secondary'}>{rule.action}</Badge>
              </div>
              <p className="mt-2 text-xs text-slate-500">Prioridad {rule.priority} · {rule.enabled ? 'Activo' : 'Inactivo'}</p>
              <div className="mt-3 flex gap-2">
                <Button variant="outline" onClick={() => { const clone = { ...rule, id: `${rule.id}-COPY` }; upsertRule(clone); }}>Duplicar</Button>
                <Button variant="outline" onClick={() => deleteRule(rule.id)}>Eliminar</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rule Composer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input value={selectedRule.id} onChange={(event) => updateRule({ id: event.target.value })} placeholder="Rule ID" />
          <Input type="number" value={selectedRule.priority} onChange={(event) => updateRule({ priority: Number(event.target.value) })} placeholder="Prioridad" />
          <div className="flex items-center gap-3 text-sm">
            <span>Estado</span>
            <input type="checkbox" checked={selectedRule.enabled} onChange={(event) => updateRule({ enabled: event.target.checked })} />
          </div>
          <select className="w-full rounded-xl border border-slate-300 p-2" value={selectedRule.action} onChange={(event) => updateRule({ action: event.target.value as Rule['action'] })}>
            <option>APPROVE</option>
            <option>REJECT</option>
            <option>REVIEW</option>
          </select>
          <select className="w-full rounded-xl border border-slate-300 p-2" value={selectedRule.logic} onChange={(event) => updateRule({ logic: event.target.value as Rule['logic'] })}>
            <option value="AND">AND global</option>
            <option value="OR">OR global</option>
          </select>

          <div className="space-y-2">
            {selectedRule.conditions.map((condition) => (
              <div key={condition.id} className="grid grid-cols-12 items-center gap-2">
                <select
                  className="col-span-4 rounded-lg border border-slate-300 p-2 text-sm"
                  value={condition.var}
                  onChange={(event) =>
                    updateRule({
                      conditions: selectedRule.conditions.map((item) =>
                        item.id === condition.id ? { ...item, var: event.target.value as RuleCondition['var'] } : item
                      )
                    })
                  }
                >
                  {variableCatalog.map((variable) => (
                    <option key={variable.key} value={variable.key}>{variable.key}</option>
                  ))}
                </select>
                <select
                  className="col-span-3 rounded-lg border border-slate-300 p-2 text-sm"
                  value={condition.op}
                  onChange={(event) =>
                    updateRule({
                      conditions: selectedRule.conditions.map((item) =>
                        item.id === condition.id ? { ...item, op: event.target.value as RuleCondition['op'] } : item
                      )
                    })
                  }
                >
                  {operators.map((operator) => (
                    <option key={operator} value={operator}>{operator}</option>
                  ))}
                </select>
                <Input
                  className="col-span-4"
                  value={String(condition.value)}
                  onChange={(event) =>
                    updateRule({
                      conditions: selectedRule.conditions.map((item) =>
                        item.id === condition.id
                          ? { ...item, value: Number.isNaN(Number(event.target.value)) ? event.target.value : Number(event.target.value) }
                          : item
                      )
                    })
                  }
                />
                <Button
                  variant="ghost"
                  className="col-span-1 px-2"
                  onClick={() => updateRule({ conditions: selectedRule.conditions.filter((item) => item.id !== condition.id) })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <Button
            variant="secondary"
            onClick={() =>
              updateRule({
                conditions: [
                  ...selectedRule.conditions,
                  { id: crypto.randomUUID(), var: 'income', op: '>=', value: 30000 }
                ]
              })
            }
          >
            + Agregar condición
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
