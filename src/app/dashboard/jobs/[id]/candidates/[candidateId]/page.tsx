"use client";

import { Briefcase, Check, Copy, Download, GraduationCap, Mail, Phone, User } from "lucide-react";
import { use, useEffect, useState, type ReactNode } from "react";

import { AiSpinner } from "@/components/ui/ai-loader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  api,
  ApiError,
  type Candidate,
  type CandidateExperience,
  type CandidateProfile,
  type InterviewSession,
  type Job,
  type ResumeLink,
} from "@/lib/api";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatScheduledAt(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const ROUND_LABELS: Record<string, string> = {
  dsa: "DSA",
  vscode: "VS Code",
  technical_ai: "Technical (AI)",
};

/** Wraps the exact resume text a link was attached to (see core-api's
 * ExtractedLink) in an <a>, wherever that text shows up. Only ever called on
 * short, structured fields (a company/institution name, a section item like
 * "Realtime Meeting Intelligence - Github Repo"), never on free-form prose
 * (bullets, summary): a label like "Apple" is also just an ordinary word
 * that shows up incidentally in prose ("900K+ Apple Store URLs", "Apple's
 * DB team", ...), and linking every one of those would be wrong, only the
 * one place that text is actually the resume's own link should become one. */
function linkify(text: string, links: ResumeLink[]): ReactNode {
  if (!text || links.length === 0) return text;

  // Prefers the earliest match, and among matches starting at the same spot
  // (e.g. a "Github" profile link and a "Github Repo" project link both
  // start where "Github" does), the longest/most specific label, otherwise
  // whichever link happened to come first in the list could win over a
  // strictly-better match at the exact same position.
  let best: { link: ResumeLink; index: number } | null = null;
  for (const link of links) {
    if (!link.label) continue;
    const index = text.indexOf(link.label);
    if (index === -1) continue;
    if (!best || index < best.index || (index === best.index && link.label.length > best.link.label.length)) {
      best = { link, index };
    }
  }
  if (!best) return text;

  const before = text.slice(0, best.index);
  const match = text.slice(best.index, best.index + best.link.label.length);
  const after = text.slice(best.index + best.link.label.length);

  return (
    <>
      {before}
      <a
        href={best.link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-indigo-600 hover:underline dark:text-indigo-400"
      >
        {match}
      </a>
      {linkify(after, links)}
    </>
  );
}

/**
 * "role-at-company" fits Experience: role is genuinely a job title, company
 * genuinely the employer, so "{role} at {company}" reads correctly.
 * "stacked" fits Education: role/company just mean "whichever line the
 * resume had first" and "second" (an institution-first resume like
 * "University Name, Location  <date>" then "Degree" on the next line ends up
 * with role=institution, company=degree; a degree-first one like "Degree,
 * Institution  <date>" ends up the other way around), there's no reliable
 * way to know which is the degree and which is the institution, so instead
 * of guessing with a wrong "at", each just gets its own line, in the same
 * order the resume itself listed them.
 */
function EntryList({
  entries,
  links,
  emptyText,
  layout = "role-at-company",
}: {
  entries: CandidateExperience[];
  links: ResumeLink[];
  emptyText: string;
  layout?: "role-at-company" | "stacked";
}) {
  if (entries.length === 0) return <p className="text-sm text-zinc-400">{emptyText}</p>;

  return (
    <div className="space-y-5">
      {entries.map((entry, i) => (
        <div key={`${entry.company}-${i}`} className="border-l-2 border-indigo-100 pl-4 dark:border-indigo-900/50">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            {layout === "stacked" ? (
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{entry.role}</p>
                {entry.company && <p className="text-xs text-zinc-400">{linkify(entry.company, links)}</p>}
              </div>
            ) : (
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {entry.role} {entry.company && <span className="text-zinc-400">at {linkify(entry.company, links)}</span>}
              </p>
            )}
            {entry.years && <span className="text-xs text-zinc-400">{entry.years}</span>}
          </div>
          {entry.bullets.length > 0 && (
            <ul className="mt-1.5 list-inside list-disc space-y-1 pl-4 text-sm text-zinc-600 dark:text-zinc-300">
              {entry.bullets.map((bullet, j) => (
                <li key={j}>{bullet}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

const CandidateDetailPage = ({ params }: { params: Promise<{ id: string; candidateId: string }> }) => {
  const { id: jobId, candidateId } = use(params);

  const [job, setJob] = useState<Job | null>(null);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [interviews, setInterviews] = useState<InterviewSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [copiedLinkFor, setCopiedLinkFor] = useState<string | null>(null);

  const copyInterviewLink = (accessToken: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/interview/${accessToken}`);
    setCopiedLinkFor(accessToken);
    setTimeout(() => setCopiedLinkFor((current) => (current === accessToken ? null : current)), 2000);
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        return await api.getCandidateProfile(jobId, candidateId);
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) return null;
        throw err;
      }
    };

    Promise.all([api.getJob(jobId), api.getCandidate(jobId, candidateId), loadProfile(), api.listInterviews(jobId, candidateId)])
      .then(([jobData, candidateData, profileData, interviewData]) => {
        setJob(jobData);
        setCandidate(candidateData);
        setProfile(profileData);
        setInterviews(interviewData);
      })
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [jobId, candidateId]);

  const onDownload = () => {
    if (!candidate) return;
    api.downloadResume(jobId, candidate.id, candidate.resume_file_name).catch((err) => {
      setDownloadError(err instanceof ApiError ? err.message : "Download failed");
    });
  };

  if (loading) return <AiSpinner />;
  if (loadError) return <p className="text-sm text-red-500">{loadError}</p>;
  if (!job || !candidate) return null;

  const links = profile?.links ?? [];

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-zinc-100 bg-gradient-to-r from-indigo-50 via-white to-white px-6 py-5 dark:border-zinc-800 dark:from-indigo-950/20 dark:via-zinc-900 dark:to-zinc-900">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/50">
                <User size={22} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{candidate.full_name}</h1>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
                  <span className="inline-flex items-center gap-1">
                    <Briefcase size={12} />
                    {job.title}
                  </span>
                  {candidate.email && (
                    <span className="inline-flex items-center gap-1">
                      <Mail size={12} />
                      {candidate.email}
                    </span>
                  )}
                  {profile?.phone && (
                    <span className="inline-flex items-center gap-1">
                      <Phone size={12} />
                      {profile.phone}
                    </span>
                  )}
                  <span>Added {formatDate(candidate.created_at)}</span>
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onDownload}>
              <Download className="size-4" />
              Resume
            </Button>
          </div>
        </div>
        {downloadError && <p className="px-6 pt-3 text-sm text-red-600">{downloadError}</p>}
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Interviews</h3>
        {interviews.length === 0 ? (
          <p className="text-sm text-zinc-400">No interviews scheduled yet.</p>
        ) : (
          <div className="space-y-3">
            {interviews.map((session) => (
              <div key={session.id} className="rounded-lg border border-zinc-100 p-3 dark:border-zinc-800">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {formatScheduledAt(session.scheduled_at)}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant={session.status === "scheduled" ? "default" : "secondary"}>{session.status}</Badge>
                    <Button variant="ghost" size="sm" onClick={() => copyInterviewLink(session.access_token)}>
                      {copiedLinkFor === session.access_token ? (
                        <>
                          <Check className="size-3.5 text-emerald-500" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="size-3.5" /> Candidate link
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {session.rounds.map((round) => (
                    <Badge key={round.id} variant="outline">
                      {ROUND_LABELS[round.round_type] ?? round.round_type}: {round.status}
                    </Badge>
                  ))}
                </div>
                {session.rounds.flatMap((round) =>
                  Object.entries(round.submissions ?? {}).map(([questionId, submission]) => {
                    const questionNumber = round.question_ids.indexOf(questionId) + 1;
                    return (
                      <details key={questionId} className="mt-2 text-sm">
                        <summary className="cursor-pointer text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
                          {ROUND_LABELS[round.round_type] ?? round.round_type}, question {questionNumber} (
                          {submission.language}, {submission.test_results.passed}/{submission.test_results.total} tests
                          passed)
                        </summary>
                        <pre className="mt-2 max-h-80 overflow-auto rounded-md bg-zinc-50 p-3 text-xs text-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
                          {submission.code}
                        </pre>
                      </details>
                    );
                  }),
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {profile ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {profile.summary && (
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Summary</h3>
                <p className="text-sm whitespace-pre-line text-zinc-600 dark:text-zinc-300">{profile.summary}</p>
              </div>
            )}

            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Experience</h3>
              <EntryList entries={profile.experience} links={links} emptyText="No work experience was parsed from this resume." />
            </div>

            {profile.education.length > 0 && (
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  <GraduationCap size={15} className="text-indigo-500" />
                  Education
                </h3>
                <EntryList entries={profile.education} links={links} emptyText="" layout="stacked" />
              </div>
            )}

            {profile.sections.map((section) => {
              // Falls back gracefully instead of crashing the page: `sections`
              // is a Json column, so its internal shape isn't enforced by
              // Postgres/Prisma the way a real column is, a candidate parsed
              // by an older version of this parser (a different internal
              // shape for the same field) can still exist in the database.
              const entries = section.entries ?? [];
              if (entries.length === 0) return null;

              return (
                <div
                  key={section.heading}
                  className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{section.heading}</h3>
                  <ol className="list-inside list-decimal space-y-2 pl-4 text-sm text-zinc-600 dark:text-zinc-300">
                    {entries.map((entry, i) => (
                      <li key={i}>
                        {linkify(entry.title, links)}
                        {(entry.bullets ?? []).length > 0 && (
                          <ul className="mt-1 list-inside list-disc space-y-1 pl-6">
                            {entry.bullets.map((bullet, j) => (
                              <li key={j}>{bullet}</li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
              );
            })}
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Skills</h3>
              {profile.skills.length === 0 ? (
                <p className="text-sm text-zinc-400">No skills were parsed from this resume.</p>
              ) : (
                <div className="space-y-4">
                  {profile.skills.map((group) => (
                    <div key={group.category || "__ungrouped"}>
                      {group.category && (
                        <p className="mb-1.5 text-xs font-medium text-zinc-400 uppercase">{group.category}</p>
                      )}
                      <div className="flex flex-wrap gap-1.5">
                        {group.items.map((skill) => (
                          <Badge key={skill} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm text-zinc-400 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          No resume data could be extracted from this candidate&apos;s PDF.
        </div>
      )}
    </div>
  );
};

export default CandidateDetailPage;
