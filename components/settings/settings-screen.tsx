"use client";

import { useEffect, useState } from "react";
import {
  Cpu,
  HardDrive,
  Keyboard,
  KeyRound,
  MonitorCheck,
  Save,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PROVIDER_LABELS,
  loadAIConfig,
  PROVIDER_MODELS,
  saveAIConfig,
  type AIProvider,
} from "@/lib/ai/settings";

/**
 * Settings is local: nothing here talks to a server. AI provider keys live in
 * localStorage on this machine only (BYOK).
 */
export function SettingsScreen() {
  const [hasProviders, setHasProviders] = useState(false);
  const [provider, setProvider] = useState<AIProvider>("openai");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState(PROVIDER_MODELS.openai[0]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const config = loadAIConfig();
    if (config) {
      setProvider(config.provider);
      setApiKey(config.apiKey);
      setModel(config.model);
      setHasProviders(true);
    }
  }, []);

  const handleProviderChange = (value: string) => {
    const p = value as AIProvider;
    setProvider(p);
    setModel(PROVIDER_MODELS[p][0]);
  };

  const handleSave = () => {
    if (!apiKey.trim()) return;
    saveAIConfig({ provider, apiKey: apiKey.trim(), model });
    setHasProviders(true);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1500);
  };

  const handleClear = () => {
    // clear via settings module
    window.localStorage.removeItem("reosion:ai:config");
    setApiKey("");
    setHasProviders(false);
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
      <p className="mt-1 text-xs text-muted-foreground">
        Your configuration lives on this machine only.
      </p>

      <div className="mt-6 space-y-4">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <HardDrive className="size-4 text-muted-foreground" />
              Local data
            </CardTitle>
            <CardDescription>
              Projects, versions and settings are stored in your browser
              (IndexedDB). They never leave this device unless you export them.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-xs text-muted-foreground sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <Cpu className="size-3.5" aria-hidden />
              Rendering runs on this machine
            </div>
            <div className="flex items-center gap-2">
              <MonitorCheck className="size-3.5" aria-hidden />
              No account required
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <KeyRound className="size-4 text-muted-foreground" />
              AI providers
            </CardTitle>
            <CardDescription>
              Bring your own key for the AI workspace. Configure providers and
              paste keys in the AI panel of any project — keys stay in
              localStorage.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-xs">
              <Badge variant={hasProviders ? "default" : "secondary"}>
                {hasProviders ? "Configured" : "Not configured"}
              </Badge>
              {hasProviders ? (
                <span className="text-muted-foreground">Key stored locally</span>
              ) : (
                <span className="text-muted-foreground">
                  Optional — animations work fully without AI
                </span>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="ai-provider" className="text-xs">
                  Provider
                </Label>
                <Select value={provider} onValueChange={(v) => v && handleProviderChange(v)}>
                  <SelectTrigger id="ai-provider" className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(PROVIDER_LABELS) as AIProvider[]).map((p) => (
                      <SelectItem key={p} value={p} className="text-xs">
                        {PROVIDER_LABELS[p]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ai-model" className="text-xs">
                  Model
                </Label>
                <Select value={model} onValueChange={(v) => v && setModel(v)}>
                  <SelectTrigger id="ai-model" className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVIDER_MODELS[provider].map((m) => (
                      <SelectItem key={m} value={m} className="text-xs">
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ai-key" className="text-xs">
                API key
              </Label>
              <Input
                id="ai-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-…"
                className="h-8 font-mono text-xs"
              />
              <p className="text-[10px] text-muted-foreground">
                Stored in localStorage on this machine only. Never sent to our
                servers.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleSave} disabled={!apiKey.trim()}>
                <Save className="size-3.5" />
                {saved ? "Saved" : "Save"}
              </Button>
              {hasProviders ? (
                <Button size="sm" variant="outline" onClick={handleClear}>
                  Clear
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Keyboard className="size-4 text-muted-foreground" />
              Keyboard shortcuts
            </CardTitle>
            <CardDescription>
              Available in the editor workspace.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-9 w-40">Shortcut</TableHead>
                  <TableHead className="h-9">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  ["⌘/Ctrl + S", "Save project"],
                  ["⌘/Ctrl + K", "Command palette"],
                  ["Space", "Play / pause"],
                  ["← →", "Step one frame"],
                  ["J / K / L", "Back / pause / forward"],
                  ["Esc", "Close panels"],
                ].map(([keys, label]) => (
                  <TableRow key={keys}>
                    <TableCell className="py-2">
                      <kbd className="rounded-sm border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground">
                        {keys}
                      </kbd>
                    </TableCell>
                    <TableCell className="py-2 text-muted-foreground">
                      {label}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
