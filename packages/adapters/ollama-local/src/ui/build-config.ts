import type { CreateConfigValues } from "@paperclipai/adapter-utils";
import { DEFAULT_OLLAMA_BASE_URL, DEFAULT_OLLAMA_MODEL } from "../index.js";

type OllamaConfigValues = CreateConfigValues & { baseUrl?: string; apiKey?: string };

export function buildOllamaLocalConfig(v: CreateConfigValues): Record<string, unknown> {
  const vv = v as OllamaConfigValues;
  const ac: Record<string, unknown> = {};
  ac.baseUrl = (typeof vv.baseUrl === "string" && vv.baseUrl.trim()) ? vv.baseUrl.trim() : DEFAULT_OLLAMA_BASE_URL;
  ac.apiKey = (typeof vv.apiKey === "string" && vv.apiKey.trim()) ? vv.apiKey.trim() : "ollama";
  ac.model = v.model || DEFAULT_OLLAMA_MODEL;
  if (v.cwd) ac.cwd = v.cwd;
  if (v.instructionsFilePath) ac.instructionsFilePath = v.instructionsFilePath;
  ac.timeoutSec = 0;
  ac.graceSec = 15;
  ac.dangerouslyBypassApprovalsAndSandbox =
    typeof v.dangerouslyBypassSandbox === "boolean" ? v.dangerouslyBypassSandbox : false;
  if (v.workspaceStrategyType === "git_worktree") {
    ac.workspaceStrategy = {
      type: "git_worktree",
      ...(v.workspaceBaseRef ? { baseRef: v.workspaceBaseRef } : {}),
      ...(v.workspaceBranchTemplate ? { branchTemplate: v.workspaceBranchTemplate } : {}),
      ...(v.worktreeParentDir ? { worktreeParentDir: v.worktreeParentDir } : {}),
    };
  }
  return ac;
}
