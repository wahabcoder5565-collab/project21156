const key = process.env.GEMINI_API_KEY;
const model = process.env.GEMINI_MODEL ?? "gemini-3.8-flash";

export const GEMINI_MODEL = model;
export const hasGeminiKey = Boolean(key);

const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

export type GeminiSchema = Record<string, unknown>;

type GeminiResult<T> = { ok: true; data: T } | { ok: false; error: string };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Google returns these for temporary capacity/rate problems, not bad requests. */
const TRANSIENT = new Set([408, 429, 500, 502, 503, 504]);

/**
 * Calls Gemini with a JSON-schema-constrained response and parses the result.
 * Stays server-side so the key is never exposed to the browser.
 *
 * Retries transient 503 "high demand" and 429 responses with backoff, since the
 * model rejects a large share of cold requests under load.
 */
export async function generateJson<T>({
  prompt,
  schema,
  temperature = 0.8,
  attempts = 4,
}: {
  prompt: string;
  schema: GeminiSchema;
  temperature?: number;
  attempts?: number;
}): Promise<GeminiResult<T>> {
  if (!key) {
    return { ok: false, error: "AI drafting is not configured. Add GEMINI_API_KEY to .env.local." };
  }

  const body = JSON.stringify({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature,
      maxOutputTokens: 2000,
      // Without this the model spends the whole budget on reasoning and
      // returns finishReason MAX_TOKENS with an empty body.
      thinkingConfig: { thinkingBudget: 0 },
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  });

  let lastStatus = 0;
  let lastDetail = "";

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body,
        cache: "no-store",
      });

      if (response.ok) {
        const payload = (await response.json()) as {
          candidates?: { content?: { parts?: { text?: string }[] } }[];
        };
        const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) return { ok: false, error: "The AI service returned an empty response." };

        try {
          return { ok: true, data: JSON.parse(text) as T };
        } catch {
          return { ok: false, error: "The AI service returned a malformed draft." };
        }
      }

      lastStatus = response.status;
      lastDetail = (await response.text()).slice(0, 300);
      console.error(`gemini attempt ${attempt}/${attempts} failed:`, lastStatus, lastDetail);

      if (!TRANSIENT.has(lastStatus) || attempt === attempts) break;
      await sleep(500 * 2 ** (attempt - 1) + Math.random() * 250);
    } catch (error) {
      lastStatus = 0;
      lastDetail = error instanceof Error ? error.message : String(error);
      console.error(`gemini attempt ${attempt}/${attempts} threw:`, lastDetail);
      if (attempt === attempts) break;
      await sleep(500 * 2 ** (attempt - 1) + Math.random() * 250);
    }
  }

  return {
    ok: false,
    error:
      lastStatus === 429
        ? "The AI service is rate limited. Try again in a moment."
        : "The AI service is unavailable right now. Try again shortly.",
  };
}
