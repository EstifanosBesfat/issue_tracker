'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { ProjectRole } from '@/app/types/project';
import Avatar from './Avatar';

interface SearchUser {
  id: string;
  name: string | null;
  email: string;
  image?: string | null;
}

interface Props {
  projectId: string;
  canManage: boolean;
  onMemberAdded?: () => void;
}

export default function MemberInvite({ projectId, canManage, onMemberAdded }: Props) {
  const [query, setQuery] = useState('');
  const [email, setEmail] = useState('');
  const [results, setResults] = useState<SearchUser[]>([]);
  const [role, setRole] = useState<ProjectRole>('MEMBER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!query.trim() || query.length < 1) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get<SearchUser[]>(
          `/users/search?q=${encodeURIComponent(query.trim())}`,
        );
        setResults(data);
      } catch {
        setResults([]);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  const inviteByUserId = async (userId: string) => {
    setLoading(true);
    setError('');
    try {
      await api.post(`/projects/${projectId}/members`, { userId, role });
      setQuery('');
      setResults([]);
      onMemberAdded?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to invite member');
    } finally {
      setLoading(false);
    }
  };

  const inviteByEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    try {
      await api.post(`/projects/${projectId}/members`, {
        email: email.trim(),
        role,
      });
      setEmail('');
      onMemberAdded?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to invite member');
    } finally {
      setLoading(false);
    }
  };

  if (!canManage) return null;

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-gray-700">Invite member</h4>

      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        {results.length > 0 && (
          <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg overflow-hidden">
            {results.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => inviteByUserId(user.id)}
                disabled={loading}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-primary/10 disabled:opacity-50"
              >
                <Avatar image={user.image} name={user.name ?? user.email} size={24} />
                <span className="font-medium">{user.name ?? user.email}</span>
                <span className="text-xs text-gray-400">{user.email}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={inviteByEmail} className="flex flex-wrap items-end gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Or invite by email"
          className="flex-1 min-w-[180px] rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as ProjectRole)}
          className="rounded-md border border-gray-300 px-2 py-2 text-sm"
        >
          <option value="MEMBER">Member</option>
          <option value="OWNER">Owner</option>
        </select>
        <button
          type="submit"
          disabled={loading || !email.trim()}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          Invite
        </button>
      </form>

      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
