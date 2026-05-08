/** Possible outcomes when triggering an immediate retry for an issue. */
export type IssueRetryNowOutcome =
  | "promoted"
  | "already_promoted"
  | "no_scheduled_retry"
  | "gate_suppressed";

/** API response for a retry-now request on an issue. */
export interface IssueRetryNowResponse {
  outcome: IssueRetryNowOutcome;
  message: string;
}
