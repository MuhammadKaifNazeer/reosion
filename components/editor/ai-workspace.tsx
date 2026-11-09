"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  Lock,
  Loader2,
  Sparkles,
  Square,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  type AIConfig,
  hasAIConfig,
  loadAIConfig,
  PROVIDER_LABELS,
} from "@/lib/ai/settings";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function AIWorkspace() {
  const [config, setConfig] = useState<AIConfig | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // read external system (localStorage) once on mount
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setConfig(loadAIConfig());
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const enabled = config !== null;

  const send = useCallback(async () => {
    if (!config || !input.trim() || streaming) return;
    const userMessage: ChatMessage = { role: "user", content: input.trim() };
    const next = [...messages, userMessage];
    setMessages(next);
    setInput("");
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    // placeholder assistant message
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: config.provider,
          apiKey: config.apiKey,
          model: config.model,
          messages: [
            {
              role: "system",
              content:
                "You are an animation assistant for Reosion, a code-first motion graphics tool. User code is a single React component (Animation.tsx) using framer-motion and @reosion/runtime (useTime, useStage, clamp, lerp). Reply concisely and prefer code edits as fenced blocks.",
            },
            ...next.map((m) => ({ role: m.role, content: m.content })),
          ],
        }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        const text = await response.text();
        setMessages((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (last?.role === "assistant") last.content = `Error: ${text}`;
          return copy;
        });
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const payload = trimmed.slice(5).trim();
          if (payload === "[DONE]") continue;
          try {
            const json = JSON.parse(payload) as { content?: string; error?: string };
            if (json.error) {
              setMessages((prev) => {
                const copy = [...prev];
                const last = copy[copy.length - 1];
                if (last?.role === "assistant") last.content = `Error: ${json.error}`;
                return copy;
              });
              continue;
            }
            if (json.content) {
              setMessages((prev) => {
                const copy = [...prev];
                const last = copy[copy.length - 1];
                if (last?.role === "assistant") last.content += json.content;
                return copy;
              });
            }
          } catch {
            /* ignore malformed */
          }
        }
      }
    } catch (error) {
      if ((error as Error)?.name !== "AbortError") {
        setMessages((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (last?.role === "assistant")
            last.content = `Error: ${error instanceof Error ? error.message : String(error)}`;
          return copy;
        });
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }, [config, input, messages, streaming]);

  const stop = () => abortRef.current?.abort();

  if (!enabled) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <Sparkles className="size-7 text-muted-foreground/40" aria-hidden />
          <div>
            <p className="text-sm font-medium text-foreground">
              AI Animation Assistant
            </p>
            <p className="mt-1 max-w-xs text-xs leading-5 text-muted-foreground">
              Create, modify, explain, and debug your animation code with AI.
              Configure a provider to get started.
            </p>
          </div>
          <Button size="sm" render={<Link href="/settings" />}>
            Configure AI
          </Button>
        </div>

        <div className="shrink-0 border-t border-border p-3">
          <div className="relative">
            <Textarea
              disabled
              placeholder="Ask anything…"
              className="min-h-[44px] resize-none pr-10 text-xs"
              rows={1}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Lock className="size-3.5" aria-hidden />
            </div>
          </div>
          <p className="mt-1.5 text-[10px] text-muted-foreground">
            Add an API key in Settings to enable the assistant.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <Sparkles className="size-6 text-muted-foreground/40" aria-hidden />
            <p className="text-xs text-muted-foreground">
              {PROVIDER_LABELS[config.provider]} · {config.model}
            </p>
            <p className="max-w-[16rem] text-[11px] leading-5 text-muted-foreground/80">
              Ask for a new animation, a refactor, or a fix. Edits are proposed
              as diffs you can accept or reject.
            </p>
          </div>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                "rounded-md border px-2.5 py-2 text-xs leading-5",
                m.role === "user"
                  ? "ml-6 border-border bg-muted/40 text-foreground"
                  : "mr-2 border-border bg-card text-foreground",
              )}
            >
              <span className="mb-1 block font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                {m.role === "user" ? "You" : "Assistant"}
              </span>
              <pre className="whitespace-pre-wrap font-sans">
                {m.content || (streaming && i === messages.length - 1 ? "…" : "")}
              </pre>
            </div>
          ))
        )}
      </div>

      <div className="shrink-0 border-t border-border p-3">
        <div className="relative">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder="Ask anything… (⌘/Ctrl+Enter to send)"
            className="min-h-[44px] resize-none pr-10 text-xs"
            rows={2}
            disabled={streaming}
          />
          <Button
            size="icon-sm"
            className="absolute right-2 bottom-2"
            aria-label={streaming ? "Stop" : "Send"}
            disabled={!input.trim() && !streaming}
            onClick={() => (streaming ? stop() : void send())}
          >
            {streaming ? <Square /> : <ArrowUp />}
          </Button>
        </div>
        <p className="mt-1.5 text-[10px] text-muted-foreground">
          {PROVIDER_LABELS[config.provider]} · {config.model} · keys stay local
        </p>
      </div>
    </div>
  );
}
