import React, { useState } from 'react';
import { User } from '../types.js';
import { X, ShieldCheck, Mail, Lock, User as UserIcon, Activity } from 'lucide-react';

interface LoginModalProps {
  onCheckAuth: () => void;
  onClose: () => void;
  onSuccess: (user: User, token: string) => void;
}

export default function LoginModal({ onCheckAuth, onClose, onSuccess }: LoginModalProps) {
  const [isRegister, setIsRegister] = useState(false);
  
  // Standard credentials
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'clinician' | 'patient' | 'analyst'>('clinician');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username || !password) {
      setError('Please provide all mandatory fields.');
      return;
    }
    if (isRegister && !fullName) {
      setError('Please provide your full name.');
      return;
    }

    setLoading(true);

    const url = isRegister ? '/api/auth/register' : '/api/auth/login';
    const payload = isRegister 
      ? { username, password, fullName, role }
      : { username, password };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Authentication challenge failed.');
      }

      onSuccess(data.user, data.token);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Server did not respond correctly. Verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" id="login-modal-overlay">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" 
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-md border border-slate-100" id="login-modal-content">
          
          {/* Top Decorative bar */}
          <div className="h-2 w-full bg-gradient-to-r from-blue-500 via-indigo-600 to-sky-400" />
          
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-50 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="px-6 pt-8 pb-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center bg-blue-50 text-blue-600 p-3 rounded-2xl mb-3 shadow-inner">
                <ShieldCheck className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                {isRegister ? 'Create Account' : 'Sign In'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                {isRegister
                  ? 'Access secure report analyses, save historical patient scans, and review translated clinical terms.'
                  : 'Welcome back. Access your patient records and clinician dashboard securely.'}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-800 text-xs font-semibold rounded-lg flex items-start gap-2">
                <svg className="w-4 h-4 shrink-0 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister ? (
                <>
                  <div>
                    <label htmlFor="fullName" className="block text-xs font-bold text-slate-700 tracking-wide uppercase mb-1">
                      Full Name / Title
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                        <UserIcon className="w-4 h-4 text-slate-400" />
                      </span>
                      <input
                        id="fullName"
                        type="text"
                        className="block w-full pl-10 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 transition-all font-medium"
                        placeholder="e.g. Dr. Arthur Pendelton"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="username" className="block text-xs font-bold text-slate-700 tracking-wide uppercase mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                        <Mail className="w-4 h-4 text-slate-400" />
                      </span>
                      <input
                        id="username"
                        type="email"
                        className="block w-full pl-10 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 transition-all font-medium"
                        placeholder="name@healthcare.org"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-xs font-bold text-slate-700 tracking-wide uppercase mb-1">
                      Secure Password
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                        <Lock className="w-4 h-4 text-slate-400" />
                      </span>
                      <input
                        id="password"
                        type="password"
                        className="block w-full pl-10 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 transition-all"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 tracking-wide uppercase mb-2">
                      Workplace Role
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['clinician', 'patient', 'analyst'] as const).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setRole(r)}
                          className={`py-2 px-3 text-xs font-bold rounded-lg border text-center transition-all capitalize ${
                            role === r
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label htmlFor="username" className="block text-xs font-bold text-slate-700 tracking-wide uppercase mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                        <Mail className="w-4 h-4 text-slate-400" />
                      </span>
                      <input
                        id="username"
                        type="email"
                        className="block w-full pl-10 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 transition-all font-medium"
                        placeholder="name@healthcare.org"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-xs font-bold text-slate-700 tracking-wide uppercase mb-1">
                      Secure Password
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                        <Lock className="w-4 h-4 text-slate-400" />
                      </span>
                      <input
                        id="password"
                        type="password"
                        className="block w-full pl-10 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 transition-all"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-bold text-sm tracking-wide shadow-sm hover:bg-blue-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Activity className="w-4 h-4 animate-spin text-white" />
                    <span>Processing Credentials...</span>
                  </>
                ) : (
                  <span>{isRegister ? 'Sign Up' : 'Secure Log In'}</span>
                )}
              </button>
            </form>

            <div className="border-t border-slate-100 mt-6 pt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError(null);
                }}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
              >
                {isRegister
                  ? 'Already have an account? Sign In now'
                  : "New to PranaScan? Create an account secure repository"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
