'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Condition, Decision, Operator, Rule, TemplateType } from '@/types/rules';

const operators: Operator[] = ['==', '!=', '>', '>=', '<', '<=', 'includes', 'not_includes'];

const templateHints: Record<TemplateType, string> = {
  Loan: 'Use credit score and debt-to-income ratio to route application outcomes.',
  Fraud: 'Use transaction velocity, location mismatch, and amount thresholds to flag risk.',
  Discount: 'Use basket value and customer loyalty to personalize discount decisions.'
};

interface RuleBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (rule: Rule, runAfterInsert: boolean) => void;
}

export function RuleBuilder({ open, onOpenChange, onInsert }: RuleBuilderProps) {
  const [step, setStep] = useState(1);
  const [template, setTemplate] = useState<TemplateType>('Loan');
  const [ruleId, setRuleId] = useState('RULE-CUSTOM-01');
  const [priority, setPriority] = useState(2);
  const [decision, setDecision] = useState<Decision>('APPROVE');
  const [tags, setTags] = useState('new-rule');
  const [conditions, setConditions] = useState<Condition[]>([{ field: 'creditScore', operator: '>=', value: 680 }]);

  const preview = useMemo(
    () => `IF ${conditions.map((c) => `${c.field} ${c.operator} ${c.value}`).join(' AND ')} THEN ${decision}`,
    [conditions, decision]
  );

  function addCondition() {
    setConditions((prev) => [...prev, { field: 'dti', operator: '<=', value: 0.35 }]);
  }

  function updateCondition(index: number, patch: Partial<Condition>) {
    setConditions((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function buildRule() {
    return {
      id: ruleId,
      priority,
      conditions,
      decision,
      tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean)
    } satisfies Rule;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <h3 className="text-xl font-semibold text-slate-900">Rule Builder</h3>
        <p className="mt-1 text-sm text-slate-600">Build rules with a guided wizard, then insert directly into your ruleset.</p>

        <div className="mt-6 space-y-6">
          <section className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Step 1: Template</p>
            <div className="grid grid-cols-3 gap-2">
              {(['Loan', 'Fraud', 'Discount'] as TemplateType[]).map((item) => (
                <Button key={item} variant={item === template ? 'default' : 'secondary'} onClick={() => setTemplate(item)}>
                  {item}
                </Button>
              ))}
            </div>
            <p className="text-xs text-slate-500">{templateHints[template]}</p>
          </section>

          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Step 2: Conditions</p>
            <Input value={ruleId} onChange={(e) => setRuleId(e.target.value)} placeholder="Rule ID" />
            <Input type="number" value={priority} onChange={(e) => setPriority(Number(e.target.value))} placeholder="Priority" />
            {conditions.map((condition, index) => (
              <div key={index} className="grid grid-cols-3 gap-2">
                <Input value={condition.field} onChange={(e) => updateCondition(index, { field: e.target.value })} placeholder="Field" />
                <select
                  className="rounded-xl border border-slate-300 px-3 text-sm"
                  value={condition.operator}
                  onChange={(e) => updateCondition(index, { operator: e.target.value as Operator })}
                >
                  {operators.map((op) => (
                    <option key={op} value={op}>{op}</option>
                  ))}
                </select>
                <Input value={String(condition.value)} onChange={(e) => updateCondition(index, { value: e.target.value })} placeholder="Value" />
              </div>
            ))}
            <Button variant="outline" onClick={addCondition}>+ Condition</Button>
          </section>

          <section className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Step 3: Outcome</p>
            <select className="h-10 w-full rounded-xl border border-slate-300 px-3 text-sm" value={decision} onChange={(e) => setDecision(e.target.value as Decision)}>
              <option value="APPROVE">APPROVE</option>
              <option value="REJECT">REJECT</option>
              <option value="REVIEW">REVIEW</option>
            </select>
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="tags (comma-separated)" />
          </section>

          <div className="rounded-xl bg-slate-100 p-3 text-sm text-slate-700">{preview}</div>

          <div className="flex gap-2">
            <Button onClick={() => onInsert(buildRule(), false)}>Insert Rule</Button>
            <Button variant="secondary" onClick={() => onInsert(buildRule(), true)}>Insert & Run</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
