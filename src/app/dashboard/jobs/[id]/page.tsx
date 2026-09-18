"use client";

import { Briefcase, Download, FileText } from "lucide-react";
import { use, useEffect, useRef, useState } from "react";

import { AiSpinner } from "@/components/ui/ai-loader";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { RichTextContent } from "@/components/ui/rich-text-content";
import { api, ApiError, type AuthUser, type Candidate, type Job } from "@/lib/api";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const JobDetailPage = ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = use(params);

  const [me, setMe] = useState<AuthUser | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [descriptionOverflows, setDescriptionOverflows] = useState(false);
  const descriptionRef = useRef<HTMLDivElement>(null);

  const loadCandidates = () => api.listCandidates(id).then(setCandidates);

  useEffect(() => {
    Promise.all([api.me(), api.getJob(id), loadCandidates()])
      .then(([user, jobData]) => {
        setMe(user);
        setJob(jobData);
      })
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    const el = descriptionRef.current;
    if (!el) return;
    setDescriptionOverflows(el.scrollHeight > el.clientHeight + 1);
  }, [job?.description]);

  const onFilesSelected = async (files: File[]) => {
    setUploadError(null);
    setUploading(true);
    try {
      await api.uploadResumes(id, files);
      await loadCandidates();
    } catch (err) {
      setUploadError(err instanceof ApiError ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onDownload = (candidate: Candidate) => {
    api.downloadResume(id, candidate.id, candidate.resume_file_name).catch((err) => {
      setUploadError(err instanceof ApiError ? err.message : "Download failed");
    });
  };

  if (loading) return <AiSpinner />;
  if (loadError) return <p className="text-sm text-red-500">{loadError}</p>;
  if (!me || !job) return null;

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-zinc-100 bg-gradient-to-r from-indigo-50 via-white to-white px-6 py-5 dark:border-zinc-800 dark:from-indigo-950/20 dark:via-zinc-900 dark:to-zinc-900">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/50">
              <Briefcase size={22} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{job.title}</h1>
              <p className="mt-1 text-xs text-zinc-500">Created {formatDate(job.created_at)}</p>
            </div>
          </div>
        </div>
        <div className="px-6 py-5">
          <div className="relative">
            <RichTextContent
              ref={descriptionRef}
              html={job.description}
              className={descriptionExpanded ? undefined : "max-h-32 overflow-hidden"}
            />
            {!descriptionExpanded && descriptionOverflows && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white to-transparent dark:from-zinc-900" />
            )}
          </div>
          {descriptionOverflows && (
            <button
              type="button"
              onClick={() => setDescriptionExpanded((v) => !v)}
              className="mt-2 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
            >
              {descriptionExpanded ? "Show less" : "Read more"}
            </button>
          )}
        </div>
      </div>

      {me.role === "hiring_manager" && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Upload resumes</h3>
          {uploadError && <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{uploadError}</p>}
          <FileDropzone onFilesSelected={onFilesSelected} disabled={uploading} />
          {uploading && <p className="mt-2 text-sm text-zinc-500">Uploading…</p>}
        </div>
      )}

      <div className="max-w-full overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/60">
              <th className="px-5 py-3.5 text-left text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                Name
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                Resume
              </th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {candidates.length === 0 && (
              <tr>
                <td colSpan={3} className="px-5 py-10 text-center text-zinc-400">
                  No candidates yet.
                </td>
              </tr>
            )}
            {candidates.map((candidate) => (
              <tr key={candidate.id} className="group transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                <td className="px-5 py-4 font-medium text-zinc-900 dark:text-zinc-100">{candidate.full_name}</td>
                <td className="px-5 py-4 text-zinc-500">
                  <span className="inline-flex items-center gap-1.5 text-xs">
                    <FileText size={13} className="text-zinc-400" />
                    {candidate.resume_file_name}
                  </span>
                </td>
                <td className="px-5 py-4 text-right">
                  <Button variant="ghost" size="sm" onClick={() => onDownload(candidate)}>
                    <Download className="size-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default JobDetailPage;
