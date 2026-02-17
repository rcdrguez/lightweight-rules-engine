'use client';

import { useMemo, useState } from 'react';
import { useAppState, type FlowNode } from '@/components/layout/app-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Rule, RuleCondition, variableCatalog } from '@/lib/rule-engine';

function nodeStyle(type: FlowNode['type']) {
  if (type === 'condition') return 'border-sky-400 bg-sky-50';
  if (type === 'decision') return 'border-emerald-400 bg-emerald-50';
  if (type === 'start') return 'border-slate-400 bg-slate-50';
  return 'border-violet-400 bg-violet-50';
}

export function buildRulesFromFlow(nodes: FlowNode[], edges: { source: string; target: string; label: string }[]): Rule[] {
  const start = nodes.find((node) => node.type === 'start');
  if (!start) return [];

  const rules: Rule[] = [];
  let currentCondition = edges.find((edge) => edge.source === start.id)?.target;
  let index = 1;

  while (currentCondition) {
    const conditionNode = nodes.find((node) => node.id === currentCondition && node.type === 'condition');
    if (!conditionNode?.condition) break;

    const trueTarget = edges.find((edge) => edge.source === conditionNode.id && edge.label === 'TRUE')?.target;
    const decisionNode = nodes.find((node) => node.id === trueTarget && node.type === 'decision');
    if (decisionNode?.action) {
      rules.push({
        id: `FLOW-RULE-${index}`,
        priority: index,
        enabled: true,
        logic: 'AND',
        conditions: [{ ...conditionNode.condition, id: `flow-c-${index}` }],
        action: decisionNode.action
      });
      index += 1;
    }

    currentCondition = edges.find((edge) => edge.source === conditionNode.id && edge.label === 'FALSE')?.target;
  }

  return rules;
}

export function FlowRulesPage() {
  const { flowNodes, flowEdges, setFlow, setRules } = useAppState();
  const [selectedNodeId, setSelectedNodeId] = useState(flowNodes[1]?.id ?? flowNodes[0]?.id ?? '');
  const selectedNode = flowNodes.find((node) => node.id === selectedNodeId);

  const rulesPreview = useMemo(() => buildRulesFromFlow(flowNodes, flowEdges), [flowNodes, flowEdges]);

  function updateNode(patch: Partial<FlowNode>) {
    setFlow(
      flowNodes.map((node) => (node.id === selectedNodeId ? { ...node, ...patch } : node)),
      flowEdges
    );
  }

  return (
    <div className="grid grid-cols-12 gap-4">
      <Card className="col-span-12 lg:col-span-2">
        <CardHeader><CardTitle>Node Palette</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <Button className="w-full" variant="secondary" onClick={() => {
            const id = `cond-${Date.now()}`;
            setFlow([...flowNodes, { id, type: 'condition', x: 280, y: 320, label: 'Nueva condición', condition: { id: id + '-condition', var: 'income', op: '>=', value: 30000 } }], flowEdges);
          }}>+ Condición</Button>
          <Button className="w-full" variant="secondary" onClick={() => {
            const id = `decision-${Date.now()}`;
            setFlow([...flowNodes, { id, type: 'decision', x: 620, y: 320, label: 'REVIEW', action: 'REVIEW' }], flowEdges);
          }}>+ Resultado</Button>
          <Button className="w-full" onClick={() => setRules(rulesPreview)}>Guardar flujo a JSON</Button>
        </CardContent>
      </Card>

      <Card className="col-span-12 lg:col-span-7">
        <CardHeader><CardTitle>Reglas (Flujo)</CardTitle></CardHeader>
        <CardContent>
          <div className="relative h-[520px] overflow-auto rounded-xl border bg-white">
            <svg className="absolute inset-0 h-full w-full">
              {flowEdges.map((edge) => {
                const source = flowNodes.find((node) => node.id === edge.source);
                const target = flowNodes.find((node) => node.id === edge.target);
                if (!source || !target) return null;
                return (
                  <g key={edge.id}>
                    <line x1={source.x + 120} y1={source.y + 30} x2={target.x} y2={target.y + 30} stroke={edge.label === 'TRUE' ? '#22c55e' : edge.label === 'FALSE' ? '#ef4444' : '#64748b'} strokeWidth="2" />
                    <text x={(source.x + target.x) / 2 + 40} y={(source.y + target.y) / 2 + 20} fontSize="12">{edge.label}</text>
                  </g>
                );
              })}
            </svg>

            {flowNodes.map((node) => (
              <button
                key={node.id}
                className={`absolute w-44 rounded-xl border p-3 text-left text-sm ${nodeStyle(node.type)} ${selectedNodeId === node.id ? 'ring-2 ring-slate-900' : ''}`}
                style={{ left: node.x, top: node.y }}
                onClick={() => setSelectedNodeId(node.id)}
              >
                <div className="text-xs uppercase text-slate-500">{node.type}</div>
                <div className="mt-1 font-semibold">{node.label}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-12 lg:col-span-3">
        <CardHeader><CardTitle>Editar nodo</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {!selectedNode && <p className="text-sm text-slate-500">Selecciona un nodo.</p>}
          {selectedNode && (
            <>
              <Input value={selectedNode.label} onChange={(event) => updateNode({ label: event.target.value })} />
              {selectedNode.type === 'condition' && selectedNode.condition && (
                <>
                  <select className="w-full rounded-xl border border-slate-300 p-2" value={selectedNode.condition.var} onChange={(event) => updateNode({ condition: { ...selectedNode.condition!, var: event.target.value as RuleCondition['var'] } })}>
                    {variableCatalog.map((variable) => <option key={variable.key} value={variable.key}>{variable.key}</option>)}
                  </select>
                  <select className="w-full rounded-xl border border-slate-300 p-2" value={selectedNode.condition.op} onChange={(event) => updateNode({ condition: { ...selectedNode.condition!, op: event.target.value as RuleCondition['op'] } })}>
                    {['>=', '<=', '==', '!=', 'IN', 'BETWEEN'].map((operator) => <option key={operator}>{operator}</option>)}
                  </select>
                  <Input value={String(selectedNode.condition.value)} onChange={(event) => updateNode({ condition: { ...selectedNode.condition!, value: Number(event.target.value) } })} />
                </>
              )}
              {selectedNode.type === 'decision' && (
                <select className="w-full rounded-xl border border-slate-300 p-2" value={selectedNode.action} onChange={(event) => updateNode({ action: event.target.value as Rule['action'], label: event.target.value })}>
                  <option>APPROVE</option><option>REJECT</option><option>REVIEW</option>
                </select>
              )}
            </>
          )}
          <pre className="overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-emerald-100">{JSON.stringify(rulesPreview, null, 2)}</pre>
        </CardContent>
      </Card>
    </div>
  );
}
