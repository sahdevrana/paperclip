import type { AdapterConfigFieldsProps } from "../types";
import type { CreateConfigValues } from "@paperclipai/adapter-utils";
import { Field, ToggleField, help } from "../../components/agent-config-primitives";
import { LocalWorkspaceRuntimeFields } from "../local-workspace-runtime-fields";

type OllamaValues = CreateConfigValues & { baseUrl?: string; apiKey?: string };

const inputClass =
  "w-full rounded-md border border-border px-2.5 py-1.5 bg-transparent outline-none text-sm font-mono placeholder:text-muted-foreground/40";

export function OllamaLocalConfigFields({
  mode,
  isCreate,
  adapterType,
  values,
  set,
  config,
  eff,
  mark,
  models,
  hideInstructionsFile,
}: AdapterConfigFieldsProps) {
  const ollamaValues = values as OllamaValues | null;
  const ollamaSet = set as ((patch: Partial<OllamaValues>) => void) | null;
  return (
    <>
      <Field
        label="Ollama base URL"
        hint="Base URL of your Ollama instance. Default: http://ollama:11434 (Docker service name)"
      >
        <input
          type="text"
          className={inputClass}
          placeholder="http://ollama:11434"
          value={
            isCreate
              ? (ollamaValues!.baseUrl ?? "")
              : eff("adapterConfig", "baseUrl", String(config.baseUrl ?? ""))
          }
          onChange={(e) =>
            isCreate
              ? ollamaSet!({ baseUrl: e.target.value })
              : mark("adapterConfig", "baseUrl", e.target.value || undefined)
          }
        />
      </Field>

      <Field
        label="Ollama API key"
        hint={'API key for your Ollama instance. Use any non-empty value (e.g. "ollama") if no auth is required.'}
      >
        <input
          type="password"
          className={inputClass}
          placeholder="ollama"
          value={
            isCreate
              ? (ollamaValues!.apiKey ?? "")
              : eff("adapterConfig", "apiKey", String(config.apiKey ?? ""))
          }
          onChange={(e) =>
            isCreate
              ? ollamaSet!({ apiKey: e.target.value })
              : mark("adapterConfig", "apiKey", e.target.value || undefined)
          }
        />
      </Field>

      {!hideInstructionsFile && (
        <Field
          label="Agent instructions file"
          hint="Absolute path to a markdown file (e.g. AGENTS.md) injected into the system prompt."
        >
          <input
            type="text"
            className={inputClass}
            placeholder="/absolute/path/to/AGENTS.md"
            value={
              isCreate
                ? (values!.instructionsFilePath ?? "")
                : eff("adapterConfig", "instructionsFilePath", String(config.instructionsFilePath ?? ""))
            }
            onChange={(e) =>
              isCreate
                ? set!({ instructionsFilePath: e.target.value })
                : mark("adapterConfig", "instructionsFilePath", e.target.value || undefined)
            }
          />
        </Field>
      )}

      <ToggleField
        label="Bypass sandbox"
        hint={help.dangerouslyBypassSandbox}
        checked={
          isCreate
            ? Boolean(values!.dangerouslyBypassSandbox)
            : eff("adapterConfig", "dangerouslyBypassApprovalsAndSandbox", Boolean(config.dangerouslyBypassApprovalsAndSandbox))
        }
        onChange={(v) =>
          isCreate
            ? set!({ dangerouslyBypassSandbox: v })
            : mark("adapterConfig", "dangerouslyBypassApprovalsAndSandbox", v)
        }
      />

      {mode !== "create" && (
        <LocalWorkspaceRuntimeFields
          isCreate={isCreate}
          values={values}
          set={set}
          config={config}
          mark={mark}
          eff={eff}
          mode={mode}
          adapterType={adapterType}
          models={models}
        />
      )}
    </>
  );
}
