import { OLLAMA_BASE_URL, OLLAMA_TIMEOUT_MS } from '../config/players';

export interface OllamaRequest {
  model: string;
  prompt: string;
  system?: string;
  stream?: boolean;
  options?: Record<string, unknown>;
}

interface OllamaGenerateResponse {
  model: string;
  response: string;
  done: boolean;
}

export async function callOllama(request: OllamaRequest): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);

  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: request.model,
        prompt: request.prompt,
        system: request.system ?? '',
        stream: false,
        options: {
          temperature: 0.75,
          top_p: 0.9,
          num_predict: 300,
          ...request.options,
        },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      throw new Error(`Ollama ${res.status}: ${text}`);
    }

    const data = (await res.json()) as OllamaGenerateResponse;
    return data.response ?? '';
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`Ollama timeout after ${OLLAMA_TIMEOUT_MS}ms for model ${request.model}`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export async function checkOllamaHealth(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`, { signal: controller.signal });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}
