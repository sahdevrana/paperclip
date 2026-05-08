import type { AdapterExecutionContext, AdapterExecutionResult } from "@paperclipai/adapter-utils";
import { asString, parseObject } from "@paperclipai/adapter-utils/server-utils";
import { execute as codexExecute } from "@paperclipai/adapter-codex-local/server";
import { DEFAULT_OLLAMA_BASE_URL, DEFAULT_OLLAMA_MODEL } from "../index.js";

export async function execute(ctx: AdapterExecutionContext): Promise<AdapterExecutionResult> {
  const config = ctx.config;

  const rawBaseUrl = asString(config.baseUrl, DEFAULT_OLLAMA_BASE_URL).trim().replace(/\/$/, "");
  const baseUrl = rawBaseUrl || DEFAULT_OLLAMA_BASE_URL;
  const configApiKey = asString(config.apiKey, "").trim();
  const apiKey = configApiKey || process.env.OLLAMA_API_KEY?.trim() || "ollama";
  const model = asString(config.model, DEFAULT_OLLAMA_MODEL).trim() || DEFAULT_OLLAMA_MODEL;

  // Merge Ollama connection vars into the env config so codex execute
  // passes them through to the process via refreshPaperclipWorkspaceEnvForExecution.
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

  return codexExecute({ ...ctx, config: ollamaConfig });
}
