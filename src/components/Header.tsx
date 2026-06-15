import React from 'react';
import { User, ActiveTab } from '../types.js';
import { ShieldAlert, LogOut, Clock, Layers, FileText, UserCheck, HelpCircle, HeartPulse, Dna } from 'lucide-react';

interface HeaderProps {
  user: User | null;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onLogout: () => void;
  onOpenLogin: () => void;
}

export default function Header({ user, activeTab, setActiveTab, onLogout, onOpenLogin }: HeaderProps) {
  // Navigation item specs
  const navItems = [
    { id: 'analyze' as ActiveTab, label: 'Report Analyzer', icon: FileText },
    { id: 'diagnose' as ActiveTab, label: 'Symptom Diagnostics', icon: HeartPulse },
    { id: 'projection' as ActiveTab, label: '3D Bio-Projection', icon: Dna },
    { id: 'presets' as ActiveTab, label: 'Sample Datasets', icon: Layers },
    { id: 'history' as ActiveTab, label: 'Report History', icon: Clock },
    { id: 'guide' as ActiveTab, label: 'Patient Guide', icon: HelpCircle },
  ];

  return (
    <>
      {/* 1. DESKTOP SIDEBAR PANEL (>= md) */}
      <aside className="hidden md:flex flex-col w-64 bg-[#0f172a] text-[#f1f5f9] h-screen border-r border-[#1e293b] p-6 shrink-0 fixed left-0 top-0 z-30" id="desktop-sidebar">
        {/* Brand Logo with exact styling & immersive 3D volumetric parallax effect */}
        <div className="flex items-center gap-4 text-lg font-bold tracking-tight text-[#38bdf8] mb-12" id="desktop-brand">
          {/* Embedding 3D keyframe styles specifically for the brand logo */}
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes local-orbit-outer {
              0% { transform: rotateX(65deg) rotateY(45deg) rotateZ(0deg); }
              100% { transform: rotateX(65deg) rotateY(45deg) rotateZ(360deg); }
            }
            @keyframes local-orbit-inner {
              0% { transform: rotateX(-45deg) rotateY(65deg) rotateZ(360deg); }
              100% { transform: rotateX(-45deg) rotateY(65deg) rotateZ(0deg); }
            }
          `}} />

          {/* 3D Kinetic Orbital Logo sphere */}
          <div className="relative w-9 h-9 shrink-0" style={{ perspective: '200px' }} id="logo-3d-sphere">
            <div className="absolute inset-0 w-full h-full" style={{ transformStyle: 'preserve-3d' }}>
              {/* Outer Cyan Ring */}
              <div 
                className="absolute inset-0 border-[2px] border-cyan-400 rounded-full opacity-80"
                style={{ 
                  animation: 'local-orbit-outer 5s linear infinite',
                  transformStyle: 'preserve-3d'
                }} 
              />
              {/* Inner Emerald Ring */}
              <div 
                className="absolute inset-1.5 border-[1.5px] border-emerald-400 rounded-full opacity-70"
                style={{ 
                  animation: 'local-orbit-inner 3.5s linear infinite',
                  transformStyle: 'preserve-3d'
                }} 
              />
              {/* Core Nucleus */}
              <div className="absolute inset-3 bg-gradient-to-tr from-cyan-400 to-indigo-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(56,189,248,0.7)] flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
              </div>
            </div>
          </div>

          <div className="leading-tight">
            <span 
              className="block font-black text-white hover:text-cyan-300 transition-all duration-300 tracking-wider text-[17px]"
              style={{
                textShadow: '0 1px 0 #0284c7, 0 2px 0 #0369a1, 0 3px 0 #1e3a8a, 0 4px 6px rgba(0,0,0,0.6)'
              }}
            >
              PRANASCAN
            </span>
            <span className="block text-[9px] tracking-[0.16em] text-cyan-400/80 font-mono font-bold uppercase mt-0.5">HEALTH SCAN PLATFORM</span>
          </div>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 space-y-1.5" id="desktop-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-sm transition-all duration-150 text-left ${
                  isActive
                    ? 'bg-[#1e293b] text-[#38bdf8] font-bold border-l-4 border-[#38bdf8]'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-[#1e293b]/40 font-medium'
                }`}
                id={`desktop-nav-${item.id}`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#38bdf8]' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom User Display Area */}
        <div className="mt-auto pt-6 border-t border-[#1e293b]" id="desktop-user-pane">
          {user ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-2 rounded-xl bg-[#1e293b]/40">
                <div className="w-9 h-9 rounded-full bg-[#38bdf8] text-[#0f172a] font-extrabold flex items-center justify-center text-sm shrink-0">
                  {user.fullName.substring(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 text-left w-full overflow-hidden">
                  <p className="text-xs font-bold text-white truncate">{user.fullName}</p>
                  <p className="text-[10px] text-slate-400 capitalize font-mono leading-none mt-1">{user.role}</p>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-red-950 bg-red-950/25 text-red-300 hover:bg-red-900/40 hover:text-red-200 text-xs font-bold transition-all cursor-pointer"
                id="desktop-logout-btn"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out Securely
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="w-full bg-[#38bdf8] text-[#0f172a] hover:bg-[#0284c7] hover:text-white py-2.5 px-4 rounded-lg text-xs font-bold tracking-wide transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              id="desktop-login-button"
            >
              <UserCheck className="w-4 h-4" />
              Sign In / Establish Vault
            </button>
          )}
        </div>
      </aside>

      {/* 2. MOBILE TOP NAVIGATION (< md) */}
      <header className="md:hidden sticky top-0 z-40 w-full bg-white border-b border-slate-200 shadow-xs" id="mobile-header">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Mobile 3D mini orbital */}
            <div className="relative w-7 h-7 shrink-0" style={{ perspective: '150px' }} id="mobile-logo-3d-sphere">
              <div className="absolute inset-0 w-full h-full" style={{ transformStyle: 'preserve-3d' }}>
                <div 
                  className="absolute inset-0 border-[1.5px] border-sky-600 rounded-full opacity-80"
                  style={{ 
                    animation: 'local-orbit-outer 6s linear infinite',
                    transformStyle: 'preserve-3d'
                  }} 
                />
                <div 
                  className="absolute inset-1 border-[1px] border-emerald-600 rounded-full opacity-70"
                  style={{ 
                    animation: 'local-orbit-inner 4s linear infinite',
                    transformStyle: 'preserve-3d'
                  }} 
                />
                <div className="absolute inset-2 bg-gradient-to-tr from-sky-600 to-indigo-700 rounded-full shadow-[0_0_6px_rgba(2,132,199,0.5)] flex items-center justify-center">
                  <div className="w-1 h-1 bg-white rounded-full" />
                </div>
              </div>
            </div>

            <div className="leading-none">
              <h1 
                className="text-sm font-black tracking-wider text-slate-900"
                style={{
                  textShadow: '0 1px 0 #cbd5e1, 0 1px 1px rgba(0,0,0,0.15)'
                }}
              >
                PRANASCAN
              </h1>
              <span className="block text-[8px] tracking-widest text-[#0284c7] font-mono font-bold uppercase mt-0.5">SCAN AI</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <button
                onClick={onLogout}
                className="p-2 text-slate-500 hover:text-red-600 rounded-lg"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onOpenLogin}
                className="bg-slate-900 text-white hover:bg-slate-800 text-[10px] px-2.5 py-1.5 rounded-md font-bold transition-colors"
              >
                Sign In
              </button>
            )}
          </div>
        </div>

        {/* Mobile quick tab controls - horizontal scrollable row */}
        <div className="flex items-center justify-around border-t border-slate-100 bg-slate-50/80 backdrop-blur-xs px-2 py-1.5 overflow-x-auto text-[11px] gap-1 scrollbar-none" id="mobile-tabs">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex-1 min-w-[76px] py-1.5 px-2 rounded-md font-bold text-center flex flex-col items-center gap-0.5 transition-all ${
                  isActive
                    ? 'bg-[#1e293b] text-[#38bdf8]'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                id={`mobile-nav-${item.id}`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[9px] truncate">{item.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </header>
    </>
  );
}
