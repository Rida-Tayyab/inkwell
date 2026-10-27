'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const DEMO_USERS = [
  { email: 'alice@demo.com', name: 'Alice', role: 'Owner of demo doc' },
  { email: 'bob@demo.com', name: 'Bob', role: 'Editor on demo doc' },
  { email: 'carol@demo.com', name: 'Carol', role: 'Viewer on demo doc' },
];

const DEMO_PASSWORD = 'demo';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error?.message || 'Login failed');
        return;
      }

      router.push('/');
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function quickLogin(userEmail: string) {
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, password: DEMO_PASSWORD }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error?.message || 'Login failed');
        return;
      }

      router.push('/');
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--desk)] flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
        {/* Left: Branding */}
        <div className="text-center lg:text-left">
          <h1 className="font-[family-name:var(--font-fraunces-loaded)] text-6xl lg:text-7xl font-bold text-[var(--ink)] mb-4" style={{ fontVariationSettings: "'opsz' 72" }}>
            Inkwell
          </h1>
          <p className="text-xl text-[var(--ink-soft)] max-w-md mx-auto lg:mx-0">
            A print shop for your words. Write, share, and collaborate with the simplicity of paper and ink.
          </p>
        </div>

        {/* Right: Press Pass Cards */}
        <div className="space-y-4">
          <div className="mb-6">
            <h2 className="font-[family-name:var(--font-fraunces-loaded)] text-2xl font-semibold text-[var(--ink)] mb-2">
              Demo Access
            </h2>
            <p className="font-[family-name:var(--font-jetbrains-loaded)] text-sm text-[var(--ink-soft)] uppercase tracking-wide">
              Password: <span className="text-[var(--vermilion)]">{DEMO_PASSWORD}</span>
            </p>
          </div>

          {DEMO_USERS.map((user) => (
            <button
              key={user.email}
              onClick={() => quickLogin(user.email)}
              disabled={loading}
              className="w-full text-left p-6 bg-[var(--paper)] border-[1.5px] border-[var(--ink)] rounded shadow-hard hover:shadow-hard-lg button-lift disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-[family-name:var(--font-fraunces-loaded)] text-xl font-semibold text-[var(--ink)]">
                  {user.name}
                </h3>
                <svg className="w-5 h-5 text-[var(--ink-soft)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <p className="text-sm text-[var(--ink-soft)] mb-1">{user.role}</p>
              <p className="font-[family-name:var(--font-jetbrains-loaded)] text-xs text-[var(--ink-soft)] uppercase tracking-wide">
                {user.email}
              </p>
            </button>
          ))}

          {error && (
            <div className="p-4 bg-[var(--paper)] border-[1.5px] border-[var(--vermilion)] rounded">
              <p className="text-sm text-[var(--vermilion)] font-medium">{error}</p>
            </div>
          )}

          <div className="pt-6 border-t border-[var(--rule)]">
            <p className="text-sm text-[var(--ink-soft)] text-center">
              Or sign in with custom credentials
            </p>
            <form onSubmit={handleLogin} className="mt-4 space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full px-4 py-2.5 bg-[var(--paper)] border-[1.5px] border-[var(--ink)] rounded text-[var(--ink)] placeholder:text-[var(--ink-soft)]"
                required
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-4 py-2.5 bg-[var(--paper)] border-[1.5px] border-[var(--ink)] rounded text-[var(--ink)] placeholder:text-[var(--ink-soft)]"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2.5 bg-[var(--vermilion)] text-[var(--paper)] border-[1.5px] border-[var(--ink)] rounded font-semibold shadow-hard hover:shadow-hard-lg button-lift disabled:opacity-50"
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
