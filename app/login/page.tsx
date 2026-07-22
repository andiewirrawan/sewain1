'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, LogIn, AlertCircle } from 'lucide-react';
import { apiFetch } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await apiFetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Login gagal');
      }

      try {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      } catch (e) {
        console.warn('localStorage not accessible', e);
      }
      
      // Set cookie for middleware
      document.cookie = `token=${data.token}; path=/; max-age=86400; SameSite=Strict`;
      
      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-8 text-center bg-slate-50 border-b border-slate-100">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
              <Building2 className="text-white" size={24} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">SEWAIN</h1>
            <p className="text-slate-500 text-sm mt-1 uppercase tracking-widest font-semibold">Property Management</p>
          </div>

          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="flex items-center gap-3 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400"
                  placeholder="name@example.com"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <>
                    <LogIn size={20} />
                    SIGN IN
                  </>
                )}
              </button>
            </form>
          </div>
          
          <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400 font-medium">Sistem Informasi Sewa Unit © 2026</p>
          </div>
        </div>
      </div>
    </div>
  );
}
