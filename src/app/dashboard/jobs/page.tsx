"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AiSpinner } from "@/components/ui/ai-loader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api, ApiError, type AuthUser, type Job } from "@/lib/api";

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
            <DialogContent>
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
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    required
                    rows={5}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
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
      <div className="max-w-full overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
        <table className="w-full min-w-[480px] text-sm">
          <thead className="bg-zinc-50 text-left text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:bg-zinc-800 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {jobs.length === 0 && (
              <tr>
                <td colSpan={2} className="px-4 py-8 text-center text-zinc-400">
                  No jobs yet.
                </td>
              </tr>
            )}
            {jobs.map((job) => (
              <tr key={job.id} className="bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800">
                <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                  <Link href={`/dashboard/jobs/${job.id}`} className="hover:underline">
                    {job.title}
                  </Link>
                </td>
                <td className="max-w-md truncate px-4 py-3 text-zinc-500">{job.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default JobsPage;
