"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { AiSpinner } from "@/components/ui/ai-loader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, ApiError, type Company } from "@/lib/api";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const CompaniesPage = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadCompanies = () =>
    api
      .listCompanies()
      .then(setCompanies)
      .catch((err) => setListError(err instanceof ApiError ? err.message : "Failed to load"));

  useEffect(() => {
    loadCompanies().finally(() => setLoading(false));
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.createUser({ company_name: companyName, full_name: fullName, email, password });
      setCompanyName("");
      setFullName("");
      setEmail("");
      setPassword("");
      setOpen(false);
      await loadCompanies();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <AiSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Add company</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add company</DialogTitle>
            </DialogHeader>
            <form onSubmit={onSubmit} className="space-y-4">
              {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

              <div className="space-y-1">
                <Label htmlFor="companyName">Company name</Label>
                <Input id="companyName" required value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="fullName">Hiring manager full name</Label>
                <Input id="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="email">Hiring manager email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 chars, 1 letter + 1 number"
                />
              </div>

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? "Creating…" : "Create company"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {listError && <p className="text-sm text-red-500">{listError}</p>}
      <div className="max-w-full overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/60">
              <th className="px-5 py-3.5 text-left text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                Name
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                Created
              </th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {companies.length === 0 && (
              <tr>
                <td colSpan={3} className="px-5 py-10 text-center text-zinc-400">
                  No companies yet.
                </td>
              </tr>
            )}
            {companies.map((company) => (
              <tr key={company.id} className="group transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                <td className="px-5 py-4 font-semibold text-zinc-900 dark:text-zinc-100">
                  <Link
                    href={`/dashboard/companies/${company.id}`}
                    className="group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
                  >
                    {company.name}
                  </Link>
                </td>
                <td className="px-5 py-4 text-xs text-zinc-500">{formatDate(company.created_at)}</td>
                <td className="px-5 py-4 text-right">
                  <Link
                    href={`/dashboard/companies/${company.id}`}
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

export default CompaniesPage;
