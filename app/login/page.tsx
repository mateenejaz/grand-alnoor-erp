'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Loader2, Lock } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Fallback strings prevent the 500 Server Error crash if variables are missing
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_key';

  const supabase = createBrowserClient(supabaseUrl, supabaseKey);

  useEffect(() => {
    // If the fallbacks are being used, display a clean warning on the UI
    if (supabaseUrl === 'https://placeholder.supabase.co') {
      setError('System Error: Database connection keys are missing from the Vercel environment.');
    }
  }, [supabaseUrl]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (supabaseUrl === 'https://placeholder.supabase.co') {
      setError('Cannot log in: Database connection is not configured.');
      setIsLoading(false);
      return;
    }

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      router.push('/dashboard');
      router.refresh();
      
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        
        <div className="bg-[#1F3864] p-8 text-center">
          <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-white">Grand Alnoor ERP</h1>
          <p className="text-[#B8860B] font-semibold text-sm mt-2 tracking-wide uppercase">Command Center Login</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm font-semibold rounded-lg text-center border border-red-100">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#1F3864]/20 focus:border-[#1F3864] transition-all"
                placeholder="admin@grandalnoor.com"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#1F3864]/20 focus:border-[#1F3864] transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#B8860B] hover:bg-[#986f08] text-white font-bold py-3 px-4 rounded-xl shadow-md transition-colors flex justify-center items-center gap-2 mt-2"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Secure Sign In'}
            </button>
          </form>
        </div>
        
      </div>
    </div>
  );
}
// Version 1.0.1 - Live Production Deployment