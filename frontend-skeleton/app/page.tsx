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
  Plus,
  Sparkles,
  ListChecks,
  Database,
  Bot,
  ChevronRight,
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
  APPROVE: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
  REJECT: "border-rose-500/40 bg-rose-500/15 text-rose-300",
  REVIEW: "border-amber-500/40 bg-amber-500/15 text-amber-300",
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
      return "IF velocity > 3 AND deviceMismatch = true THEN decision = REVIEW (tags: FRAUD_SIGNAL)";
    }
    if (template === "discount") {
      return "IF customerTier = GOLD OR cartValue >= 250 THEN decision = APPROVE (tags: DISCOUNT_ELIGIBLE)";
    }
    return "IF creditScore >= 680 AND dti <= 0.35 THEN decision = APPROVE (tags: LOW_RISK)";
  }, [template]);

  function onRun() {
    toast.success("Evaluación completada", {
      description: "Se actualizó la decisión y el trace de explicación.",
    });
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-6 p-4 pb-24 md:p-8">
        <header className="rounded-3xl border border-slate-700/70 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-6 shadow-2xl shadow-black/30">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Policy Studio</p>
              <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Lightweight Rules Engine</h1>
              <p className="text-sm text-slate-300 md:text-base">
                Crea reglas y facts con una experiencia guiada, visual e intuitiva.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={onRun} className="gap-2 bg-cyan-500 text-slate-950 hover:bg-cyan-400">
                <Play className="h-4 w-4" /> Run
              </Button>
              <Button variant="secondary" className="gap-2 border border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700">
                <CheckCircle2 className="h-4 w-4" /> Validate
              </Button>
              <Button variant="outline" className="gap-2 border-slate-600 bg-transparent text-slate-100 hover:bg-slate-800">
                <Share2 className="h-4 w-4" /> Share
              </Button>
              <Sheet open={builderOpen} onOpenChange={setBuilderOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="gap-2 border-slate-600 bg-transparent text-slate-100 hover:bg-slate-800">
                    <WandSparkles className="h-4 w-4" /> Builder
                  </Button>
                </SheetTrigger>
                <RuleBuilderSheet
                  template={template}
                  setTemplate={setTemplate}
                  preview={naturalLanguagePreview}
                  onInsert={() => {
                    toast.success("Regla insertada");
                    setBuilderOpen(false);
                  }}
                  onInsertAndRun={() => {
                    toast.success("Regla insertada y ejecutada");
                    setBuilderOpen(false);
                  }}
                />
              </Sheet>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="inline-flex w-fit rounded-xl border border-slate-700 bg-slate-900 p-1">
              <Button
                variant={mode === "simple" ? "default" : "ghost"}
                size="sm"
                className={mode === "simple" ? "bg-cyan-500 text-slate-950" : "text-slate-300"}
                onClick={() => setMode("simple")}
              >
                Simple
              </Button>
              <Button
                variant={mode === "advanced" ? "default" : "ghost"}
                size="sm"
                className={mode === "advanced" ? "bg-cyan-500 text-slate-950" : "text-slate-300"}
                onClick={() => setMode("advanced")}
              >
                Advanced
              </Button>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm">
              <Switch id="explain" checked={explain} onCheckedChange={setExplain} />
              <Label htmlFor="explain" className="text-slate-200">Explain trace</Label>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm">
              <Switch id="strict" checked={strict} onCheckedChange={setStrict} />
              <Label htmlFor="strict" className="text-slate-200">Strict mode</Label>
            </div>
          </div>

          {apiMissing ? (
            <Alert className="mt-4 border-amber-600/30 bg-amber-500/10 text-amber-100">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>Configura la API para evaluaciones reales</AlertTitle>
              <AlertDescription>
                Define <code>NEXT_PUBLIC_RULES_API_URL</code>. Mientras tanto puedes diseñar reglas y facts en esta
                interfaz.
              </AlertDescription>
            </Alert>
          ) : null}
        </header>

        <Tabs defaultValue="playground" className="space-y-4">
          <TabsList className="border border-slate-700 bg-slate-900/70">
            <TabsTrigger value="playground">Playground</TabsTrigger>
            <TabsTrigger value="docs">Docs</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>

          <TabsContent value="playground" className="space-y-4">
            <Card className="rounded-3xl border-slate-700 bg-slate-900/60">
              <CardHeader>
                <CardTitle className="text-slate-100">Flujo sugerido</CardTitle>
                <CardDescription className="text-slate-300">
                  1) Selecciona plantilla <ChevronRight className="mx-1 inline h-4 w-4" /> 2) Carga facts <ChevronRight className="mx-1 inline h-4 w-4" /> 3) Inserta regla <ChevronRight className="mx-1 inline h-4 w-4" /> 4) Run.
                </CardDescription>
              </CardHeader>
            </Card>

            <section className="grid gap-4 lg:grid-cols-12">
              <div className="space-y-4 lg:col-span-7">
                <Card className="rounded-3xl border-slate-700 bg-slate-900/80">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-slate-100">Rules (JSON)</CardTitle>
                        <CardDescription className="text-slate-300">
                          {mode === "simple"
                            ? "Editor visual con bloques de condición y acciones."
                            : "Edición total del RuleSet en JSON."}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="border-cyan-500/40 bg-cyan-500/10 text-cyan-300">
                        <ListChecks className="mr-1 h-3.5 w-3.5" /> Rule authoring
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {mode === "simple" ? (
                      <>
                        <RuleCard />
                        <Button
                          variant="outline"
                          className="w-full gap-2 border-dashed border-slate-600 bg-slate-900 text-slate-200 hover:bg-slate-800"
                          onClick={() => setBuilderOpen(true)}
                        >
                          <Plus className="h-4 w-4" /> Add condition group
                        </Button>
                      </>
                    ) : (
                      <>
                        <Textarea
                          className="min-h-[280px] border-slate-700 bg-slate-950 font-mono text-xs text-slate-100"
                          defaultValue={`{\n  "rules": [\n    {\n      "id": "loan.low-risk.approve",\n      "priority": 100\n    }\n  ]\n}`}
                        />
                        <Alert className="border-slate-700 bg-slate-950/60 text-slate-200">
                          <Info className="h-4 w-4" />
                          <AlertDescription>
                            Campos requeridos: <code>id</code>, <code>priority</code>, <code>if</code>, <code>then</code>.
                          </AlertDescription>
                        </Alert>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4 lg:col-span-5">
                <Card className="rounded-3xl border-slate-700 bg-slate-900/80">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-slate-100">Facts</CardTitle>
                        <CardDescription className="text-slate-300">
                          {mode === "simple" ? "Inputs guiados para negocio." : "Payload de facts en JSON."}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="border-indigo-500/40 bg-indigo-500/10 text-indigo-300">
                        <Database className="mr-1 h-3.5 w-3.5" /> Facts builder
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {mode === "simple" ? (
                      <>
                        <div className="grid gap-2">
                          <Label htmlFor="creditScore" className="text-slate-200">creditScore</Label>
                          <Input id="creditScore" placeholder="720" className="border-slate-700 bg-slate-950 text-slate-100" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="dti" className="text-slate-200">dti</Label>
                          <Input id="dti" placeholder="0.31" className="border-slate-700 bg-slate-950 text-slate-100" />
                        </div>
                        <Button variant="secondary" className="w-full border border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700">
                          Cargar facts de ejemplo
                        </Button>
                        <Collapsible>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" className="w-full justify-start gap-2 text-slate-200 hover:bg-slate-800">
                              <FileJson className="h-4 w-4" /> Ver JSON
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <pre className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-cyan-100">
{`{
  "creditScore": 720,
  "dti": 0.31
}`}
                            </pre>
                          </CollapsibleContent>
                        </Collapsible>
                      </>
                    ) : (
                      <Textarea
                        className="min-h-[220px] border-slate-700 bg-slate-950 font-mono text-xs text-slate-100"
                        defaultValue={`{\n  "creditScore": 720,\n  "dti": 0.31\n}`}
                      />
                    )}
                  </CardContent>
                </Card>

                <Card className="rounded-3xl border-slate-700 bg-slate-900/80">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-slate-100">Result</CardTitle>
                      <Badge className={decisionStyles.APPROVE}>APPROVE</Badge>
                    </div>
                    <CardDescription className="text-slate-300">Decision + trace + tags</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-slate-200">Matched rules</p>
                      <ul className="list-inside list-disc text-sm text-slate-300">
                        <li>loan.low-risk.approve</li>
                      </ul>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="bg-slate-800 text-slate-100">LOW_RISK</Badge>
                      <Badge variant="secondary" className="bg-slate-800 text-slate-100">AUTO_APPROVE</Badge>
                    </div>

                    <Collapsible defaultOpen={explain}>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="w-full justify-start gap-2 text-slate-200 hover:bg-slate-800">
                          <CircleHelp className="h-4 w-4" /> ¿Por qué esta decisión?
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-2 rounded-xl border border-slate-700 bg-slate-950/70 p-3 text-sm text-slate-300">
                        <p>
                          Se evaluó <code>creditScore = 720</code> y <code>dti = 0.31</code>; ambas condiciones cumplen
                          la regla <code>loan.low-risk.approve</code>.
                        </p>
                      </CollapsibleContent>
                    </Collapsible>

                    <Separator className="bg-slate-700" />

                    <Alert className="border-slate-700 bg-slate-950/60 text-slate-200">
                      <Bot className="h-4 w-4" />
                      <AlertTitle>Sugerencia</AlertTitle>
                      <AlertDescription>
                        Si <code>dti</code> no es numérico, usa un valor decimal como <code>0.31</code>.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="docs">
            <Card className="rounded-3xl border-slate-700 bg-slate-900/80">
              <CardHeader>
                <CardTitle className="text-slate-100">Docs</CardTitle>
                <CardDescription className="text-slate-300">Guía rápida del modelo de reglas.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-slate-300">
                <p>
                  <strong>RuleSet:</strong> lista ordenada por prioridad. <strong>Facts:</strong> datos de entrada.
                  <strong> Decision:</strong> resultado (APPROVE/REJECT/REVIEW). <strong>Trace:</strong> explicación de la
                  evaluación.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="about">
            <Card className="rounded-3xl border-slate-700 bg-slate-900/80">
              <CardHeader>
                <CardTitle className="text-slate-100">About</CardTitle>
                <CardDescription className="text-slate-300">Interfaz visual inspirada en dashboards de rule authoring modernos.</CardDescription>
              </CardHeader>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-700 bg-slate-950/95 p-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-md items-center justify-between gap-2">
          <Button className="flex-1 gap-2 bg-cyan-500 text-slate-950 hover:bg-cyan-400" onClick={onRun}>
            <Play className="h-4 w-4" /> Run
          </Button>
          <Button
            variant="secondary"
            className="flex-1 gap-2 border border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700"
            onClick={() => setBuilderOpen(true)}
          >
            <Sparkles className="h-4 w-4" /> Builder
          </Button>
          <Button variant="outline" className="flex-1 gap-2 border-slate-600 text-slate-100 hover:bg-slate-800">
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
    <SheetContent className="w-full overflow-y-auto border-slate-700 bg-slate-950 text-slate-100 sm:max-w-xl">
      <SheetHeader>
        <SheetTitle className="text-slate-100">Rule Builder</SheetTitle>
        <SheetDescription className="text-slate-300">Crea una regla en 3 pasos con vista previa.</SheetDescription>
      </SheetHeader>

      <div className="mt-6 space-y-6">
        <Card className="rounded-2xl border-slate-700 bg-slate-900/80">
          <CardHeader>
            <CardTitle className="text-base text-slate-100">1) Plantilla</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant={template === "loan" ? "default" : "outline"} className={template === "loan" ? "bg-cyan-500 text-slate-950" : "border-slate-600 text-slate-100 hover:bg-slate-800"} onClick={() => setTemplate("loan")}>Loan Eligibility</Button>
            <Button variant={template === "fraud" ? "default" : "outline"} className={template === "fraud" ? "bg-cyan-500 text-slate-950" : "border-slate-600 text-slate-100 hover:bg-slate-800"} onClick={() => setTemplate("fraud")}>Fraud Flag</Button>
            <Button variant={template === "discount" ? "default" : "outline"} className={template === "discount" ? "bg-cyan-500 text-slate-950" : "border-slate-600 text-slate-100 hover:bg-slate-800"} onClick={() => setTemplate("discount")}>Discount Policy</Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-700 bg-slate-900/80">
          <CardHeader>
            <CardTitle className="text-base text-slate-100">2) Criterios (IF)</CardTitle>
            <CardDescription className="text-slate-300">Fact + operador + valor.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="grid gap-2">
              <Label className="text-slate-200">Fact key</Label>
              <Input placeholder="user.subscription_level" className="border-slate-700 bg-slate-950 text-slate-100" />
            </div>
            <div className="grid gap-2">
              <Label className="text-slate-200">Operator</Label>
              <Input placeholder="equal to" className="border-slate-700 bg-slate-950 text-slate-100" />
            </div>
            <div className="grid gap-2">
              <Label className="text-slate-200">Value</Label>
              <Input placeholder="GOLD" className="border-slate-700 bg-slate-950 text-slate-100" />
            </div>
            <p className="text-xs text-slate-400">Consejo: usa operadores numéricos para campos numéricos.</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-700 bg-slate-900/80">
          <CardHeader>
            <CardTitle className="text-base text-slate-100">3) Resultado (THEN)</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="grid gap-2">
              <Label className="text-slate-200">Decision</Label>
              <Input placeholder="APPROVE" className="border-slate-700 bg-slate-950 text-slate-100" />
            </div>
            <div className="grid gap-2">
              <Label className="text-slate-200">Tags</Label>
              <Input placeholder="LOW_RISK, AUTO_APPROVE" className="border-slate-700 bg-slate-950 text-slate-100" />
            </div>
            <div className="grid gap-2">
              <Label className="text-slate-200">Notes (optional)</Label>
              <Textarea
                placeholder="Describe la intención de negocio de la regla"
                className="border-slate-700 bg-slate-950 text-slate-100"
              />
            </div>
          </CardContent>
        </Card>

        <Alert className="border-cyan-600/30 bg-cyan-500/10 text-cyan-100">
          <Info className="h-4 w-4" />
          <AlertTitle>Preview</AlertTitle>
          <AlertDescription>{preview}</AlertDescription>
        </Alert>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" className="border-slate-600 text-slate-100 hover:bg-slate-800">Cancel</Button>
          <Button variant="secondary" className="border border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700" onClick={onInsert}>Insert rule</Button>
          <Button className="bg-cyan-500 text-slate-950 hover:bg-cyan-400" onClick={onInsertAndRun}>Insert &amp; Run</Button>
        </div>
      </div>
    </SheetContent>
  );
}

function RuleCard() {
  return (
    <Card className="rounded-2xl border border-slate-700 bg-slate-950/60">
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base text-slate-100">Low Risk Approve</CardTitle>
          <Badge variant="outline" className="border-cyan-500/40 bg-cyan-500/10 text-cyan-300">Priority 100</Badge>
        </div>
        <CardDescription className="text-slate-400">ID: loan.low-risk.approve</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-slate-300">
        <p>
          <strong>IF:</strong> creditScore &gt;= 680 AND dti &lt;= 0.35
        </p>
        <p>
          <strong>THEN:</strong> decision=APPROVE, tags=[LOW_RISK]
        </p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" className="border-slate-600 text-slate-100 hover:bg-slate-800">Edit</Button>
          <Button size="sm" variant="outline" className="border-slate-600 text-slate-100 hover:bg-slate-800">Duplicate</Button>
          <Button size="sm" variant="outline" className="border-slate-600 text-slate-100 hover:bg-slate-800">Delete</Button>
          <Button size="sm" variant="ghost" className="text-slate-200 hover:bg-slate-800">↑</Button>
          <Button size="sm" variant="ghost" className="text-slate-200 hover:bg-slate-800">↓</Button>
        </div>
      </CardContent>
    </Card>
  );
}
