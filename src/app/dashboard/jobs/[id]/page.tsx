"use client";

import { Download } from "lucide-react";
import { use, useEffect, useRef, useState } from "react";

import { AiSpinner } from "@/components/ui/ai-loader";
import { Button } from "@/components/ui/button";
import { api, ApiError, type AuthUser, type Candidate, type Job } from "@/lib/api";

const JobDetailPage = ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = use(params);

  const [me, setMe] = useState<AuthUser | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const onFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploadError(null);
    setUploading(true);
    try {
      await api.uploadResumes(id, files);
      await loadCandidates();
    } catch (err) {
      setUploadError(err instanceof ApiError ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
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
      <div className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{job.title}</h2>
        <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-500 dark:text-zinc-400">{job.description}</p>
      </div>

      {me.role === "hiring_manager" && (
        <div className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900">
          <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Upload resumes</h3>
          {uploadError && <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{uploadError}</p>}
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            multiple
            disabled={uploading}
            onChange={onFilesSelected}
            className="text-sm text-zinc-600 dark:text-zinc-300"
          />
          {uploading && <p className="mt-2 text-sm text-zinc-500">Uploading…</p>}
        </div>
      )}

      <div className="max-w-full overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
        <table className="w-full min-w-[480px] text-sm">
          <thead className="bg-zinc-50 text-left text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:bg-zinc-800 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Resume</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {candidates.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-zinc-400">
                  No candidates yet.
                </td>
              </tr>
            )}
            {candidates.map((candidate) => (
              <tr key={candidate.id} className="bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800">
                <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{candidate.full_name}</td>
                <td className="px-4 py-3 text-zinc-500">{candidate.resume_file_name}</td>
                <td className="px-4 py-3 text-right">
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
