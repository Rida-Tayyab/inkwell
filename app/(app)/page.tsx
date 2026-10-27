'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ImportButton from '@/components/ImportButton';
import Stamp from '@/components/Stamp';

export default function Dashboard() {
  const [owned, setOwned] = useState([]);
  const [shared, setShared] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      try {
        const userRes = await fetch('/api/me');
        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData);
        }

        const docsRes = await fetch('/api/documents');
        if (!docsRes.ok) throw new Error('Failed to load documents');
        const data = await docsRes.json();
        setOwned(data.owned || []);
        setShared(data.shared || []);
      } catch (err) {
        setError('Failed to load documents');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  async function handleNewDocument() {
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error('Failed to create document');
      const doc = await res.json();
      router.push(`/docs/${doc.id}`);
    } catch (err) {
      setError('Failed to create document');
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // Generate stable rotation for cards based on doc ID
  function getCardRotation(id: string): number {
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return ((hash % 12) - 6) / 10; // -0.6 to 0.6 degrees
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--desk)]">
        <div className="text-center">
          <div className="w-12 h-12 border-[3px] border-[var(--ink)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-[family-name:var(--font-jetbrains-loaded)] text-xs text-[var(--ink-soft)] uppercase tracking-wider">
            Loading workspace...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--desk)]">
      {/* Header - Ruled Strip */}
      <header className="bg-[var(--paper)] border-b-[1.5px] border-[var(--ink)] sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <h1 className="font-[family-name:var(--font-fraunces-loaded)] text-2xl font-bold text-[var(--ink)]" style={{ fontVariationSettings: "'opsz' 48" }}>
            Inkwell
          </h1>
          <div className="flex items-center gap-4">
            {user && (
              <span className="hidden sm:inline font-[family-name:var(--font-jetbrains-loaded)] text-xs text-[var(--ink-soft)] uppercase tracking-wider">
                {user.email}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-sm text-[var(--ink)] hover:text-[var(--vermilion)] font-medium transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Actions */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4 items-start">
          <button
            onClick={handleNewDocument}
            className="px-6 py-3 bg-[var(--vermilion)] text-[var(--paper)] border-[1.5px] border-[var(--ink)] rounded font-semibold shadow-hard hover:shadow-hard-lg button-lift"
          >
            New page
          </button>
          <ImportButton />
        </div>

        {error && (
          <div className="mb-6 p-4 bg-[var(--paper)] border-[1.5px] border-[var(--vermilion)] rounded">
            <p className="text-sm text-[var(--vermilion)] font-medium">{error}</p>
          </div>
        )}

        {/* Folder Tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* On my desk */}
          <section>
            <div className="mb-6">
              <h2 className="font-[family-name:var(--font-fraunces-loaded)] text-2xl font-semibold text-[var(--ink)] mb-1" style={{ fontVariationSettings: "'opsz' 36" }}>
                On my desk
              </h2>
              <p className="font-[family-name:var(--font-jetbrains-loaded)] text-xs text-[var(--ink-soft)] uppercase tracking-wider">
                {owned.length} {owned.length === 1 ? 'page' : 'pages'}
              </p>
            </div>
            
            <div className="space-y-4">
              {owned.length === 0 ? (
                <div className="p-12 bg-[var(--paper)] border-[1.5px] border-[var(--ink)] rounded text-center">
                  <svg className="w-16 h-16 mx-auto mb-4 text-[var(--ink-soft)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  <p className="text-[var(--ink-soft)] mb-6">
                    Nothing here yet. A blank page is a fine place to start.
                  </p>
                  <button
                    onClick={handleNewDocument}
                    className="px-5 py-2 bg-[var(--vermilion)] text-[var(--paper)] border-[1.5px] border-[var(--ink)] rounded font-semibold shadow-hard hover:shadow-hard-lg button-lift"
                  >
                    New page
                  </button>
                </div>
              ) : (
                owned.map((doc: any) => {
                  const rotation = getCardRotation(doc.id);
                  return (
                    <a
                      key={doc.id}
                      href={`/docs/${doc.id}`}
                      className="block p-5 bg-[var(--paper)] border-[1.5px] border-[var(--ink)] rounded shadow-hard hover:shadow-hard-lg card-rotate group relative"
                      style={{ 
                        transform: `rotate(${rotation}deg)`,
                      }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-[family-name:var(--font-fraunces-loaded)] text-lg font-semibold text-[var(--ink)] flex-1 pr-4" style={{ fontVariationSettings: "'opsz' 24" }}>
                          {doc.title}
                        </h3>
                        <div className="absolute top-4 right-4">
                          <Stamp role="owner" />
                        </div>
                      </div>
                      <p className="font-[family-name:var(--font-jetbrains-loaded)] text-xs text-[var(--ink-soft)] uppercase tracking-wider">
                        edited {formatDate(doc.updatedAt)}
                      </p>
                    </a>
                  );
                })
              )}
            </div>
          </section>

          {/* Passed to me */}
          <section>
            <div className="mb-6">
              <h2 className="font-[family-name:var(--font-fraunces-loaded)] text-2xl font-semibold text-[var(--ink)] mb-1" style={{ fontVariationSettings: "'opsz' 36" }}>
                Passed to me
              </h2>
              <p className="font-[family-name:var(--font-jetbrains-loaded)] text-xs text-[var(--ink-soft)] uppercase tracking-wider">
                {shared.length} {shared.length === 1 ? 'page' : 'pages'}
              </p>
            </div>
            
            <div className="space-y-4">
              {shared.length === 0 ? (
                <div className="p-12 bg-[var(--paper)] border-[1.5px] border-[var(--ink)] rounded text-center">
                  <svg className="w-16 h-16 mx-auto mb-4 text-[var(--ink-soft)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                  </svg>
                  <p className="text-[var(--ink-soft)]">
                    Nobody's passed you anything. Yet.
                  </p>
                </div>
              ) : (
                shared.map((doc: any) => {
                  const rotation = getCardRotation(doc.id);
                  return (
                    <a
                      key={doc.id}
                      href={`/docs/${doc.id}`}
                      className="block p-5 bg-[var(--paper)] border-[1.5px] border-[var(--ink)] rounded shadow-hard hover:shadow-hard-lg card-rotate group relative"
                      style={{ 
                        transform: `rotate(${rotation}deg)`,
                      }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-[family-name:var(--font-fraunces-loaded)] text-lg font-semibold text-[var(--ink)] flex-1 pr-4" style={{ fontVariationSettings: "'opsz' 24" }}>
                          {doc.title}
                        </h3>
                        <div className="absolute top-4 right-4">
                          <Stamp role={doc.role as 'editor' | 'viewer'} />
                        </div>
                      </div>
                      <p className="font-[family-name:var(--font-jetbrains-loaded)] text-xs text-[var(--ink-soft)] uppercase tracking-wider">
                        edited {formatDate(doc.updatedAt)}
                      </p>
                    </a>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
