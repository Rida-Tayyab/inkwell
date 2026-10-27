'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import RichEditor from '@/components/Editor';
import SaveStatus, { SaveState } from '@/components/SaveStatus';
import ShareDialog from '@/components/ShareDialog';

interface Document {
  id: string;
  title: string;
  content: any;
  version: number;
  role: 'owner' | 'editor' | 'viewer';
}

export default function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const [doc, setDoc] = useState<Document | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [docId, setDocId] = useState('');
  const router = useRouter();
  
  // Track if a save is in progress to prevent concurrent saves
  const isSavingRef = useRef(false);
  const currentVersionRef = useRef(0);

  // Resolve params
  useEffect(() => {
    params.then((p) => setDocId(p.id));
  }, [params]);

  // Load document
  useEffect(() => {
    if (!docId) return;

    async function loadDoc() {
      try {
        const res = await fetch(`/api/documents/${docId}`);
        if (!res.ok) {
          router.push('/');
          return;
        }
        const data = await res.json();
        setDoc(data);
        setTitle(data.title);
        setContent(data.content);
        currentVersionRef.current = data.version;
      } catch (err) {
        setError('Failed to load document');
        router.push('/');
      } finally {
        setLoading(false);
      }
    }

    loadDoc();
  }, [docId, router]);

  // Autosave with debounce
  useEffect(() => {
    if (!doc || !content || doc.role === 'viewer') return;

    const timer = setTimeout(async () => {
      // Skip if already saving
      if (isSavingRef.current) return;

      isSavingRef.current = true;
      setSaveState('saving');
      
      try {
        const res = await fetch(`/api/documents/${docId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content,
            baseVersion: currentVersionRef.current,
          }),
        });

        if (res.status === 409) {
          setSaveState('error');
          const data = await res.json();
          setError(data.error?.message || 'Document changed elsewhere. Reload to see changes.');
          isSavingRef.current = false;
          return;
        }

        if (!res.ok) throw new Error('Save failed');

        const updated = await res.json();
        setDoc(updated);
        currentVersionRef.current = updated.version;
        setSaveState('saved');
        setTimeout(() => setSaveState('idle'), 2000);
      } catch (err) {
        setSaveState('error');
      } finally {
        isSavingRef.current = false;
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [content, doc, docId]);

  // Save title on blur or Enter
  async function saveTitleChange() {
    if (!doc || doc.role === 'viewer' || title === doc.title) return;

    try {
      const res = await fetch(`/api/documents/${docId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || 'Untitled document',
          baseVersion: currentVersionRef.current,
        }),
      });

      if (!res.ok) throw new Error('Failed to save title');
      const updated = await res.json();
      setDoc(updated);
      currentVersionRef.current = updated.version;
    } catch (err) {
      setError('Failed to save title');
    }
  }

  // Warn on unsaved changes
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (saveState === 'saving' || saveState === 'error') {
        e.preventDefault();
        e.returnValue = '';
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveState]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading document...</p>
        </div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-600 font-medium">Document not found</p>
        </div>
      </div>
    );
  }

  const isReadOnly = doc.role === 'viewer';

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <a 
              href="/" 
              className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              title="Back to dashboard"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </a>
            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={saveTitleChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.currentTarget.blur();
                  }
                }}
                disabled={isReadOnly}
                className="w-full text-lg font-semibold outline-none disabled:bg-transparent px-3 py-2 rounded-lg hover:bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all"
                placeholder="Untitled document"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <SaveStatus state={saveState} />

            {isReadOnly && (
              <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span className="font-medium">View Only</span>
              </div>
            )}

            {doc.role === 'owner' && (
              <button
                onClick={() => setShowShareDialog(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-semibold transition-all shadow-sm hover:shadow flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share
              </button>
            )}
          </div>
        </div>
      </header>

      {error && (
        <div className="bg-red-50 border-b border-red-200 text-red-700 px-6 py-3 text-sm flex items-center gap-3">
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="font-medium">{error}</span>
          <button
            onClick={() => window.location.reload()}
            className="ml-auto text-red-700 hover:text-red-900 font-semibold underline"
          >
            Reload Page
          </button>
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 overflow-hidden bg-gradient-to-br from-gray-50 to-white">
        <RichEditor
          key={docId}
          content={content}
          onChange={setContent}
          readOnly={isReadOnly}
        />
      </div>

      {/* Share Dialog */}
      {showShareDialog && <ShareDialog documentId={docId} onClose={() => setShowShareDialog(false)} />}
    </div>
  );
}
