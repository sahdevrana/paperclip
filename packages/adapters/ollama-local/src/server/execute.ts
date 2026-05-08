import type { AdapterExecutionContext, AdapterExecutionResult } from "@paperclipai/adapter-utils";
import { asString, parseObject } from "@paperclipai/adapter-utils/server-utils";
import { execute as openCodeExecute } from "@paperclipai/adapter-opencode-local/server";
import { DEFAULT_OLLAMA_BASE_URL, DEFAULT_OLLAMA_MODEL } from "../index.js";

export async function execute(ctx: AdapterExecutionContext): Promise<AdapterExecutionResult> {
  const config = ctx.config;

  const rawBaseUrl = asString(config.baseUrl, DEFAULT_OLLAMA_BASE_URL).trim().replace(/\/$/, "");
  const baseUrl = rawBaseUrl || DEFAULT_OLLAMA_BASE_URL;
  const configApiKey = asString(config.apiKey, "").trim();
  const apiKey = configApiKey || process.env.OLLAMA_API_KEY?.trim() || "ollama";

  // OpenCode requires provider/model format. Ensure the model is prefixed with "openai/"
  // so OpenCode routes it through its OpenAI-compatible provider using OPENAI_BASE_URL.
  const rawModel = asString(config.model, DEFAULT_OLLAMA_MODEL).trim() || DEFAULT_OLLAMA_MODEL;
  const model = rawModel.startsWith("openai/") ? rawModel : `openai/${rawModel}`;

  const existingEnv = parseObject(config.env) as Record<string, unknown>;
  const ollamaEnv: Record<string, unknown> = {
    ...existingEnv,
    OPENAI_BASE_URL: `${baseUrl}/v1`,
    OPENAI_API_KEY: apiKey,
  };

  const ollamaConfig: Record<string, unknown> = {
    ...config,
    model,
    env: ollamaEnv,
  };

  return openCodeExecute({ ...ctx, config: ollamaConfig });
}
