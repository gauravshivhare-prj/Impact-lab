/**
 * Server-side Cerebras client (OpenAI-compatible chat completions).
 * The API key is only ever sent in the Authorization header to Cerebras; it is never
 * logged, returned to clients, or exposed to the React app.
 */

export const CEREBRAS_CHAT_URL = 'https://api.cerebras.ai/v1/chat/completions';

// Includes reasoning tokens for reasoning models, so leave headroom beyond the ~180-word brief.
const MAX_COMPLETION_TOKENS = 4000;

export class AiProviderError extends Error {
  /** @param {'timeout'|'network'|'rate_limited'|'provider_error'|'empty_response'} reason */
  constructor(reason) {
    super(`AI provider error: ${reason}`);
    this.name = 'AiProviderError';
    this.reason = reason;
  }
}

export function createCerebrasClient({ apiKey, model, timeoutMs, fetchImpl = globalThis.fetch }) {
  const enabled = Boolean(apiKey && model);

  async function generate({ system, user }) {
    if (!enabled) throw new AiProviderError('provider_error');

    let response;
    try {
      response = await fetchImpl(CEREBRAS_CHAT_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
          max_completion_tokens: MAX_COMPLETION_TOKENS,
          temperature: 0.2,
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (err) {
      const isTimeout = err?.name === 'TimeoutError' || err?.name === 'AbortError';
      throw new AiProviderError(isTimeout ? 'timeout' : 'network');
    }

    if (response.status === 429) throw new AiProviderError('rate_limited');
    if (!response.ok) throw new AiProviderError('provider_error');

    let body;
    try {
      body = await response.json();
    } catch {
      throw new AiProviderError('provider_error');
    }

    const content = body?.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || content.trim() === '') {
      throw new AiProviderError('empty_response');
    }
    return content;
  }

  return Object.freeze({ enabled, generate });
}
