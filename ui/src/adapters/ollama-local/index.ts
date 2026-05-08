import type { UIAdapterModule } from "../types";
import { parseCodexStdoutLine } from "@paperclipai/adapter-codex-local/ui";
import { buildOllamaLocalConfig } from "@paperclipai/adapter-ollama-local/ui";
import { OllamaLocalConfigFields } from "./config-fields";

export const ollamaLocalUIAdapter: UIAdapterModule = {
  type: "ollama_local",
  label: "Ollama (local)",
  parseStdoutLine: parseCodexStdoutLine,
  ConfigFields: OllamaLocalConfigFields,
  buildAdapterConfig: buildOllamaLocalConfig,
};
