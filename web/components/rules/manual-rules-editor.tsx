'use client';

import { useMutation } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import { validateRules } from '@/lib/apiClient';
import { useRulesStore } from '@/store/useRulesStore';
import type { EngineRule, RuleCondition, RuleOperator } from '@/types/rules';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

const operators: RuleOperator[] = ['==', '!=', '>', '>=', '<', '<='];
const actions = ['APPROVE', 'REJECT', 'REVIEW'] as const;

function createRule(): EngineRule {
  return {
    id: `RULE-${Math.floor(Math.random() * 10000)}`,
    name: 'Nueva regla',
    priority: 1,
    enabled: true,
    action: 'REVIEW',
    conditions: [{ id: crypto.randomUUID(), variable: 'creditScore', operator: '>=', value: 700 }]
  };
}

export function ManualRulesEditor() {
  const { rules, addRule, updateRule, removeRule } = useRulesStore();
  const mutation = useMutation({ mutationFn: validateRules });

  const errorsByRule = useMemo(() => {
    const map = new Map<string, string[]>();
    mutation.data?.errors.forEach((error) => {
      const key = error.ruleId ?? 'global';
      map.set(key, [...(map.get(key) ?? []), error.message]);
    });
    return map;
  }, [mutation.data]);

  const saveAndValidate = async (nextRules: EngineRule[]) => {
    await mutation.mutateAsync({ rules: nextRules });
  };

  const updateCondition = (rule: EngineRule, condition: RuleCondition) => {
    const updated = { ...rule, conditions: rule.conditions.map((item) => (item.id === condition.id ? condition : item)) };
    updateRule(updated);
    void saveAndValidate(rules.map((item) => (item.id === rule.id ? updated : item)));
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Reglas Manuales</CardTitle>
        <Button onClick={() => addRule(createRule())}>
          <Plus className="mr-2 h-4 w-4" /> Nueva regla
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {rules.map((rule) => (
          <div key={rule.id} className="rounded-xl border p-4">
            <div className="grid gap-3 md:grid-cols-4">
              <Input value={rule.id} onChange={(e) => updateRule({ ...rule, id: e.target.value })} placeholder="Rule ID" />
              <Input value={rule.name} onChange={(e) => updateRule({ ...rule, name: e.target.value })} placeholder="Nombre" />
              <Input
                type="number"
                value={rule.priority}
                onChange={(e) => updateRule({ ...rule, priority: Number(e.target.value) })}
                placeholder="Prioridad"
              />
              <label className="flex items-center gap-2 text-sm">
                Enabled <Switch checked={rule.enabled} onCheckedChange={(enabled) => updateRule({ ...rule, enabled })} />
              </label>
            </div>

            <div className="mt-3 space-y-2">
              {rule.conditions.map((condition) => (
                <div key={condition.id} className="grid gap-2 md:grid-cols-4">
                  <Input
                    value={condition.variable}
                    onChange={(e) => updateCondition(rule, { ...condition, variable: e.target.value })}
                    placeholder="Variable"
                  />
                  <select
                    className="h-10 rounded-xl border px-3"
                    value={condition.operator}
                    onChange={(e) => updateCondition(rule, { ...condition, operator: e.target.value as RuleOperator })}
                  >
                    {operators.map((operator) => (
                      <option key={operator} value={operator}>
                        {operator}
                      </option>
                    ))}
                  </select>
                  <Input
                    value={String(condition.value)}
                    onChange={(e) => updateCondition(rule, { ...condition, value: e.target.value })}
                    placeholder="Valor"
                  />
                  <Button
                    variant="secondary"
                    onClick={() => updateRule({ ...rule, conditions: [...rule.conditions, { ...condition, id: crypto.randomUUID() }] })}
                  >
                    + condición
                  </Button>
                </div>
              ))}
            </div>

            <div className="mt-3 flex items-center gap-2">
              <select
                className="h-10 rounded-xl border px-3"
                value={rule.action}
                onChange={(e) => updateRule({ ...rule, action: e.target.value as EngineRule['action'] })}
              >
                {actions.map((action) => (
                  <option key={action} value={action}>
                    {action}
                  </option>
                ))}
              </select>
              <Button variant="outline" onClick={() => removeRule(rule.id)}>
                <Trash2 className="mr-2 h-4 w-4" /> Eliminar
              </Button>
              <Button onClick={() => void saveAndValidate(rules)}>Guardar + Validar</Button>
            </div>

            {(errorsByRule.get(rule.id) ?? []).map((error) => (
              <p key={error} className="mt-2 text-sm text-rose-600">
                {error}
              </p>
            ))}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
