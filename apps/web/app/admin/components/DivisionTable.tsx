'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Division } from '@/app/types/project';

export default function DivisionTable() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const { data: divisions = [], refetch } = useQuery({
    queryKey: ['divisions'],
    queryFn: async () => {
      const { data } = await api.get<Division[]>('/divisions');
      return data;
    },
  });

  const patch = async (id: string, data: object) => {
    setLoading(id);
    setError('');
    try {
      await api.patch(`/divisions/${id}`, data);
      await refetch();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update division.');
    } finally {
      setLoading(null);
    }
  };

  const createDivision = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    setError('');
    try {
      await api.post('/divisions', { name: newName.trim() });
      setNewName('');
      await refetch();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create division.');
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (division: Division) => {
    setEditingId(division.id);
    setEditingName(division.name);
  };

  const saveEdit = async () => {
    if (!editingId || !editingName.trim()) return;
    await patch(editingId, { name: editingName.trim() });
    setEditingId(null);
    setEditingName('');
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') createDivision();
          }}
          placeholder="New division name (e.g. Marketing)"
          className="flex-1 min-w-[200px] rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
        />
        <button
          onClick={createDivision}
          disabled={creating || !newName.trim()}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition"
        >
          {creating ? 'Adding…' : '+ Add Division'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-danger/10 text-danger rounded-md text-sm">{error}</div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['Name', 'Status', 'Actions'].map((h) => (
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
            {divisions.map((division) => (
              <tr key={division.id} className={!division.isActive ? 'opacity-50' : ''}>
                <td className="px-4 py-3 font-medium text-gray-900">
                  {editingId === division.id ? (
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit();
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      autoFocus
                      className="rounded border border-gray-300 px-2 py-1 text-sm focus:ring-1 focus:ring-primary"
                    />
                  ) : (
                    division.name
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                      division.isActive
                        ? 'bg-success/15 text-success'
                        : 'bg-danger/15 text-danger'
                    }`}
                  >
                    {division.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {editingId === division.id ? (
                      <>
                        <button
                          onClick={saveEdit}
                          disabled={loading === division.id}
                          className="text-xs px-3 py-1 rounded font-semibold bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50 transition"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-xs px-3 py-1 rounded font-semibold text-gray-500 hover:bg-gray-100 transition"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(division)}
                          disabled={!!loading}
                          className="text-xs px-3 py-1 rounded font-semibold text-gray-500 hover:bg-gray-100 disabled:opacity-50 transition"
                        >
                          Rename
                        </button>
                        <button
                          onClick={() =>
                            patch(division.id, { isActive: !division.isActive })
                          }
                          disabled={!!loading}
                          className={`text-xs px-3 py-1 rounded font-semibold transition ${
                            division.isActive
                              ? 'bg-danger/10 text-danger hover:bg-danger/20'
                              : 'bg-success/10 text-success hover:bg-success/20'
                          } disabled:opacity-50`}
                        >
                          {loading === division.id
                            ? '...'
                            : division.isActive
                              ? 'Deactivate'
                              : 'Activate'}
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
