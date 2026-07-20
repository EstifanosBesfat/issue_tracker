'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Avatar from './Avatar';
import { renderMentionContent } from '@/lib/mentions';

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

interface MentionUser {
  id: string;
  name: string | null;
  email: string;
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

function CommentBody({ content }: { content: string }) {
  const parts = renderMentionContent(content);

  return (
    <p className="text-sm text-gray-700 whitespace-pre-wrap">
      {parts.map((part, index) =>
        part.type === 'mention' ? (
          <span key={index} className="font-semibold text-[#00A651]">
            {part.value}
          </span>
        ) : (
          <span key={index}>{part.value}</span>
        )
      )}
    </p>
  );
}

export default function CommentSection({ issueId, initialComments, currentUserId, userRole }: Props) {
  const t = useTranslations('comments');
  const [comments, setComments] = useState<Comment[]>(
    [...initialComments].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  );
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionUsers, setMentionUsers] = useState<MentionUser[]>([]);

  const canDelete = (comment: Comment) =>
    currentUserId && (comment.author.id === currentUserId || userRole === 'ADMIN');

  useEffect(() => {
    if (!mentionQuery || mentionQuery.length < 1) {
      setMentionUsers([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(mentionQuery)}`);
        if (res.ok) {
          setMentionUsers(await res.json());
        }
      } catch {
        setMentionUsers([]);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [mentionQuery]);

  const handleContentChange = (value: string) => {
    setContent(value);

    const match = value.match(/@([\w.\u1200-\u137F]*)$/);
    setMentionQuery(match?.[1] ?? null);
  };

  const insertMention = (user: MentionUser) => {
    const label = user.name ?? user.email.split('@')[0];
    const nextValue = content.replace(/@([\w.\u1200-\u137F]*)$/, `@${label} `);
    setContent(nextValue);
    setMentionQuery(null);
    setMentionUsers([]);
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      setError(t('emptyError'));
      return;
    }
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
      setMentionQuery(null);
      setMentionUsers([]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      const res = await fetch(`/api/comments/${commentId}`, { method: 'DELETE' });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error);
      }
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete comment');
    }
  };

  return (
    <div className="mt-8">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">
        {t('title', { count: comments.length })}
      </h3>

      <div className="space-y-4 mb-6">
        {comments.length === 0 && (
          <p className="text-sm text-gray-400">{t('empty')}</p>
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
                      {t('delete')}
                    </button>
                  )}
                </div>
              </div>
              <CommentBody content={c.content} />
            </div>
          </div>
        ))}
      </div>

      {currentUserId ? (
        <div className="space-y-2 relative">
          <textarea
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            rows={3}
            placeholder={t('placeholder')}
            className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A651]/30 focus:border-[#00A651] transition-all"
          />
          <p className="text-xs text-gray-400">{t('mentionHint')}</p>

          {mentionUsers.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-md border border-gray-200 bg-white shadow-lg overflow-hidden">
              {mentionUsers.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => insertMention(user)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-green-50"
                >
                  <span className="font-medium text-gray-800">{user.name ?? user.email}</span>
                  <span className="text-xs text-gray-400">{user.email}</span>
                </button>
              ))}
            </div>
          )}

          {error && <p className="text-xs text-red-600">{error}</p>}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-md bg-[#00A651] px-4 py-2 text-sm font-semibold text-white hover:bg-[#007a3d] disabled:opacity-50 transition"
          >
            {submitting ? t('posting') : t('post')}
          </button>
        </div>
      ) : (
        <p className="text-sm text-gray-500">
          <a href="/auth/signin" className="text-[#00A651] hover:underline font-semibold">
            {t('signInToComment')}
          </a>
        </p>
      )}
    </div>
  );
}
