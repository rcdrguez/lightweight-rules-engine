'use client';

import { useMemo, useState } from 'react';
import { Rule, RuleSet } from '@/types/rules';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

const operators = ['==', '!=', '>', '>=', '<', '<=', 'includes', 'not_includes'] as const;

interface PositionedNode {
  id: string;
  label: string;
  x: number;
  y: number;
  tone: 'input' | 'condition' | 'approve' | 'reject' | 'review';
}

interface RuleFlowBuilderProps {
  ruleSet: RuleSet;
  selectedRuleId?: string;
  activeNodeId?: string;
  onSelectRule: (ruleId: string) => void;
  onUpdateRule: (ruleId: string, patch: Partial<Rule>) => void;
  onUpdateCondition: (ruleId: string, index: number, patch: Partial<Rule['conditions'][number]>) => void;
  onAddRule: () => void;
  onReorderRules: (sourceId: string, targetId: string) => void;
}

export function RuleFlowBuilder({ ruleSet, selectedRuleId, activeNodeId, onSelectRule, onUpdateRule, onUpdateCondition, onAddRule, onReorderRules }: RuleFlowBuilderProps) {
  const [draggingRuleId, setDraggingRuleId] = useState<string | null>(null);
  const sortedRules = useMemo(() => [...ruleSet.rules].sort((a, b) => a.priority - b.priority), [ruleSet.rules]);

  const { nodes, connectors } = useMemo(() => {
    const nextNodes: PositionedNode[] = [
      { id: 'input', label: 'INPUT FACTS', x: 20, y: 140, tone: 'input' }
    ];
    const nextConnectors: Array<{ from: string; to: string }> = [];

    sortedRules.forEach((rule, ruleIdx) => {
      const baseY = 20 + ruleIdx * 170;
      const firstNodeId = `${rule.id}-condition-0`;
      nextConnectors.push({ from: 'input', to: firstNodeId });

      rule.conditions.forEach((condition, conditionIdx) => {
        const conditionId = `${rule.id}-condition-${conditionIdx}`;
        nextNodes.push({
          id: conditionId,
          label: `IF ${condition.field} ${condition.operator} ${String(condition.value)}`,
          x: 260 + conditionIdx * 250,
          y: baseY,
          tone: 'condition'
        });

        if (conditionIdx < rule.conditions.length - 1) {
          nextConnectors.push({ from: conditionId, to: `${rule.id}-condition-${conditionIdx + 1}` });
        } else {
          const tone = rule.decision === 'APPROVE' ? 'approve' : rule.decision === 'REJECT' ? 'reject' : 'review';
          nextNodes.push({
            id: `${rule.id}-result`,
            label: `${rule.id} → ${rule.decision}`,
            x: 260 + rule.conditions.length * 250,
            y: baseY,
            tone
          });
          nextConnectors.push({ from: conditionId, to: `${rule.id}-result` });
        }
      });
    });

    return { nodes: nextNodes, connectors: nextConnectors };
  }, [sortedRules]);

  const selectedRule = sortedRules.find((rule) => rule.id === selectedRuleId) ?? sortedRules[0];

  return (
    <div className="grid gap-4 xl:grid-cols-[280px_1fr_340px]">
      <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-3">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">Rule Priority</h3>
          <Button size="sm" variant="secondary" onClick={onAddRule}>+ Rule</Button>
        </div>
        <div className="space-y-2">
          {sortedRules.map((rule) => (
            <button
              key={rule.id}
              draggable
              onDragStart={() => setDraggingRuleId(rule.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (draggingRuleId && draggingRuleId !== rule.id) onReorderRules(draggingRuleId, rule.id);
                setDraggingRuleId(null);
              }}
              onClick={() => onSelectRule(rule.id)}
              className={`w-full rounded-xl border p-3 text-left ${selectedRule?.id === rule.id ? 'border-cyan-400 bg-slate-900' : 'border-slate-700 bg-slate-900/60'}`}
            >
              <p className="text-xs text-slate-400">P{rule.priority}</p>
              <p className="text-sm font-medium text-slate-100">{rule.id}</p>
              <Badge variant={rule.decision === 'APPROVE' ? 'success' : rule.decision === 'REJECT' ? 'danger' : 'warning'} className="mt-1">{rule.decision}</Badge>
            </button>
          ))}
        </div>
      </div>

      <div className="relative h-[540px] overflow-auto rounded-2xl border border-slate-800 bg-slate-950 p-4">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1500 700" preserveAspectRatio="none">
          {connectors.map((connector) => {
            const from = nodes.find((node) => node.id === connector.from);
            const to = nodes.find((node) => node.id === connector.to);
            if (!from || !to) return null;
            return (
              <line
                key={`${connector.from}-${connector.to}`}
                x1={from.x + 180}
                y1={from.y + 45}
                x2={to.x}
                y2={to.y + 45}
                stroke={activeNodeId === connector.to ? '#22c55e' : '#334155'}
                strokeWidth="2"
                markerEnd="url(#arrow)"
              />
            );
          })}
          <defs>
            <marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 z" fill="#334155" />
            </marker>
          </defs>
        </svg>

        {nodes.map((node) => (
          <button
            key={node.id}
            onClick={() => {
              if (node.id !== 'input') onSelectRule(node.id.split('-condition-')[0].split('-result')[0]);
            }}
            className={`absolute w-[180px] rounded-xl border px-3 py-2 text-left text-sm ${activeNodeId === node.id ? 'border-cyan-400 shadow-[0_0_0_2px_rgba(56,189,248,0.2)]' : 'border-slate-700'} ${
              node.tone === 'input'
                ? 'bg-slate-900 text-slate-200'
                : node.tone === 'approve'
                  ? 'bg-emerald-900/70 text-emerald-100'
                  : node.tone === 'reject'
                    ? 'bg-rose-900/70 text-rose-100'
                    : node.tone === 'review'
                      ? 'bg-amber-900/70 text-amber-100'
                      : 'bg-slate-900/90 text-slate-200'
            }`}
            style={{ left: node.x, top: node.y }}
          >
            {node.label}
          </button>
        ))}
      </div>

      {selectedRule && (
        <aside className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4 text-slate-100">
          <h3 className="text-lg font-semibold">{selectedRule.id}</h3>
          <p className="text-xs text-slate-400">Edit selected block</p>
          <div className="mt-4 space-y-3">
            <label className="block text-xs uppercase text-slate-400">Priority</label>
            <Input type="number" value={selectedRule.priority} onChange={(event) => onUpdateRule(selectedRule.id, { priority: Number(event.target.value) })} />
            <label className="block text-xs uppercase text-slate-400">Decision</label>
            <select value={selectedRule.decision} onChange={(event) => onUpdateRule(selectedRule.id, { decision: event.target.value as Rule['decision'] })} className="h-10 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 text-sm">
              <option value="APPROVE">APPROVE</option><option value="REJECT">REJECT</option><option value="REVIEW">REVIEW</option>
            </select>
            <div className="flex items-center justify-between rounded-xl border border-slate-700 p-3">
              <span className="text-sm">Rule enabled</span>
              <Switch checked={selectedRule.enabled !== false} onCheckedChange={(checked) => onUpdateRule(selectedRule.id, { enabled: checked })} />
            </div>
            {selectedRule.conditions.map((condition, index) => (
              <div key={`${selectedRule.id}-${index}`} className="space-y-2 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                <Input value={condition.field} onChange={(event) => onUpdateCondition(selectedRule.id, index, { field: event.target.value })} placeholder="Variable" />
                <select value={condition.operator} onChange={(event) => onUpdateCondition(selectedRule.id, index, { operator: event.target.value as Rule['conditions'][number]['operator'] })} className="h-10 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 text-sm">
                  {operators.map((operator) => <option key={operator} value={operator}>{operator}</option>)}
                </select>
                <Input value={String(condition.value)} onChange={(event) => onUpdateCondition(selectedRule.id, index, { value: event.target.value })} placeholder="Value" />
              </div>
            ))}
          </div>
        </aside>
      )}
    </div>
  );
}
