/* novaAI — thin client for the /api/recipe-ai endpoint (OpenAI-backed).

   Both calls degrade gracefully: on a 503 (no OPENAI_API_KEY on the deployed
   site) or any network error they resolve to a sentinel instead of throwing, so
   Ask Nova can fall back to its deterministic answer and the step critique can
   show an honest "switch the kitchen AI on" message. */

const ENDPOINT = '/api/recipe-ai';

async function post(body) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });
  let data = null;
  try { data = await res.json(); } catch { /* non-JSON */ }
  return { ok: res.ok, status: res.status, data };
}

/**
 * LLM-enhanced Ask Nova answer. Returns { answer, citations } or null when the
 * AI is unavailable (caller keeps the deterministic answer).
 */
export async function askNovaLLM({ question, context = [], tone = 'listener' }) {
  try {
    const { ok, data } = await post({ mode: 'ask', question, context, tone });
    if (!ok || !data || typeof data.answer !== 'string' || data.fallback) return null;
    return { answer: data.answer, citations: Array.isArray(data.citations) ? data.citations : [] };
  } catch { return null; }
}

/**
 * Vision critique of a step photo. Returns { match, texture, tip } on success,
 * or { unavailable: true, status } when the kitchen AI isn't switched on.
 */
export async function critiqueStepLLM({ image, step, recipe }) {
  try {
    const { ok, data, status } = await post({ mode: 'photo', image, step, recipe });
    if (!ok || !data || data.fallback) return { unavailable: true, status };
    return data;
  } catch { return { unavailable: true }; }
}

/**
 * LLM-picked trending delivery dishes for an area, for the Food Cost
 * Arbitrage feed. Returns a raw dishes[] array (caller normalizes into the
 * app's dish shape) or null when the AI is unavailable — the caller falls
 * back to the curated deterministic set either way.
 */
export async function fetchTrendingDishesLLM({ area, existingNames = [], count = 4 }) {
  try {
    const { ok, data } = await post({ mode: 'trending', area, existingNames, count });
    if (!ok || !data || !Array.isArray(data.dishes) || data.fallback) return null;
    return data.dishes;
  } catch { return null; }
}
