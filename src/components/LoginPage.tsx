import React, { useState } from 'react';
import { User } from '../types.js';
import { ShieldCheck, Mail, Lock, User as UserIcon, Activity, HeartPulse, Sparkles } from 'lucide-react';
import { registerWithFirebase, loginWithFirebase, loginWithGoogle } from '../lib/firebase.js';

interface LoginPageProps {
  onSuccess: (user: User, token: string) => void;
}

export default function LoginPage({ onSuccess }: LoginPageProps) {
  const [isRegister, setIsRegister] = useState(false);
  
  // Standard credentials
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'clinician' | 'patient' | 'analyst'>('clinician');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const { profile, idToken } = await loginWithGoogle();
      onSuccess({
        id: profile.uid,
        username: profile.email,
        fullName: profile.fullName,
        role: profile.role
      }, idToken);
    } catch (err: any) {
      setError(err.message || 'Google Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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

    try {
      if (isRegister) {
        const { profile, idToken } = await registerWithFirebase(username, password, fullName, role);
        onSuccess({
          id: profile.uid,
          username: profile.email,
          fullName: profile.fullName,
          role: profile.role
        }, idToken);
      } else {
        const { profile, idToken } = await loginWithFirebase(username, password);
        onSuccess({
          id: profile.uid,
          username: profile.email,
          fullName: profile.fullName,
          role: profile.role
        }, idToken);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden font-sans select-none" id="clinical-login-page">
      {/* Immersive 3D/Kinetic Background elements */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1.2px,transparent_1.2px)] [background-size:24px_24px] opacity-35 pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Embedded local keyframes for spinning orbits and slow Ken Burns background image motion */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes orbit-outer {
          0% { transform: rotateX(65deg) rotateY(45deg) rotateZ(0deg); }
          100% { transform: rotateX(65deg) rotateY(45deg) rotateZ(360deg); }
        }
        @keyframes orbit-inner {
          0% { transform: rotateX(-45deg) rotateY(65deg) rotateZ(360deg); }
          100% { transform: rotateX(-45deg) rotateY(65deg) rotateZ(0deg); }
        }
        @keyframes slow-pan-zoom {
          0% { transform: scale(1.05) translate(0, 0); }
          50% { transform: scale(1.18) translate(-1.5%, 1%); }
          100% { transform: scale(1.05) translate(0, 0); }
        }
      `}} />

      {/* Immersive slow animating raw background image - fully visible */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <img
          src="https://raw.githubusercontent.com/jkbharti159/Patriotic-images/main/MIT-IBM%20Watson%20AI%20Lab_%20Smarter%2C%20Leaner%20AI%20Built%20for%20Real%20Business%20Results.jpeg"
          alt="MIT-IBM Watson AI Lab background decoration"
          className="w-full h-full object-cover opacity-100 select-none"
          style={{
            animation: 'slow-pan-zoom 40s ease-in-out infinite',
          }}
          referrerPolicy="no-referrer"
        />
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-0 bg-slate-950/50 border border-white/15 rounded-3xl overflow-hidden shadow-2xl relative z-10 backdrop-blur-2xl">
        
        {/* Left Interactive Promo Side (Hidden on small mobile screens to keep layout clean) */}
        <div className="hidden md:flex md:col-span-5 bg-slate-950/30 p-8 flex-col justify-between border-r border-white/10 relative">
          <div className="absolute inset-0 bg-radial-gradient from-cyan-500/5 to-transparent pointer-events-none" />
          
          {/* Top Brand Block */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {/* 3D Kinetic Orbital logo */}
              <div className="relative w-10 h-10 shrink-0" style={{ perspective: '200px' }}>
                <div className="absolute inset-0 w-full h-full" style={{ transformStyle: 'preserve-3d' }}>
                  <div 
                    className="absolute inset-0 border-2 border-cyan-400 rounded-full opacity-85"
                    style={{ animation: 'orbit-outer 5s linear infinite', transformStyle: 'preserve-3d' }} 
                  />
                  <div 
                    className="absolute inset-2 border-[1.5px] border-emerald-400 rounded-full opacity-70"
                    style={{ animation: 'orbit-inner 3.5s linear infinite', transformStyle: 'preserve-3d' }} 
                  />
                  <div className="absolute inset-3.5 bg-gradient-to-tr from-cyan-400 to-indigo-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(56,189,248,0.7)] flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  </div>
                </div>
              </div>
              <div>
                <span className="block font-black text-white text-base tracking-wider uppercase">PranaScan</span>
                <span className="block text-[8px] font-mono font-bold tracking-widest text-cyan-400">CLINICAL SUITE</span>
              </div>
            </div>

            <div className="space-y-1 pt-6">
              <h2 className="text-lg font-black text-white tracking-tight leading-snug">The Clinician's Semantic Decrypter</h2>
              <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                Unlock the cloud-integrated sandbox analyzer. Translate medical reports, evaluate biomarker segments, and safely archive patient histories in a private, secure workspace.
              </p>
            </div>
          </div>

          {/* Quick features checklist */}
          <div className="space-y-4 pt-8">
            <div className="flex items-start gap-2.5">
              <div className="p-1 bg-cyan-950/60 border border-cyan-800/30 rounded-lg text-cyan-400 shrink-0">
                <HeartPulse className="w-3.5 h-3.5" />
              </div>
              <p className="text-[10px] text-slate-300 font-semibold leading-tight">Multimodal PDF/Image diagnostic report scans</p>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="p-1 bg-cyan-950/60 border border-cyan-800/30 rounded-lg text-cyan-400 shrink-0">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <p className="text-[10px] text-slate-300 font-semibold leading-tight">Fully certified secure, end-to-end encrypted storage vaults</p>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="p-1 bg-cyan-950/60 border border-cyan-800/30 rounded-lg text-cyan-400 shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <p className="text-[10px] text-slate-300 font-semibold leading-tight">Automatic AI diagnostic classifications and jargon glossaries</p>
            </div>
          </div>

          {/* Footer security tag */}
          <div className="text-[9px] font-mono text-slate-600 font-bold uppercase tracking-widest pt-8 border-t border-slate-900">
            Secure Platform Gateway v3.5
          </div>
        </div>

        {/* Right Active Form Side */}
        <div className="col-span-1 md:col-span-7 p-6 md:p-10 flex flex-col justify-center bg-transparent">
          
          {/* Logo element for small mobile viewports only */}
          <div className="flex md:hidden items-center gap-3 mb-6 justify-center">
            <div className="relative w-8 h-8 shrink-0" style={{ perspective: '150px' }}>
              <div className="absolute inset-0 w-full h-full" style={{ transformStyle: 'preserve-3d' }}>
                <div 
                  className="absolute inset-0 border-[1.5px] border-cyan-400 rounded-full opacity-80"
                  style={{ animation: 'orbit-outer 5s linear infinite', transformStyle: 'preserve-3d' }} 
                />
                <div className="absolute inset-2 bg-gradient-to-tr from-cyan-400 to-indigo-500 rounded-full animate-pulse flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                </div>
              </div>
            </div>
            <div>
              <span className="block font-black text-white text-sm tracking-wider uppercase">PranaScan</span>
              <span className="block text-[7px] font-mono font-bold tracking-widest text-cyan-400">CLINICAL SUITE</span>
            </div>
          </div>

          <div className="max-w-md w-full mx-auto space-y-6">
            <div className="space-y-1.5 text-center md:text-left">
              <h3 className="text-xl font-extrabold text-white tracking-tight">
                {isRegister ? 'Register Healthcare Identity' : 'Clinical Portal Access'}
              </h3>
              <p className="text-xs text-slate-400 font-semibold">
                {isRegister 
                  ? 'Establish your secure local clinical sandbox account and database archive.' 
                  : 'Enter your credentials or secure token to deploy clinical analytics.'}
              </p>
            </div>

            {error && (
              <div className="p-3.5 bg-rose-950/40 border border-rose-900/40 text-rose-200 text-xs font-semibold rounded-2xl flex items-start gap-2.5 animate-fade-in">
                <svg className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <div>
                  <label htmlFor="reg-fullName" className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1.5">
                    Full Name / Medical Title
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                      <UserIcon className="w-4 h-4" />
                    </span>
                    <input
                      id="reg-fullName"
                      type="text"
                      className="block w-full pl-11 pr-4 py-2.5 text-xs bg-slate-950/40 border border-slate-800 rounded-xl focus:bg-slate-950 focus:outline-hidden focus:border-cyan-500 focus:ring-2 focus:ring-cyan-950 text-slate-100 transition-all font-bold placeholder:text-slate-650"
                      placeholder="e.g. Dr. Arthur Pendelton"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="email-address" className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1.5">
                  Secure Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    id="email-address"
                    type="email"
                    className="block w-full pl-11 pr-4 py-2.5 text-xs bg-slate-950/40 border border-slate-800 rounded-xl focus:bg-slate-950 focus:outline-hidden focus:border-cyan-500 focus:ring-2 focus:ring-cyan-950 text-slate-100 transition-all font-bold placeholder:text-slate-650"
                    placeholder="clinician@healthtech.org"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="secure-password" className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1.5">
                  Portal Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    id="secure-password"
                    type="password"
                    className="block w-full pl-11 pr-4 py-2.5 text-xs bg-slate-950/40 border border-slate-800 rounded-xl focus:bg-slate-950 focus:outline-hidden focus:border-cyan-500 focus:ring-2 focus:ring-cyan-950 text-slate-100 transition-all font-bold placeholder:text-slate-650"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {isRegister && (
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">
                    Specialist Role / Permission Scope
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['clinician', 'patient', 'analyst'] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`py-2 px-1 text-[10px] font-bold rounded-lg border text-center uppercase tracking-wide transition-all ${
                          role === r
                            ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 shadow-[0_0_12px_rgba(34,211,238,0.15)]'
                            : 'bg-slate-950/40 text-slate-500 border-slate-800/80 hover:bg-slate-900/60'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white py-3 rounded-xl font-bold text-xs tracking-wider uppercase shadow-lg hover:shadow-cyan-500/15 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer border border-cyan-400/20"
              >
                {loading ? (
                  <>
                    <Activity className="w-4 h-4 animate-spin text-white shrink-0" />
                    <span>Transmitting clinical logs...</span>
                  </>
                ) : (
                  <span>{isRegister ? 'Authorize Sign Up' : 'Secure Clinical Login'}</span>
                )}
              </button>

              <div className="relative my-4 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <span className="relative bg-slate-900/70 border border-white/10 px-3.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400 shadow-sm backdrop-blur-xs">
                  or authenticate with
                </span>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2.5 bg-slate-950/40 hover:bg-slate-950/80 border border-slate-800 text-slate-300 hover:text-white py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase transition-colors cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                <span>Google Clinician Account</span>
              </button>
            </form>

            <div className="border-t border-slate-900 mt-6 pt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError(null);
                }}
                className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                {isRegister
                  ? 'Already have an authorized clinician ID? Sign In'
                  : "New clinician? Request database sandbox credentials"}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
