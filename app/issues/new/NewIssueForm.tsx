'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { createIssueSchema } from '@/app/validationSchemas';
import { ImageUpload } from '@/app/components';
import { z } from 'zod';

type IssueFormData = z.infer<typeof createIssueSchema>;

interface User {
  id: string;
  name: string | null;
}

interface Props {
  users: User[];
}

export default function NewIssueForm({ users }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTriaging, setIsTriaging] = useState(false);
  const [triageReasoning, setTriageReasoning] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<IssueFormData>({
    resolver: zodResolver(createIssueSchema),
    defaultValues: { priority: 'MEDIUM', category: 'OTHER' },
  });

  const runAiTriage = async () => {
    const description = getValues('description');
    if (!description || description.trim().length < 10) {
      setError('Please enter a description (at least 10 characters) before using AI auto-fill.');
      return;
    }
    setError('');
    setTriageReasoning('');
    setIsTriaging(true);
    try {
      const res = await axios.post('/api/ai-triage', { description });
      const { priority, category, reasoning, error: apiError } = res.data;
      if (apiError) {
        setError(`AI Error: ${apiError}`);
        return;
      }
      setValue('priority', priority, { shouldDirty: true });
      setValue('category', category, { shouldDirty: true });
      setTriageReasoning(reasoning);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(message ? `AI Error: ${message}` : 'AI triage failed — check server logs.');
    } finally {
      setIsTriaging(false);
    }
  };

  const onSubmit = async (data: IssueFormData) => {
    try {
      setIsSubmitting(true);

      // The schema expects dueDate as an ISO datetime string or null/undefined.
      // The <input type="date"> produces "YYYY-MM-DD", so we convert it here.
      const dueDate =
        data.dueDate && data.dueDate.trim() !== ''
          ? new Date(data.dueDate).toISOString()
          : undefined;

      // Coerce empty assigneeId to null so it passes cuid() | null validation
      const assigneeId =
        data.assigneeId && data.assigneeId.trim() !== ''
          ? data.assigneeId
          : null;

      await axios.post('/api/issues', { ...data, dueDate, assigneeId, imageUrls });
      // Invalidate React Query cache so the issues list refreshes automatically
      await queryClient.invalidateQueries({ queryKey: ['issues'] });
      router.push('/issues');
    } catch {
      setIsSubmitting(false);
      setError('An unexpected error occurred while saving.');
    }
  };

  const cls =
    'mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 text-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A651]/30 focus:border-[#00A651] transition-all';

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-sm border border-gray-100">
      <h1 className="text-2xl font-bold mb-1 text-gray-900">New Incident Ticket</h1>
      <p className="text-sm text-gray-500 mb-6">File a new issue or service request.</p>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700">Title</label>
          <input type="text" {...register('title')} className={cls} placeholder="Issue title" />
          {errors.title && (
            <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-semibold text-gray-700">Description</label>
            <button
              type="button"
              onClick={runAiTriage}
              disabled={isTriaging}
              className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-md bg-violet-50 border border-violet-200 text-violet-700 hover:bg-violet-100 disabled:opacity-60 px-2.5 py-1 transition-colors"
              title="AI will read your description and auto-set Priority & Category"
            >
              {isTriaging ? (
                <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              ) : (
                <span>✨</span>
              )}
              {isTriaging ? 'Analyzing...' : 'AI Auto-Fill'}
            </button>
          </div>
          <textarea
            {...register('description')}
            rows={4}
            className={cls}
            placeholder="Describe the problem in detail. The AI will read this to suggest priority and category."
          />
          {triageReasoning && (
            <p className="mt-1.5 text-xs text-violet-700 bg-violet-50 border border-violet-100 rounded-md px-3 py-2">
              🤖 <strong>AI reasoning:</strong> {triageReasoning}
            </p>
          )}
          {errors.description && (
            <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700">Category</label>
            <select {...register('category')} className={cls}>
              <option value="MOBILE_NETWORK">Mobile Network</option>
              <option value="FIBER_BROADBAND">Fiber Broadband</option>
              <option value="TELEBIRR_BILLING">Telebirr &amp; Billing</option>
              <option value="CORE_INFRASTRUCTURE">Core Infrastructure</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700">Priority</label>
            <select {...register('priority')} className={cls}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700">Department</label>
            <select {...register('department')} className={cls}>
              <option value="">— Select —</option>
              <option value="Network">Network</option>
              <option value="IT">IT</option>
              <option value="Customer Service">Customer Service</option>
              <option value="Finance">Finance</option>
              <option value="HR">HR</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700">Assign To</label>
            <select {...register('assigneeId')} className={cls}>
              <option value="">— Unassigned —</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name ?? u.id}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700">Due Date <span className="text-gray-400 font-normal">(optional)</span></label>
          <input type="date" {...register('dueDate')} className={cls} />
          {errors.dueDate && (
            <p className="mt-1 text-xs text-red-600">{errors.dueDate.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Attachments</label>
          <ImageUpload onUpload={setImageUrls} />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-[#00A651] py-2.5 px-4 text-sm font-semibold text-white shadow-sm hover:bg-[#007a3d] disabled:opacity-50 transition"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
        </button>
      </form>
    </div>
  );
}
