"use client";

import { useMemo, useState } from "react";
import {
  Play,
  CheckCircle2,
  Share2,
  WandSparkles,
  Info,
  ShieldAlert,
  FileJson,
  CircleHelp,
} from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

type Mode = "simple" | "advanced";

type RuleTemplate = "loan" | "fraud" | "discount";

const decisionStyles: Record<string, string> = {
  APPROVE: "bg-emerald-100 text-emerald-800",
  REJECT: "bg-rose-100 text-rose-800",
  REVIEW: "bg-amber-100 text-amber-800",
};

export default function PlaygroundPage() {
  const [mode, setMode] = useState<Mode>("simple");
  const [explain, setExplain] = useState(true);
  const [strict, setStrict] = useState(false);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [template, setTemplate] = useState<RuleTemplate>("loan");

  const apiMissing = !process.env.NEXT_PUBLIC_RULES_API_URL;

  const naturalLanguagePreview = useMemo(() => {
    if (template === "fraud") {
      return "IF Velocity > 3 AND Device mismatch = true THEN Decision = REVIEW (Tags: FRAUD_SIGNAL)";
    }
    if (template === "discount") {
      return "IF Customer tier = GOLD OR Cart value >= 250 THEN Decision = APPROVE (Tags: DISCOUNT_ELIGIBLE)";
    }
    return "IF Credit score >= 680 AND DTI <= 0.35 THEN Decision = APPROVE (Tags: LOW_RISK)";
  }, [template]);

  function onRun() {
    toast.success("Evaluation completed", {
      description: "Decision and explain trace are now updated.",
    });
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6 p-4 pb-24 md:p-8">
        <header className="space-y-4 rounded-3xl border bg-gradient-to-b from-white to-slate-50 p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Lightweight Rules Engine</h1>
              <p className="mt-1 text-sm text-slate-600 md:text-base">
                Build decision policies visually. Explain decisions. Share scenarios.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={onRun} className="gap-2">
                <Play className="h-4 w-4" /> Run
              </Button>
              <Button variant="secondary" className="gap-2">
                <CheckCircle2 className="h-4 w-4" /> Validate
              </Button>
              <Button variant="outline" className="gap-2">
                <Share2 className="h-4 w-4" /> Share
              </Button>
              <Sheet open={builderOpen} onOpenChange={setBuilderOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <WandSparkles className="h-4 w-4" /> Builder
                  </Button>
                </SheetTrigger>
                <RuleBuilderSheet
                  template={template}
                  setTemplate={setTemplate}
                  preview={naturalLanguagePreview}
                  onInsert={() => {
                    toast.success("Rule inserted");
                    setBuilderOpen(false);
                  }}
                  onInsertAndRun={() => {
                    toast.success("Rule inserted and executed");
                    setBuilderOpen(false);
                  }}
                />
              </Sheet>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="inline-flex rounded-xl border bg-white p-1">
              <Button
                variant={mode === "simple" ? "default" : "ghost"}
                size="sm"
                onClick={() => setMode("simple")}
              >
                Simple
              </Button>
              <Button
                variant={mode === "advanced" ? "default" : "ghost"}
                size="sm"
                onClick={() => setMode("advanced")}
              >
                Advanced
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Switch id="explain" checked={explain} onCheckedChange={setExplain} />
              <Label htmlFor="explain">Explain</Label>
            </div>

            <div className="flex items-center gap-2">
              <Switch id="strict" checked={strict} onCheckedChange={setStrict} />
              <Label htmlFor="strict">Strict</Label>
            </div>
          </div>

          {apiMissing ? (
            <Alert>
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>Heads up: Playground API is not configured yet</AlertTitle>
              <AlertDescription>
                Set <code>NEXT_PUBLIC_RULES_API_URL</code> to run live evaluations. You can still explore the
                interface and examples.
              </AlertDescription>
            </Alert>
          ) : null}
        </header>

        <Tabs defaultValue="playground" className="space-y-4">
          <TabsList>
            <TabsTrigger value="playground">Playground</TabsTrigger>
            <TabsTrigger value="docs">Docs</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>

          <TabsContent value="playground" className="space-y-4">
            <Card className="rounded-3xl border-dashed">
              <CardHeader>
                <CardTitle>Try it in 10 seconds</CardTitle>
                <CardDescription>
                  1) Open Builder → 2) Load example facts → 3) Insert rule → 4) Run
                </CardDescription>
              </CardHeader>
            </Card>

            <section className="grid gap-4 lg:grid-cols-9">
              <div className="space-y-4 lg:col-span-5">
                <Card className="rounded-3xl">
                  <CardHeader>
                    <CardTitle>Rules</CardTitle>
                    <CardDescription>
                      {mode === "simple"
                        ? "Manage rules visually with priorities and summaries."
                        : "Edit full RuleSet JSON with inline validation feedback."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {mode === "simple" ? (
                      <>
                        <RuleCard />
                        <Button variant="outline" className="w-full" onClick={() => setBuilderOpen(true)}>
                          + Add rule
                        </Button>
                      </>
                    ) : (
                      <>
                        <Textarea className="min-h-[260px] font-mono text-xs" defaultValue={`{\n  "rules": []\n}`} />
                        <Alert>
                          <Info className="h-4 w-4" />
                          <AlertDescription>
                            Required keys: <code>id</code>, <code>priority</code>, <code>if</code>, <code>then</code>.
                          </AlertDescription>
                        </Alert>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4 lg:col-span-4">
                <Card className="rounded-3xl">
                  <CardHeader>
                    <CardTitle>Facts</CardTitle>
                    <CardDescription>
                      {mode === "simple" ? "Guided Facts Builder for non-technical users." : "Facts JSON input."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {mode === "simple" ? (
                      <>
                        <div className="grid gap-2">
                          <Label htmlFor="creditScore">Credit score</Label>
                          <Input id="creditScore" placeholder="e.g. 720" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="dti">Debt-to-income ratio</Label>
                          <Input id="dti" placeholder="e.g. 0.31" />
                        </div>
                        <Button variant="secondary">Load example facts</Button>
                        <Collapsible>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" className="w-full justify-start gap-2">
                              <FileJson className="h-4 w-4" /> JSON preview
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <pre className="rounded-xl border bg-slate-950 p-3 text-xs text-slate-100">
{`{
  "creditScore": 720,
  "dti": 0.31
}`}
                            </pre>
                          </CollapsibleContent>
                        </Collapsible>
                      </>
                    ) : (
                      <Textarea className="min-h-[220px] font-mono text-xs" defaultValue={`{\n  "creditScore": 720\n}`} />
                    )}
                  </CardContent>
                </Card>

                <Card className="rounded-3xl">
                  <CardHeader>
                    <CardTitle>Output</CardTitle>
                    <CardDescription>Decision, matched rules, tags, and explain trace.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-600">Decision</span>
                      <Badge className={decisionStyles.APPROVE}>APPROVE</Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Matched rules</p>
                      <ul className="list-inside list-disc text-sm text-slate-600">
                        <li>loan.low-risk.approve</li>
                      </ul>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">LOW_RISK</Badge>
                      <Badge variant="secondary">AUTO_APPROVE</Badge>
                    </div>

                    <Collapsible defaultOpen={explain}>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="w-full justify-start gap-2">
                          <CircleHelp className="h-4 w-4" /> Why this decision?
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-2 rounded-xl border p-3 text-sm text-slate-700">
                        <p>Rule `loan.low-risk.approve` matched because Credit score (720) ≥ 680 and DTI (0.31) ≤ 0.35.</p>
                      </CollapsibleContent>
                    </Collapsible>

                    <Separator />

                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertTitle>Suggested fix example</AlertTitle>
                      <AlertDescription>
                        If <code>dti</code> is invalid, set it to a number like <code>0.31</code>.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="docs">
            <Card className="rounded-3xl">
              <CardHeader>
                <CardTitle>Docs</CardTitle>
                <CardDescription>Simple explanations and practical examples.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-slate-700">
                <p>
                  <strong>RuleSet:</strong> ordered rules evaluated by priority. <strong>Facts:</strong> input data.
                  <strong> Decision:</strong> outcome such as APPROVE/REJECT/REVIEW. <strong>Trace:</strong> why rules
                  matched.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="about">
            <Card className="rounded-3xl">
              <CardHeader>
                <CardTitle>About</CardTitle>
                <CardDescription>Playground UI concept for a modern rules-engine workflow.</CardDescription>
              </CardHeader>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-white/95 p-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-md items-center justify-between gap-2">
          <Button className="flex-1 gap-2" onClick={onRun}>
            <Play className="h-4 w-4" /> Run
          </Button>
          <Button variant="secondary" className="flex-1 gap-2" onClick={() => setBuilderOpen(true)}>
            <WandSparkles className="h-4 w-4" /> Builder
          </Button>
          <Button variant="outline" className="flex-1 gap-2">
            <Share2 className="h-4 w-4" /> Share
          </Button>
        </div>
      </div>
    </main>
  );
}

type RuleBuilderSheetProps = {
  template: RuleTemplate;
  setTemplate: (template: RuleTemplate) => void;
  preview: string;
  onInsert: () => void;
  onInsertAndRun: () => void;
};

function RuleBuilderSheet({ template, setTemplate, preview, onInsert, onInsertAndRun }: RuleBuilderSheetProps) {
  return (
    <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
      <SheetHeader>
        <SheetTitle>Rule Builder</SheetTitle>
        <SheetDescription>Create a rule in 3 steps with plain language guidance.</SheetDescription>
      </SheetHeader>

      <div className="mt-6 space-y-6">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">1) Choose template</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant={template === "loan" ? "default" : "outline"} onClick={() => setTemplate("loan")}>Loan Eligibility</Button>
            <Button variant={template === "fraud" ? "default" : "outline"} onClick={() => setTemplate("fraud")}>Fraud Flag</Button>
            <Button variant={template === "discount" ? "default" : "outline"} onClick={() => setTemplate("discount")}>Discount Policy</Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">2) Define criteria (IF)</CardTitle>
            <CardDescription>Field + operator + value with AND/OR support.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="grid gap-2">
              <Label>Field</Label>
              <Input placeholder="creditScore" />
            </div>
            <div className="grid gap-2">
              <Label>Operator</Label>
              <Input placeholder=">=" />
            </div>
            <div className="grid gap-2">
              <Label>Value</Label>
              <Input placeholder="680" />
            </div>
            <p className="text-xs text-slate-500">Hint: numeric fields require numbers. Boolean fields require true/false.</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">3) Define outcome (THEN)</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="grid gap-2">
              <Label>Decision</Label>
              <Input placeholder="APPROVE" />
            </div>
            <div className="grid gap-2">
              <Label>Tags</Label>
              <Input placeholder="LOW_RISK, AUTO_APPROVE" />
            </div>
            <div className="grid gap-2">
              <Label>Notes (optional)</Label>
              <Textarea placeholder="Explain business intent of this rule" />
            </div>
          </CardContent>
        </Card>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Natural language preview</AlertTitle>
          <AlertDescription>{preview}</AlertDescription>
        </Alert>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline">Cancel</Button>
          <Button variant="secondary" onClick={onInsert}>Insert rule</Button>
          <Button onClick={onInsertAndRun}>Insert &amp; Run</Button>
        </div>
      </div>
    </SheetContent>
  );
}

function RuleCard() {
  return (
    <Card className="rounded-2xl border">
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">Low Risk Approve</CardTitle>
          <Badge variant="outline">Priority 100</Badge>
        </div>
        <CardDescription>ID: loan.low-risk.approve</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-slate-700">
        <p>
          <strong>IF:</strong> creditScore &gt;= 680 AND dti &lt;= 0.35
        </p>
        <p>
          <strong>THEN:</strong> decision=APPROVE, tags=[LOW_RISK]
        </p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline">Edit</Button>
          <Button size="sm" variant="outline">Duplicate</Button>
          <Button size="sm" variant="outline">Delete</Button>
          <Button size="sm" variant="ghost">↑</Button>
          <Button size="sm" variant="ghost">↓</Button>
        </div>
      </CardContent>
    </Card>
  );
}
