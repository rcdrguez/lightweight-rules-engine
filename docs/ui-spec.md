# Lightweight Rules Engine Playground — Premium SaaS UI Spec

## 1) Product intent
Design goal: make decision-rule authoring and testing approachable for non-technical stakeholders (VPs, product, ops) without sacrificing power.

Core UX outcomes:
- Learn the product in under 1 minute.
- Build first working rule in under 10 seconds.
- Understand **why** a decision happened in plain language.
- Share a reproducible scenario with one click.

---

## 2) Information architecture

### Global shell
- **Header (sticky)**
  - Product title: `Lightweight Rules Engine`
  - Subtitle: `Build decision policies visually. Explain decisions. Share scenarios.`
  - Primary actions: `Run`, `Validate`, `Share`, `Builder`
  - Mode toggle: `Simple` / `Advanced`
  - Switches: `Explain`, `Strict`
- **Environment alert banner** (only when API URL missing)
  - Friendly copy:
    - Title: `Heads up: Playground API is not configured yet`
    - Body: `Set NEXT_PUBLIC_RULES_API_URL to run live evaluations. You can still explore the interface and examples.`

### Main navigation (Tabs)
- `Playground` (default)
- `Docs`
- `About`

---

## 3) Playground screen layout

## Desktop (>= 1024px)
Two-column grid (`5fr / 4fr`) with generous spacing.

### Left column — Rules
#### Simple mode
- **Rule Manager card list**
  - Each rule card includes:
    - Rule name + id
    - Priority badge
    - Condition summary
    - Action summary
  - Per-rule actions:
    - Edit
    - Duplicate
    - Delete
    - Move up/down
- CTA button: `+ Add rule` (opens right-side Builder sheet)

#### Advanced mode
- JSON editor for full `RuleSet`
- Inline helper hints:
  - Required top-level keys
  - Priority ordering note
- Inline validation errors

### Right column — Facts + Output
#### Facts panel
- **Simple mode:** guided Facts Builder form
  - Plain-language labeled inputs
  - `Load example facts` button
  - Collapsible JSON preview
- **Advanced mode:** Facts JSON editor

#### Output panel
- Decision badge: `APPROVE` / `REJECT` / `REVIEW`
- Matched rules list
- Tags list (as badges)
- Expandable section: `Why this decision?`
  - Human-readable explain trace
- Collapsible section: raw JSON
- Error block with clear styling + suggested fixes

## Mobile (< 1024px)
- Single-column stacked cards
- Header compacts to title + key actions
- Tabs remain scrollable horizontally
- Sticky bottom action bar:
  - `Run`
  - `Builder`
  - `Share`

---

## 4) Rule Builder sheet (right-side Drawer/Sheet)

Three-step wizard:

1. **Template**
   - Options: Loan Eligibility, Fraud Flag, Discount Policy
   - Optional: Start from blank
2. **IF criteria**
   - Field + Operator + Value rows
   - Group logic toggle `AND` / `OR`
   - Validation hints:
     - Numeric fields require numbers
     - Boolean fields require `true`/`false`
3. **THEN outcome**
   - Decision selector
   - Tags input (chip-style)
   - Optional notes

Persistent preview block:
- Natural language sentence format:
  - `IF Credit score >= 680 AND DTI <= 0.35 THEN Decision = APPROVE (Tags: LOW_RISK)`

Footer actions:
- `Insert rule`
- `Insert & Run`
- `Cancel`

Microcopy/tooltips:
- Field tooltip: `Choose a fact key from incoming data.`
- Operator tooltip: `Use contains for arrays/strings, equals for exact matches.`
- Tags hint: `Tags help with audit and downstream routing.`

---

## 5) Component inventory (shadcn/ui + Radix + Lucide)

- Layout: `Card`, `Separator`, `ScrollArea`, `Sheet`
- Navigation: `Tabs`
- Inputs: `Input`, `Textarea`, `Select`, `Switch`, `Label`, `Tooltip`, `Collapsible`
- Feedback: `Alert`, `Badge`, `Sonner toast`, `Skeleton`
- Actions: `Button`, `DropdownMenu` (optional for rule actions)
- Content: `Accordion` (for explain trace), `Table` or list blocks
- Icons (`lucide-react`): `Play`, `CheckCircle2`, `Share2`, `WandSparkles`, `FileJson`, `ShieldAlert`, `Info`, `CircleHelp`

---

## 6) Screen states

### Empty state
- Shown when no rules exist yet.
- Copy:
  - Title: `No rules yet`
  - Body: `Start with a template in Builder or add your first rule manually.`
  - CTA: `Open Builder`

### Loading state
- Disable Run/Validate buttons while evaluating.
- Show skeleton rows in output sections.
- Toast: `Running policy evaluation…`

### Success state
- Decision badge in high-contrast color.
- Matched rules/tags populated.
- Explain trace expanded by default on first successful run.
- Toast: `Evaluation completed`.

### Error state
- Inline JSON validation messages.
- Output error alert includes:
  - Human explanation (`Field dti must be numeric.`)
  - Suggested fix (`Set dti to a number like 0.31`)
- Toast: `Couldn’t run evaluation. Please fix highlighted fields.`

---

## 7) Copy deck

### Header copy
- Product: `Lightweight Rules Engine`
- Subtitle: `Build decision policies visually. Explain decisions. Share scenarios.`

### Onboarding card (first visit)
- Title: `Try it in 10 seconds`
- Steps:
  1. `Open Builder`
  2. `Load example facts`
  3. `Insert rule`
  4. `Run`
- Helper text: `You’ll immediately see the decision, matched rules, and a plain-language explanation.`

### Docs tab copy blocks
- `What is a RuleSet?` A list of ordered rules evaluated by priority.
- `What are Facts?` Input data the engine reads to decide outcomes.
- `What is a Decision?` The selected outcome (`APPROVE`, `REJECT`, `REVIEW`).
- `What is Trace?` A step-by-step explanation of which rules matched and why.

### Glossary (short)
- Rule
- Condition
- Action
- Priority
- Trace
- Tag

---

## 8) High-fidelity wireframe description

### Desktop visual direction
- Neutral background (`slate-50`), white cards, subtle top gradient accent.
- 2xl rounded cards, soft shadows, 24px spacing rhythm.
- Distinct hierarchy:
  - H1 (product)
  - H2 (tab-level sections)
  - H3 (card headers)
  - muted helper text
- Primary actions use solid dark button; secondary actions use outline/ghost.

### Mobile visual direction
- Keep cards full-width with 16px padding.
- Critical controls (`Run`, `Builder`, `Share`) pinned in a blurred sticky bottom bar.
- Collapse complex content (raw JSON, trace details) by default.

---

## 9) Accessibility + usability checklist

- Keyboard reachable for all controls, including rule actions and sheet wizard controls.
- Focus-visible ring on interactive elements.
- Minimum body text 14px, headings 18px+.
- Contrast-compliant badges and alerts.
- Labels bound to fields; icon-only controls include `aria-label`.
- Inline errors announced using `aria-live="polite"` where possible.

---

## 10) Performance + implementation notes

- Default to client-side local state for quick interaction.
- Defer JSON pretty-printing to avoid blocking on large payloads.
- Keep explanation rendering lightweight; virtualize only if traces become long.
- Use optimistic UI for “Insert & Run” with recoverable error states.
