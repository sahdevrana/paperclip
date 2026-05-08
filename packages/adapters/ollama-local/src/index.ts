import type { AdapterModel, AdapterModelProfileDefinition } from "@paperclipai/adapter-utils";

export const type = "ollama_local";
export const label = "Ollama (local)";

export const DEFAULT_OLLAMA_BASE_URL = "http://localhost:11434";
export const DEFAULT_OLLAMA_MODEL = "gemma4:27b";

export const OLLAMA_BUILTIN_MODELS: AdapterModel[] = [
  { id: "gemma4:31b-cloud", label: "Gemma 4 31B (Cloud)" },
  { id: "qwen3.5:cloud", label: "Qwen 3.5 (Cloud)" },
  { id: "gemma4:27b", label: "Gemma 4 27B" },
  { id: "qwen2.5-coder:32b", label: "Qwen 2.5 Coder 32B" },
  { id: "llama3.3:70b", label: "Llama 3.3 70B" },
  { id: "mistral:7b", label: "Mistral 7B" },
];

export const modelProfiles: AdapterModelProfileDefinition[] = [];

export const agentConfigurationDoc = `
# ollama_local agent configuration

Runs the Codex CLI against an Ollama-compatible endpoint.
Ollama exposes an OpenAI-compatible API at \`<baseUrl>/v1\`.

## Required fields

- **baseUrl** \`string\` — Ollama base URL. Default: \`http://localhost:11434\`.
  Example: \`http://your-ollama-host:11434\`

- **apiKey** \`string\` — Ollama API key. Use any non-empty string if your
  Ollama instance does not require authentication (e.g. \`"ollama"\`).
  Falls back to the \`OLLAMA_API_KEY\` environment variable.

- **model** \`string\` — Ollama model tag to use.
  Examples: \`gemma4:31b-cloud\`, \`qwen3.5:cloud\`, \`qwen2.5-coder:32b\`

## Optional fields

- **cwd** \`string\` — Working directory. Defaults to the agent home directory.

- **instructionsFilePath** \`string\` — Absolute path to a markdown file
  (e.g. \`AGENTS.md\`) injected into the system prompt.

- **timeoutSec** \`number\` — Execution timeout in seconds. \`0\` = no timeout.

- **dangerouslyBypassApprovalsAndSandbox** \`boolean\` — Skip sandbox
  and approval prompts (same as \`--dangerously-skip-permissions\` in Codex).

- **env** \`object\` — Additional environment variables injected at runtime.

## Notes

Ollama must be running and the selected model must be pulled before the agent
can execute (\`ollama pull <model>\`).

The adapter uses Codex CLI under the hood, pointing \`OPENAI_BASE_URL\` at the
Ollama endpoint so any OpenAI-tool-compatible model works transparently.
`.trim();
