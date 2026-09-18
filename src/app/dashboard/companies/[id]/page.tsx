"use client";

import { use, useEffect, useState } from "react";

import { AiSpinner } from "@/components/ui/ai-loader";
import { Badge } from "@/components/ui/badge";
import { api, ApiError, type AuthUser, type Company } from "@/lib/api";

const roleLabel: Record<string, string> = {
  super_admin: "Super Admin",
  hiring_manager: "Hiring Manager",
};

const CompanyDetailPage = ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = use(params);

  const [company, setCompany] = useState<Company | null>(null);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.getCompany(id), api.listCompanyUsers(id)])
      .then(([companyData, companyUsers]) => {
        setCompany(companyData);
        setUsers(companyUsers);
      })
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <AiSpinner />;
  if (loadError) return <p className="text-sm text-red-500">{loadError}</p>;
  if (!company) return null;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{company.name}</h2>
      </div>

      <div className="max-w-full overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
        <table className="w-full min-w-[480px] text-sm">
          <thead className="bg-zinc-50 text-left text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:bg-zinc-800 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {users.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-zinc-400">
                  No users yet.
                </td>
              </tr>
            )}
            {users.map((user) => (
              <tr key={user.id} className="bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800">
                <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{user.full_name}</td>
                <td className="px-4 py-3 text-zinc-500">{user.email}</td>
                <td className="px-4 py-3">
                  <Badge variant={user.role === "super_admin" ? "default" : "secondary"}>
                    {roleLabel[user.role] ?? user.role}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CompanyDetailPage;
