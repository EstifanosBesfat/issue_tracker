'use client';

import { useState, useRef } from 'react';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024;
const MAX_IMAGES = 5;

interface Props {
  onUpload: (urls: string[]) => void;
  existingCount?: number;
}

export default function ImageUpload({ onUpload, existingCount = 0 }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previews, setPreviews] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const remaining = MAX_IMAGES - existingCount - previews.length;

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    setError(null);

    // Validate each file
    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError('Only JPG, PNG, GIF, and WebP images are allowed.');
        return;
      }
      if (file.size > MAX_SIZE) {
        setError('File must be under 5 MB');
        return;
      }
    }

    if (files.length > remaining) {
      setError(`You can upload at most ${remaining} more image(s).`);
      return;
    }

    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Upload failed');
        uploadedUrls.push(data.url);
      }

      setPreviews((prev) => [...prev, ...uploadedUrls]);
      onUpload([...previews, ...uploadedUrls]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Image upload failed. Please try again.';
      setError(message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      {previews.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {previews.map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={url}
              alt={`Upload ${i + 1}`}
              className="h-16 w-16 rounded object-cover border border-zinc-200"
            />
          ))}
        </div>
      )}

      {remaining > 0 && (
        <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-secondary hover:underline">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            multiple
            onChange={handleChange}
            disabled={uploading}
            className="hidden"
          />
          {uploading ? 'Uploading...' : `Attach image${remaining > 1 ? 's' : ''} (${remaining} remaining)`}
        </label>
      )}

      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
