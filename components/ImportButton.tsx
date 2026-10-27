'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function ImportButton() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  }

  async function processFile(file: File) {
    // Client-side validation
    const maxSize = 2 * 1024 * 1024; // 2 MB
    const validTypes = ['.txt', '.md', '.docx'];
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!validTypes.includes(fileExt)) {
      setError(`That file type isn't supported. Try .txt, .md or .docx.`);
      setTimeout(() => setError(''), 4000);
      return;
    }

    if (file.size > maxSize) {
      setError('That file is too large. Maximum 2 MB.');
      setTimeout(() => setError(''), 4000);
      return;
    }

    setError('');
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/documents/import', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error?.message || 'Upload failed');
        setTimeout(() => setError(''), 4000);
        return;
      }

      const doc = await res.json();
      router.push(`/docs/${doc.id}`);
    } catch (err) {
      setError('An error occurred during upload');
      setTimeout(() => setError(''), 4000);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      await processFile(file);
    }
  }

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.md,.docx"
        onChange={handleFileSelect}
        className="hidden"
        id="file-upload"
      />
      
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          p-6 border-[1.5px] border-dashed rounded
          transition-all
          ${isDragging 
            ? 'border-[var(--ink)] bg-[var(--highlighter)]' 
            : 'border-[var(--ink)] bg-[var(--paper)]'
          }
        `}
        style={{
          clipPath: isDragging 
            ? 'polygon(0 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%)'
            : 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
        }}
      >
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full text-center disabled:opacity-50"
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-[3px] border-[var(--ink)] border-t-transparent rounded-full animate-spin" />
              <span className="font-[family-name:var(--font-jetbrains-loaded)] text-xs text-[var(--ink-soft)] uppercase tracking-wider">
                Uploading...
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <svg className="w-10 h-10 text-[var(--ink-soft)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <div>
                <p className="text-[var(--ink)] font-medium mb-1">
                  Drop a draft here
                </p>
                <p className="font-[family-name:var(--font-jetbrains-loaded)] text-xs text-[var(--ink-soft)] uppercase tracking-wider">
                  .txt, .md or .docx, up to 2 mb
                </p>
              </div>
            </div>
          )}
        </button>
      </div>
      
      {error && (
        <div className="mt-3 p-3 bg-[var(--paper)] border-[1.5px] border-[var(--vermilion)] rounded">
          <p className="text-sm text-[var(--vermilion)] font-medium">{error}</p>
        </div>
      )}
    </div>
  );
}
