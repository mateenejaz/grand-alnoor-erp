'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function Home() {
  // State variables to track whether the connection succeeded and any error messages
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'success' | 'error'>('testing');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    // An internal helper function that runs a test query against Supabase
    async function testSupabaseConnection() {
      try {
        // Attempt to fetch any settings or schema data from Supabase to verify credentials
        const { error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        // If no error occurred, the handshake was successful
        setConnectionStatus('success');
      } catch (err: any) {
        // If something goes wrong, capture the error to show on screen
        setConnectionStatus('error');
        setErrorMessage(err?.message || 'Unknown configuration error');
      }
    }

    testSupabaseConnection();
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6">
      <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100 max-w-md w-full">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Grand Alnoor ERP
        </h1>
        
        <div className="mt-6 pt-6 border-t border-gray-100">
          {connectionStatus === 'testing' && (
            <p className="text-lg text-amber-500 font-medium animate-pulse">
              Testing connection to Supabase...
            </p>
          )}

          {connectionStatus === 'success' && (
            <p className="text-lg text-emerald-600 font-medium">
              ✓ Connected to Supabase successfully
            </p>
          )}

          {connectionStatus === 'error' && (
            <div className="bg-red-50 p-4 rounded-xl border border-red-100">
              <p className="text-lg text-red-600 font-medium">
                ✕ Connection Failed
              </p>
              <p className="mt-2 text-sm text-red-500 font-mono break-words">
                {errorMessage}
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}