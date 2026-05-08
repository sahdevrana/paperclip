import { ISSUE_STATUSES, type IssueStatus } from "./constants.js";

/**
 * Resolves the default status for a newly created issue.
 * - If input provides an explicit valid status, that is used.
 * - If an assignee agent is specified, defaults to "in_progress".
 * - Otherwise defaults to "backlog".
 */
export function resolveCreateIssueStatusDefault(input?: {
  status?: IssueStatus | string | null;
  assigneeAgentId?: string | null;
}): IssueStatus {
  if (input?.status && (ISSUE_STATUSES as readonly string[]).includes(input.status)) {
    return input.status as IssueStatus;
  }
  if (input?.assigneeAgentId) {
    return "in_progress";
  }
  return "backlog";
}
