import type { AdapterModel } from "@paperclipai/adapter-utils";
import { asString } from "@paperclipai/adapter-utils/server-utils";
import { DEFAULT_OLLAMA_BASE_URL, OLLAMA_BUILTIN_MODELS } from "../index.js";

export async function listOllamaModels(config: Record<string, unknown>): Promise<AdapterModel[]> {
  const baseUrl = asString(config.baseUrl, DEFAULT_OLLAMA_BASE_URL).trim().replace(/\/$/, "") || DEFAULT_OLLAMA_BASE_URL;
  try {
    const res = await fetch(`${baseUrl}/api/tags`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return OLLAMA_BUILTIN_MODELS;
    const body = (await res.json()) as { models?: Array<{ name: string }> };
    const discovered: AdapterModel[] = (body.models ?? []).map((m) => ({
      id: m.name,
      label: m.name,
    }));
    if (discovered.length === 0) return OLLAMA_BUILTIN_MODELS;
    // Merge: discovered first, then any builtin not already present
    const ids = new Set(discovered.map((m) => m.id));
    for (const builtin of OLLAMA_BUILTIN_MODELS) {
      if (!ids.has(builtin.id)) discovered.push(builtin);
    }
    return discovered;
  } catch {
    return OLLAMA_BUILTIN_MODELS;
  }
}
