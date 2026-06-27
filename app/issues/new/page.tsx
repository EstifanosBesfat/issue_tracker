// app/issues/new/page.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useState } from 'react';
import { issueSchema } from '@/app/validationSchemas';
import { z } from 'zod';

type IssueFormData = z.infer<typeof issueSchema>;

export default function NewIssuePage() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors } } = useForm<IssueFormData>({
    resolver: zodResolver(issueSchema)
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data: IssueFormData) => {
    try {
      setIsSubmitting(true);
      await axios.post('/api/issues', data);
      router.push('/issues');
      router.refresh();
    } catch (err) {
      setIsSubmitting(false);
      setError('An unexpected error occurred while saving.');
    }
  };

  const inputClass = "mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 text-gray-900 px-3 py-2 shadow-sm hover:border-gray-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none text-sm transition-all";

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-sm border border-gray-100">
      <h1 className="text-2xl font-bold mb-1 text-gray-900">Create New Issue</h1>
      <p className="text-sm text-gray-500 mb-6">File a new bug ticket or software feature task.</p>
      
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
            placeholder="Issue title"
          />
          {errors.title && (
            <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700">Description</label>
          <textarea
            {...register('description')}
            rows={5}
            className={inputClass}
            placeholder="Describe the problem, steps to reproduce, or requirements..."
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
          {isSubmitting ? 'Creating...' : 'Submit New Issue'}
        </button>
      </form>
    </div>
  );
}