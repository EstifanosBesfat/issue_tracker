'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  isActive?: boolean;
  createdAt?: string;
}

interface Props {
  currentUserId: string;
}

export default function UserTable({ currentUserId }: Props) {
  const [loading, setLoading] = useState<string | null>(null);

  const { data: users = [], refetch } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data } = await api.get<User[]>('/users');
      return data;
    },
  });

  const patch = async (id: string, data: object) => {
    setLoading(id);
    try {
      await api.patch(`/users/${id}`, data);
      await refetch();
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            {['Name', 'Email', 'Role', 'Status', 'Actions'].map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {users.map((user) => (
            <tr key={user.id} className={user.isActive === false ? 'opacity-50' : ''}>
              <td className="px-4 py-3 font-medium text-gray-900">{user.name ?? '—'}</td>
              <td className="px-4 py-3 text-gray-500">{user.email}</td>
              <td className="px-4 py-3">
                <select
                  value={user.role}
                  disabled={user.id === currentUserId || !!loading}
                  onChange={(e) => patch(user.id, { role: e.target.value })}
                  className="text-xs rounded border border-gray-300 px-2 py-1 focus:ring-1 focus:ring-primary disabled:opacity-50"
                >
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                    user.isActive !== false
                      ? 'bg-success/15 text-success'
                      : 'bg-danger/15 text-danger'
                  }`}
                >
                  {user.isActive !== false ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="px-4 py-3">
                {user.id !== currentUserId && (
                  <button
                    onClick={() => patch(user.id, { isActive: user.isActive === false })}
                    disabled={!!loading}
                    className={`text-xs px-3 py-1 rounded font-semibold transition ${
                      user.isActive !== false
                        ? 'bg-danger/10 text-danger hover:bg-danger/20'
                        : 'bg-success/10 text-success hover:bg-success/20'
                    } disabled:opacity-50`}
                  >
                    {loading === user.id
                      ? '...'
                      : user.isActive !== false
                        ? 'Deactivate'
                        : 'Activate'}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {users.length === 0 && (
        <p className="text-sm text-gray-500 py-4 text-center">No users found.</p>
      )}
    </div>
  );
}
