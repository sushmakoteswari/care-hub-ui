import { createServerFn } from "@tanstack/react-start";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

export type GroqChatInput = {
  prompt: string;
  maxTokens?: number;
};

function parseGroqInput(raw: unknown): GroqChatInput {
  if (!raw || typeof raw !== "object") throw new Error("Invalid request body");
  const o = raw as Record<string, unknown>;
  if (typeof o.prompt !== "string" || !o.prompt.trim()) throw new Error("Missing prompt");
  const maxTokens =
    typeof o.maxTokens === "number" && Number.isFinite(o.maxTokens)
      ? Math.min(Math.max(32, Math.floor(o.maxTokens)), 8192)
      : 512;
  return { prompt: o.prompt.trim(), maxTokens };
}

/**
 * Server-only Groq call. Key must come from `GROQ_API_KEY` (never `VITE_*`).
 * Local: `.env` / `.dev.vars`. Production: `wrangler secret put GROQ_API_KEY`.
 */
export const groqChatCompletion = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => parseGroqInput(raw))
  .handler(async ({ data }) => {
    const apiKey = process.env.GROQ_API_KEY?.trim();
    if (!apiKey) {
      throw new Error(
        "GROQ_API_KEY is not configured on the server. Add it to .env (not VITE_) or Wrangler secrets.",
      );
    }
    const model = process.env.GROQ_MODEL?.trim() || "llama-3.1-8b-instant";
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: data.maxTokens,
        temperature: 0.4,
        messages: [{ role: "user", content: data.prompt }],
      }),
    });
    if (!res.ok) {
      const err = await res.text().catch(() => res.statusText);
      throw new Error(`Groq API error: ${err.slice(0, 400)}`);
    }
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = json.choices?.[0]?.message?.content?.trim() ?? "";
    if (!text) throw new Error("Empty response from Groq.");
    return text;
  });

/** Safe client check: never exposes the key. */
export const groqIsConfigured = createServerFn({ method: "GET" }).handler(async () => {
  return { configured: Boolean(process.env.GROQ_API_KEY?.trim()) };
});
