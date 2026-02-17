import { Facts, RuleSet } from '@/types/rules';

export const defaultRuleSet: RuleSet = {
  name: 'Loan Intake Policy',
  version: '1.0.0',
  rules: [
    {
      id: 'RULE-APPROVE-01',
      priority: 1,
      conditions: [
        { field: 'creditScore', operator: '>=', value: 680 },
        { field: 'dti', operator: '<=', value: 0.35 }
      ],
      decision: 'APPROVE',
      tags: ['prime', 'low-risk']
    },
    {
      id: 'RULE-REVIEW-01',
      priority: 2,
      conditions: [{ field: 'creditScore', operator: '>=', value: 620 }],
      decision: 'REVIEW',
      tags: ['manual-review']
    },
    {
      id: 'RULE-REJECT-01',
      priority: 3,
      conditions: [{ field: 'creditScore', operator: '<', value: 620 }],
      decision: 'REJECT',
      tags: ['subprime']
    }
  ]
};

export const defaultFacts: Facts = {
  creditScore: 665,
  dti: 0.31,
  employmentYears: 4,
  existingCustomer: true
};
