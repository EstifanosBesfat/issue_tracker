'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { api, getApiErrorMessage } from '@/lib/api';
import { createProjectSchema } from '@/app/validationSchemas';
import type { Division } from '@/app/types/project';
import { z } from 'zod';

type FormData = z.infer<typeof createProjectSchema>;

export default function NewProjectPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: '',
      description: '',
      divisionId: '',
      dueDate: '',
    },
  });

  const { data: divisions = [] } = useQuery({
    queryKey: ['divisions'],
    queryFn: async () => {
      const { data } = await api.get<Division[]>('/divisions');
      return data.filter((d) => d.isActive);
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        name: data.name,
        description: data.description,
        divisionId: data.divisionId || undefined,
        dueDate: data.dueDate || undefined,
      };
      const { data: project } = await api.post('/projects', payload);
      router.push(`/projects/${project.id}`);
    } catch (err) {
      setError('root', { message: getApiErrorMessage(err, 'Failed to create project') });
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/projects" className="text-sm text-secondary hover:underline">
          ← Back to projects
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">New Project</h1>
        <p className="text-sm text-gray-500">Create a new project for your team.</p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white rounded-lg border border-gray-200 p-6 space-y-5"
      >
        {errors.root && (
          <div className="rounded-md bg-danger/10 border border-danger/20 px-4 py-3 text-sm text-danger">
            {errors.root.message}
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Project Name
          </label>
          <input
            id="name"
            {...register('name')}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {errors.name && <p className="text-xs text-danger mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            rows={4}
            {...register('description')}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {errors.description && (
            <p className="text-xs text-danger mt-1">{errors.description.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="divisionId" className="block text-sm font-medium text-gray-700 mb-1">
            Division
          </label>
          <select
            id="divisionId"
            {...register('divisionId')}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Select division (optional)</option>
            {divisions.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
            Due Date
          </label>
          <input
            id="dueDate"
            type="date"
            {...register('dueDate')}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {isSubmitting ? 'Creating…' : 'Create Project'}
        </button>
      </form>
    </div>
  );
}
