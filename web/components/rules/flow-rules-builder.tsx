'use client';

import { useMemo, useState } from 'react';
import { Background, Controls, MiniMap, ReactFlow, useEdgesState, useNodesState } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useRulesStore } from '@/store/useRulesStore';
import type { EngineRule } from '@/types/rules';

const initialNodes = [
  { id: 'condition-1', position: { x: 100, y: 100 }, data: { label: 'creditScore >= 700' }, type: 'default' },
  { id: 'action-1', position: { x: 420, y: 100 }, data: { label: 'APPROVE' }, type: 'default' }
];

const initialEdges = [{ id: 'e1-2', source: 'condition-1', target: 'action-1' }];

export function FlowRulesBuilder() {
  const { setRules } = useRulesStore();
  const [nodes] = useNodesState(initialNodes);
  const [edges] = useEdgesState(initialEdges);
  const [ruleId, setRuleId] = useState('FLOW-RULE-01');
  const [priority, setPriority] = useState(1);

  const exportableRule = useMemo<EngineRule>(() => {
    const conditionNodes = nodes.filter((node) => String(node.id).startsWith('condition'));
    const actionNode = nodes.find((node) => String(node.id).startsWith('action'));
    const action = (actionNode?.data?.label as EngineRule['action']) ?? 'REVIEW';

    return {
      id: ruleId,
      name: 'Regla creada desde Flow',
      priority,
      enabled: true,
      action,
      conditions: conditionNodes.map((node) => {
        const [variable = 'creditScore', operator = '>=', value = '700'] = String(node.data?.label).split(' ');
        return { id: String(node.id), variable, operator: operator as any, value };
      })
    };
  }, [nodes, ruleId, priority]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reglas en Flujo</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid gap-3 md:grid-cols-3">
          <Input value={ruleId} onChange={(e) => setRuleId(e.target.value)} placeholder="Rule ID" />
          <Input type="number" value={priority} onChange={(e) => setPriority(Number(e.target.value))} placeholder="Prioridad" />
          <Button onClick={() => setRules([exportableRule])}>Guardar flujo a reglas</Button>
        </div>
        <div className="h-[480px] rounded-xl border">
          <ReactFlow>
            <MiniMap />
            <Controls />
            <Background />
            <div className="p-4 text-sm text-slate-700">Nodos: {nodes.length} | Conexiones: {edges.length}</div>
          </ReactFlow>
        </div>
      </CardContent>
    </Card>
  );
}
