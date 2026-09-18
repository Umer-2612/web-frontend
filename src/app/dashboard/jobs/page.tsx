"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { AiSpinner } from "@/components/ui/ai-loader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isRichTextEmpty, RichTextEditor } from "@/components/ui/rich-text-editor";
import { api, ApiError, type AuthUser, type Job } from "@/lib/api";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const JobsPage = () => {
  const [me, setMe] = useState<AuthUser | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadJobs = () =>
    api
      .listJobs()
      .then(setJobs)
      .catch((err) => setListError(err instanceof ApiError ? err.message : "Failed to load"));

  useEffect(() => {
    api
      .me()
      .then((user) => {
        setMe(user);
        return loadJobs();
      })
      .finally(() => setLoading(false));
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim() || isRichTextEmpty(description)) {
      setError("Title and description are both required");
      return;
    }
    setSubmitting(true);
    try {
      await api.createJob({ title, description });
      setTitle("");
      setDescription("");
      setOpen(false);
      await loadJobs();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <AiSpinner />;
  if (!me) return null;

  return (
    <div className="space-y-6">
      {me.role === "hiring_manager" && (
        <div className="flex justify-end">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>Add job</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>Add job</DialogTitle>
              </DialogHeader>
              <form onSubmit={onSubmit} className="space-y-4">
                {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

                <div className="space-y-1">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Description</Label>
                  <RichTextEditor value={description} onChange={setDescription} placeholder="Describe the role..." />
                </div>

                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? "Creating…" : "Create job"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {listError && <p className="text-sm text-red-500">{listError}</p>}
      <div className="max-w-full overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/60">
              <th className="px-5 py-3.5 text-left text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                Title
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                Created
              </th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {jobs.length === 0 && (
              <tr>
                <td colSpan={3} className="px-5 py-10 text-center text-zinc-400">
                  No jobs yet.
                </td>
              </tr>
            )}
            {jobs.map((job) => (
              <tr key={job.id} className="group transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                <td className="px-5 py-4 font-semibold text-zinc-900 dark:text-zinc-100">
                  <Link
                    href={`/dashboard/jobs/${job.id}`}
                    className="group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
                  >
                    {job.title}
                  </Link>
                </td>
                <td className="px-5 py-4 text-xs text-zinc-500">{formatDate(job.created_at)}</td>
                <td className="px-5 py-4 text-right">
                  <Link
                    href={`/dashboard/jobs/${job.id}`}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/40"
                  >
                    View <ChevronRight size={13} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default JobsPage;
