import { FormEvent, useState } from 'react';
import { Input, Button } from '@chahm/ui-components';

interface UploadResponse {
  key: string;
  bucket: string;
  contentType: string;
}

export function UploadImageForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResponse | null>(null);

  const POST_URL = import.meta.env.VITE_POST_URL as string | undefined;

  async function fileToDataUrl(f: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(f);
    });
  }

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!POST_URL) {
      setError('Upload endpoint is not configured. Please set VITE_POST_URL.');
      return;
    }

    if (!file) {
      setError('Please choose an image file to upload.');
      return;
    }

    setLoading(true);
    try {
      const base64 = await fileToDataUrl(file);

      const payload = {
        fileName: file.name,
        title: title || file.name,
        description: description || undefined,
        base64, // data URL format supported by backend
      };

      const res = await fetch(POST_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || `Upload failed with status ${res.status}`);
      }

      const json = (await res.json()) as UploadResponse;
      setResult(json);
      setTitle('');
      setDescription('');
      setFile(null);
    } catch (err: any) {
      setError(err?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl w-full border rounded-md p-4 bg-white/50">
      <h3 className="font-semibold text-lg mb-3">Upload Image</h3>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <Input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="My photo title"
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
            className="w-full border rounded px-3 py-2"
            rows={3}
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Image file</label>
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            disabled={loading}
          />
          {file && (
            <p className="text-xs text-gray-600 mt-1">Selected: {file.name}</p>
          )}
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
            {error}
          </div>
        )}
        {result && (
          <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
            Uploaded! S3 key: <code className="font-mono">{result.key}</code>
          </div>
        )}

        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            {loading ? 'Uploading...' : 'Upload'}
          </Button>
          {!POST_URL && (
            <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
              VITE_POST_URL is not set
            </span>
          )}
        </div>
      </form>
    </div>
  );
}

export default UploadImageForm;
