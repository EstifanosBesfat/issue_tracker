// app/issues/[id]/edit/EditIssueForm.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useState } from 'react';
import { patchIssueSchema } from '@/app/validationSchemas';
import { z } from 'zod';

type IssueFormData = z.infer<typeof patchIssueSchema>;

interface Props {
  issue: {
    id: string;
    title: string;
    description: string;
    status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    category: 'MOBILE_NETWORK' | 'FIBER_BROADBAND' | 'TELEBIRR_BILLING' | 'CORE_INFRASTRUCTURE' | 'OTHER';
    createdAt: Date;
    updatedAt: Date;

  }
}

export default function EditIssueForm({ issue }: Props) {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors } } = useForm<IssueFormData>({
    resolver: zodResolver(patchIssueSchema),
    defaultValues: {
      title: issue.title,
      description: issue.description,
      status: issue.status,
      priority: issue.priority,
      category: issue.category,
    }
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data: IssueFormData) => {
    try {
      setIsSubmitting(true);
      await axios.patch(`/api/issues/${issue.id}`, data);
      router.push(`/issues/${issue.id}`);
      router.refresh();
    } catch (err) {
      setIsSubmitting(false);
      setError('An unexpected error occurred while saving your changes.');
    }
  };

  const inputClass = "mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 text-gray-900 px-3 py-2 shadow-sm hover:border-gray-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none text-sm transition-all";

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-sm border border-gray-100">
      <h1 className="text-2xl font-bold mb-1 text-gray-900">Edit Issue</h1>
      <p className="text-sm text-gray-500 mb-6">Modify the details of this bug ticket.</p>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700">Title</label>
          <input
            type="text"
            {...register('title')}
            className={inputClass}
          />
          {errors.title && (
            <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700">Status</label>
          <select
            {...register('status')}
            className={inputClass}
          >
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="CLOSED">Closed</option>
          </select>
          {errors.status && (
            <p className="mt-1 text-xs text-red-600">{errors.status.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700">Description</label>
          <textarea
            {...register('description')}
            rows={5}
            className={inputClass}
          />
          {errors.description && (
            <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700">Category</label>
            <select
              {...register('category')}
              className={inputClass}
            >
              <option value="MOBILE_NETWORK">Mobile Network (3G/4G/5G)</option>
              <option value="FIBER_BROADBAND">Fiber Broadband</option>
              <option value="TELEBIRR_BILLING">Telebirr & Billing</option>
              <option value="CORE_INFRASTRUCTURE">Core Infrastructure / Tower</option>
              <option value="OTHER">Other Support</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700">Priority</label>
            <select
              {...register('priority')}
              className={inputClass}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical SLA</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2.5 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none disabled:bg-indigo-300 transition"
        >
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}