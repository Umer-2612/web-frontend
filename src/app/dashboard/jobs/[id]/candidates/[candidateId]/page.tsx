"use client";

import { Briefcase, Download, Mail, Phone, User } from "lucide-react";
import { use, useEffect, useState } from "react";

import { AiSpinner } from "@/components/ui/ai-loader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api, ApiError, type Candidate, type CandidateProfile, type InterviewSession, type Job } from "@/lib/api";

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

const CandidateDetailPage = ({ params }: { params: Promise<{ id: string; candidateId: string }> }) => {
  const { id: jobId, candidateId } = use(params);

  const [job, setJob] = useState<Job | null>(null);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [interviews, setInterviews] = useState<InterviewSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

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
                  <Badge variant={session.status === "scheduled" ? "default" : "secondary"}>{session.status}</Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {session.rounds.map((round) => (
                    <Badge key={round.id} variant="outline">
                      {ROUND_LABELS[round.round_type] ?? round.round_type}: {round.status}
                    </Badge>
                  ))}
                </div>
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
              {profile.experience.length === 0 ? (
                <p className="text-sm text-zinc-400">No work experience was parsed from this resume.</p>
              ) : (
                <div className="space-y-5">
                  {profile.experience.map((entry, i) => (
                    <div key={`${entry.company}-${i}`} className="border-l-2 border-indigo-100 pl-4 dark:border-indigo-900/50">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {entry.role} {entry.company && <span className="text-zinc-400">at {entry.company}</span>}
                        </p>
                        {entry.years && <span className="text-xs text-zinc-400">{entry.years}</span>}
                      </div>
                      {entry.bullets.length > 0 && (
                        <ul className="mt-1.5 list-disc space-y-1 pl-4 text-sm text-zinc-600 dark:text-zinc-300">
                          {entry.bullets.map((bullet, j) => (
                            <li key={j}>{bullet}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {profile.sections.map((section) => (
              <div
                key={section.heading}
                className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{section.heading}</h3>
                <ul className="space-y-1.5 text-sm text-zinc-600 dark:text-zinc-300">
                  {section.items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
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
