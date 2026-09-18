"use client";

import { useEffect, useState } from "react";

import { AiSpinner } from "@/components/ui/ai-loader";
import { api, ApiError, type AuthUser } from "@/lib/api";

/** Hiring managers only, super admins now manage companies from /dashboard/companies instead. */
const TeamPage = () => {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .listUsers()
      .then((allUsers) => setUsers(allUsers.filter((u) => u.role === "hiring_manager")))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <AiSpinner />;

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="max-w-full overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
        <table className="w-full min-w-[480px] text-sm">
          <thead className="bg-zinc-50 text-left text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:bg-zinc-800 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {users.length === 0 && (
              <tr>
                <td colSpan={2} className="px-4 py-8 text-center text-zinc-400">
                  No users yet.
                </td>
              </tr>
            )}
            {users.map((user) => (
              <tr key={user.id} className="bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800">
                <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{user.full_name}</td>
                <td className="px-4 py-3 text-zinc-500">{user.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TeamPage;
