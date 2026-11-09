import { NextRequest } from "next/server";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatBody {
  provider: "openai" | "anthropic" | "gemini";
  apiKey: string;
  model: string;
  messages: ChatMessage[];
}

export async function POST(request: NextRequest) {
  let body: ChatBody;
  try {
    body = (await request.json()) as ChatBody;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }
  const { provider, apiKey, model, messages } = body;
  if (!apiKey || !model) {
    return new Response("Missing apiKey or model", { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (chunk: string) => controller.enqueue(encoder.encode(chunk));

      try {
        if (provider === "openai") {
          const res = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model,
              messages,
              stream: true,
            }),
          });
          if (!res.ok || !res.body) {
            send(`data: ${JSON.stringify({ error: await res.text() })}\n\n`);
            controller.close();
            return;
          }
          const reader = res.body.getReader();
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
              if (payload === "[DONE]") {
                send("data: [DONE]\n\n");
                continue;
              }
              try {
                const json = JSON.parse(payload) as {
                  choices?: Array<{ delta?: { content?: string } }>;
                };
                const content = json.choices?.[0]?.delta?.content;
                if (content) send(`data: ${JSON.stringify({ content })}\n\n`);
              } catch {
                /* ignore malformed */
              }
            }
          }
        } else if (provider === "anthropic") {
          const system = messages
            .filter((m) => m.role === "system")
            .map((m) => m.content)
            .join("\n");
          const anthropicMessages = messages
            .filter((m) => m.role !== "system")
            .map((m) => ({ role: m.role, content: m.content }));
          const res = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": apiKey,
              "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
              model,
              max_tokens: 2048,
              system: system || undefined,
              messages: anthropicMessages,
              stream: true,
            }),
          });
          if (!res.ok || !res.body) {
            send(`data: ${JSON.stringify({ error: await res.text() })}\n\n`);
            controller.close();
            return;
          }
          const reader = res.body.getReader();
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
              try {
                const json = JSON.parse(payload) as {
                  type?: string;
                  delta?: { text?: string };
                };
                if (json.type === "content_block_delta" && json.delta?.text) {
                  send(`data: ${JSON.stringify({ content: json.delta.text })}\n\n`);
                } else if (json.type === "message_stop") {
                  send("data: [DONE]\n\n");
                }
              } catch {
                /* ignore */
              }
            }
          }
        } else if (provider === "gemini") {
          const contents = messages
            .filter((m) => m.role !== "system")
            .map((m) => ({
              role: m.role === "assistant" ? "model" : "user",
              parts: [{ text: m.content }],
            }));
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
            model,
          )}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`;
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents }),
          });
          if (!res.ok || !res.body) {
            send(`data: ${JSON.stringify({ error: await res.text() })}\n\n`);
            controller.close();
            return;
          }
          const reader = res.body.getReader();
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
              try {
                const json = JSON.parse(payload) as {
                  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
                };
                const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) send(`data: ${JSON.stringify({ content: text })}\n\n`);
              } catch {
                /* ignore */
              }
            }
          }
          send("data: [DONE]\n\n");
        } else {
          send(`data: ${JSON.stringify({ error: "Unknown provider" })}\n\n`);
        }
      } catch (error) {
        send(
          `data: ${JSON.stringify({
            error: error instanceof Error ? error.message : String(error),
          })}\n\n`,
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
