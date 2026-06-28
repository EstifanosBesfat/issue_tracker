'use client';

import { useState } from 'react';
import Avatar from './Avatar';

interface Author {
  id: string;
  name: string | null;
  image: string | null;
}

interface Comment {
  id: string;
  content: string;
  createdAt: Date | string;
  author: Author;
}

interface Props {
  issueId: string;
  initialComments: Comment[];
  currentUserId?: string | null;
  userRole?: string | null;
}

function relativeTime(date: Date | string): string {
  const ms = Date.now() - new Date(date).getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function CommentSection({ issueId, initialComments, currentUserId, userRole }: Props) {
  const [comments, setComments] = useState<Comment[]>(
    [...initialComments].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  );
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canDelete = (comment: Comment) =>
    currentUserId && (comment.author.id === currentUserId || userRole === 'ADMIN');

  const handleSubmit = async () => {
    if (!content.trim()) { setError('Comment cannot be empty.'); return; }
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(`/api/issues/${issueId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to post comment');
      setComments((prev) => [...prev, data]);
      setContent('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      const res = await fetch(`/api/comments/${commentId}`, { method: 'DELETE' });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete comment');
    }
  };

  return (
    <div className="mt-8">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">
        Comments ({comments.length})
      </h3>

      <div className="space-y-4 mb-6">
        {comments.length === 0 && (
          <p className="text-sm text-gray-400">No comments yet.</p>
        )}
        {comments.map((c) => (
          <div key={c.id} className="flex gap-3">
            <Avatar image={c.author.image} name={c.author.name ?? 'User'} size={32} />
            <div className="flex-1 bg-gray-50 rounded-lg px-4 py-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-gray-700">{c.author.name ?? 'User'}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{relativeTime(c.createdAt)}</span>
                  {canDelete(c) && (
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="text-xs text-red-500 hover:text-red-700 transition"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.content}</p>
            </div>
          </div>
        ))}
      </div>

      {currentUserId ? (
        <div className="space-y-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            placeholder="Write a comment..."
            className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A651]/30 focus:border-[#00A651] transition-all"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-md bg-[#00A651] px-4 py-2 text-sm font-semibold text-white hover:bg-[#007a3d] disabled:opacity-50 transition"
          >
            {submitting ? 'Posting…' : 'Post Comment'}
          </button>
        </div>
      ) : (
        <p className="text-sm text-gray-500">
          <a href="/auth/signin" className="text-[#00A651] hover:underline font-semibold">Sign in</a> to comment.
        </p>
      )}
    </div>
  );
}
