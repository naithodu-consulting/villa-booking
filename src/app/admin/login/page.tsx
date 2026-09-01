'use client';

import React, { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Lock, AlertCircle, Loader2 } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next') ?? '/admin/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError('Invalid email or password. Please try again.');
      setIsLoading(false);
      return;
    }

    router.push(nextPath);
    router.refresh();
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div>
        <label className="text-xs font-bold text-[#4A5568] block mb-1" htmlFor="email">
          Admin Email
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@villamangalore.com"
          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-500"
        />
      </div>

      <div>
        <label className="text-xs font-bold text-[#4A5568] block mb-1" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••••••"
          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-500"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2.5 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="btn-primary w-full py-3.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
      >
        {isLoading
          ? <><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Signing in…</>
          : <><Lock className="w-4 h-4" aria-hidden="true" /> Sign In to Dashboard</>
        }
      </button>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full glass-panel p-8 rounded-3xl border border-slate-800 space-y-6 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-amber-500 text-slate-950 font-black rounded-2xl flex items-center justify-center mx-auto text-xl shadow-xl shadow-amber-500/20">
            V
          </div>
          <h1 className="text-2xl font-black text-[#562424]">Admin Portal</h1>
          <p className="text-xs text-[#6B7A8A]">Villa Booking &amp; Property Management</p>
        </div>

        <Suspense fallback={<div className="h-40 flex items-center justify-center text-slate-400 text-xs">Loading…</div>}>
          <LoginForm />
        </Suspense>

        <div className="text-center pt-2 border-t border-[rgba(0,0,0,0.09)]">
          <a href="/" className="text-xs font-semibold text-[#6B7A8A] hover:text-[#A87432] transition-colors">
            ← Return to Guest View
          </a>
        </div>
      </div>
    </main>
  );
}
