/**
 * Client for the token-gated candidate portal. Deliberately separate from
 * lib/api.ts: no cookies, no Bearer token, no credentials: "include", since
 * the access_token in the URL is the only thing that gates these requests,
 * and a candidate is never a logged-in user.
 */
import { API_URL } from "@/lib/api";

export const JUDGE_URL = process.env.NEXT_PUBLIC_JUDGE_URL ?? "http://localhost:4001";

export type InterviewRoundType = "dsa" | "vscode" | "technical_ai";
export type InterviewRoundStatus = "pending" | "completed";
export type InterviewSessionStatus = "scheduled" | "completed" | "cancelled";

export interface PortalRound {
  id: string;
  round_type: InterviewRoundType;
  sequence: number;
  status: InterviewRoundStatus;
}

export interface PortalOverview {
  candidate_name: string;
  job_title: string;
  status: InterviewSessionStatus;
  rounds: PortalRound[];
}

export interface TestResults {
  passed: number;
  total: number;
}

export interface DsaSubmission {
  question_id: string;
  code: string;
  language: string;
  test_results: TestResults;
  submitted_at: string;
}

export interface OpenTestCase {
  input: string;
  expected_output: string;
}

export interface DsaQuestion {
  id: string;
  title: string;
  prompt: string;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
  starter_code: Record<string, string>;
  open_test_cases: OpenTestCase[];
  total_test_cases: number;
  submission: DsaSubmission | null;
}

export interface DsaRoundView {
  round_id: string;
  status: InterviewRoundStatus;
  started_at: string | null;
  duration_minutes: number;
  questions: DsaQuestion[];
}

export interface GradedTestCase {
  locked: boolean;
  passed: boolean;
  input?: string;
  expected_output?: string;
  actual_output?: string;
}

export interface GradeResult {
  passed: number;
  total: number;
  results: GradedTestCase[];
}

/** One line of the NDJSON stream run-tests sends back, one per test case as it
 * finishes grading, plus a final "done" line once every case has run. */
export type RunTestsEvent =
  | { type: "result"; index: number; result: GradedTestCase }
  | { type: "done"; passed: number; total: number }
  | { type: "error"; message: string };

export class PortalApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "PortalApiError";
  }
}

async function portalRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { error?: { message?: string } };
      message = body.error?.message ?? message;
    } catch {
      /* no JSON body */
    }
    throw new PortalApiError(res.status, message);
  }

  const body = (await res.json()) as { data: T };
  return body.data;
}

/** Reads an NDJSON response body one line at a time, calling `onEvent` for each
 * complete line as soon as it arrives, not after the whole response is done, so a
 * caller can update the UI incrementally instead of waiting for the stream to end.
 * A request that never starts streaming (validation failed before any result was
 * ready) still comes back as the usual `{ error: {...} }` JSON, surfaced the same
 * way portalRequest does. */
async function streamPortalRequest(path: string, body: unknown, onEvent: (event: RunTestsEvent) => void): Promise<void> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok || !res.body) {
    let message = `Request failed (${res.status})`;
    try {
      const errorBody = (await res.json()) as { error?: { message?: string } };
      message = errorBody.error?.message ?? message;
    } catch {
      /* no JSON body */
    }
    throw new PortalApiError(res.status, message);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (line.trim()) onEvent(JSON.parse(line) as RunTestsEvent);
    }
  }
  if (buffer.trim()) onEvent(JSON.parse(buffer) as RunTestsEvent);
}

export interface ExecuteResult {
  success: boolean;
  stdout?: string;
  stderr?: string;
  compileOutput?: string;
  message?: string;
  status?: { id: number; description: string } | null;
  time?: string | null;
  memory?: number | null;
  error?: string;
}

export const portalApi = {
  getPortal: (token: string) => portalRequest<PortalOverview>(`/portal/${token}`),
  getDsaRound: (token: string) => portalRequest<DsaRoundView>(`/portal/${token}/dsa`),
  startDsaRound: (token: string) =>
    portalRequest<{ started_at: string }>(`/portal/${token}/dsa/start`, { method: "POST" }),
  runDsaTests: (
    token: string,
    questionId: string,
    code: string,
    language: string,
    onEvent: (event: RunTestsEvent) => void,
  ) => streamPortalRequest(`/portal/${token}/dsa/questions/${questionId}/run-tests`, { code, language }, onEvent),
  submitDsaQuestion: (token: string, questionId: string, code: string, language: string) =>
    portalRequest<DsaSubmission>(`/portal/${token}/dsa/questions/${questionId}/submit`, {
      method: "POST",
      body: JSON.stringify({ code, language }),
    }),
  /** Ad hoc "Run" with arbitrary stdin, calls judge-service directly, never saved
   * and never graded against a question's test cases (that's runDsaTests). */
  execute: async (languageId: number, code: string, stdin: string): Promise<ExecuteResult> => {
    const res = await fetch(`${JUDGE_URL}/execute`, {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language_id: languageId, code, stdin }),
    });
    return (await res.json()) as ExecuteResult;
  },
};
