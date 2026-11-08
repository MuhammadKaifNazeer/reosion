"use client";

import { useEffect, useState } from "react";
import {
  Cpu,
  HardDrive,
  Keyboard,
  KeyRound,
  MonitorCheck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

/**
 * Settings is local: nothing here talks to a server. AI provider keys live in
 * localStorage on this machine only (BYOK).
 */
export function SettingsScreen() {
  const [hasProviders, setHasProviders] = useState(false);

  useEffect(() => {
    // one-shot read of an external system (localStorage)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- no cascading render; value won't exist before mount
    setHasProviders(
      Boolean(
        window.localStorage.getItem("reosion:ai:provider") &&
          window.localStorage.getItem("reosion:ai:key"),
      ),
    );
  }, []);

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
          <CardContent>
            <div className="flex items-center gap-2 text-xs">
              <Badge variant={hasProviders ? "default" : "secondary"}>
                {hasProviders ? "Configured" : "Not configured"}
              </Badge>
              {hasProviders ? (
                <span className="text-muted-foreground">
                  Key stored locally
                </span>
              ) : (
                <span className="text-muted-foreground">
                  Optional — animations work fully without AI
                </span>
              )}
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
          <CardContent className="space-y-2 text-xs">
            {[
              ["⌘/Ctrl + S", "Save project"],
              ["⌘/Ctrl + K", "Command palette"],
              ["Space", "Play / pause"],
              ["← →", "Step one frame"],
              ["J / K / L", "Back / pause / forward"],
              ["Esc", "Close panels"],
            ].map(([keys, label]) => (
              <div key={keys} className="flex items-center gap-3">
                <span className="w-28 font-mono text-[11px] text-foreground">
                  {keys}
                </span>
                <Separator className="w-6" />
                <span className="text-muted-foreground">{label}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
