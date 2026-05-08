import type {
  AdapterEnvironmentCheck,
  AdapterEnvironmentTestContext,
  AdapterEnvironmentTestResult,
} from "@paperclipai/adapter-utils";
import { asString } from "@paperclipai/adapter-utils/server-utils";
import { DEFAULT_OLLAMA_BASE_URL, DEFAULT_OLLAMA_MODEL, OLLAMA_BUILTIN_MODELS } from "../index.js";

function summarizeStatus(checks: AdapterEnvironmentCheck[]): AdapterEnvironmentTestResult["status"] {
  if (checks.some((c) => c.level === "error")) return "fail";
  if (checks.some((c) => c.level === "warn")) return "warn";
  return "pass";
}

export async function testEnvironment(
  ctx: AdapterEnvironmentTestContext,
): Promise<AdapterEnvironmentTestResult> {
  const { config } = ctx;
  const checks: AdapterEnvironmentCheck[] = [];
  const testedAt = new Date().toISOString();

  const rawBaseUrl = asString(config.baseUrl, DEFAULT_OLLAMA_BASE_URL).trim().replace(/\/$/, "");
  const baseUrl = rawBaseUrl || DEFAULT_OLLAMA_BASE_URL;
  const configApiKey = asString(config.apiKey, "").trim();
  const apiKey = configApiKey || process.env.OLLAMA_API_KEY?.trim() || "";
  const model = asString(config.model, DEFAULT_OLLAMA_MODEL).trim() || DEFAULT_OLLAMA_MODEL;

  if (!apiKey) {
    checks.push({
      code: "ollama_api_key_missing",
      level: "warn",
      message: "No API key configured",
      hint: 'Set the API key field or the OLLAMA_API_KEY environment variable. Use any non-empty value (e.g. "ollama") if your instance does not require authentication.',
    });
  }

  // Check Ollama is reachable via /api/version
  let reachable = false;
  try {
    const versionRes = await fetch(`${baseUrl}/api/version`, {
      signal: AbortSignal.timeout(8000),
    });
    if (versionRes.ok) {
      const body = (await versionRes.json()) as { version?: string };
      reachable = true;
      checks.push({
        code: "ollama_reachable",
        level: "info",
        message: `Ollama is reachable at ${baseUrl}`,
        detail: body.version ? `version ${body.version}` : null,
      });
    } else {
      checks.push({
        code: "ollama_unreachable",
        level: "error",
        message: `Ollama returned HTTP ${versionRes.status} at ${baseUrl}/api/version`,
        hint: "Ensure Ollama is running and the base URL is correct.",
      });
    }
  } catch (err) {
    checks.push({
      code: "ollama_unreachable",
      level: "error",
      message: `Cannot reach Ollama at ${baseUrl}`,
      detail: err instanceof Error ? err.message : String(err),
      hint: "Ensure Ollama is running and accessible from this host. Check the base URL.",
    });
  }

  // Check model is available
  if (reachable) {
    try {
      const tagsRes = await fetch(`${baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(8000),
      });
      if (tagsRes.ok) {
        const body = (await tagsRes.json()) as { models?: Array<{ name: string }> };
        const available = (body.models ?? []).map((m) => m.name);
        const isKnownBuiltin = OLLAMA_BUILTIN_MODELS.some((m) => m.id === model);
        const isPulled = available.some((name) => name === model || name.startsWith(`${model}:`));
        if (isPulled) {
          checks.push({
            code: "ollama_model_available",
            level: "info",
            message: `Model "${model}" is available`,
          });
        } else if (isKnownBuiltin || available.length > 0) {
          checks.push({
            code: "ollama_model_not_pulled",
            level: "warn",
            message: `Model "${model}" is not pulled on this Ollama instance`,
            detail: available.length > 0 ? `Available models: ${available.slice(0, 6).join(", ")}` : null,
            hint: `Run: ollama pull ${model}`,
          });
        }
      }
    } catch {
      // non-fatal — model list is optional
    }

    // Probe the OpenAI-compatible endpoint with a minimal chat request
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
      const probeRes = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: "Respond with the single word: hello" }],
          max_tokens: 8,
          stream: false,
        }),
        signal: AbortSignal.timeout(30000),
      });
      if (probeRes.ok) {
        checks.push({
          code: "ollama_probe_ok",
          level: "info",
          message: `Model "${model}" responded to a test prompt`,
        });
      } else {
        const body = await probeRes.text().catch(() => "");
        checks.push({
          code: "ollama_probe_failed",
          level: "warn",
          message: `Model probe returned HTTP ${probeRes.status}`,
          detail: body.slice(0, 200) || null,
          hint: `Ensure "${model}" is pulled and the API key (if required) is correct.`,
        });
      }
    } catch (err) {
      checks.push({
        code: "ollama_probe_error",
        level: "warn",
        message: "Model probe request failed",
        detail: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return { adapterType: "ollama_local", status: summarizeStatus(checks), checks, testedAt };
}
