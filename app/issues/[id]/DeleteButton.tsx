'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  issueId: string;
  canDelete?: boolean;
}

export default function DeleteButton({ issueId, canDelete = true }: Props) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  if (!canDelete) return null;

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setError('');
      const res = await fetch(`/api/issues/${issueId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to delete');
      }
      router.push('/issues');
      router.refresh();
    } catch (err: unknown) {
      setIsDeleting(false);
      setShowConfirm(false);
      setError(err instanceof Error ? err.message : 'Could not delete the issue.');
    }
  };

  return (
    <>
      {error && (
        <div className="fixed top-4 right-4 z-50 bg-danger/10 border border-danger/30 text-danger px-4 py-3 rounded-md text-sm shadow-md flex items-center gap-3">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-danger/80 hover:text-danger font-bold">✕</button>
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Delete Issue</h2>
            <p className="text-sm text-gray-600 mb-6">
              This will permanently delete this issue and all its images, comments, and activity logs. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-semibold text-danger-foreground bg-danger rounded-md hover:opacity-90 disabled:opacity-50 transition"
              >
                {isDeleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setShowConfirm(true)}
        className="rounded-md bg-danger px-3.5 py-1.5 text-sm font-semibold text-danger-foreground hover:opacity-90 disabled:opacity-50 transition"
      >
        Delete
      </button>
    </>
  );
}
