import React from 'react';
import { MEDICAL_SAMPLES, MedicalSample } from '../data/samples.js';
import { Layers, FileText, Heart, Activity, Scissors, Calendar, UserCheck } from 'lucide-react';

interface PresetSelectorProps {
  onSelect: (sample: MedicalSample) => void;
  onNavigateToAnalyze: () => void;
}

export default function PresetSelector({ onSelect, onNavigateToAnalyze }: PresetSelectorProps) {

  const getSpecialtyIcon = (specialty: string) => {
    switch (specialty.toLowerCase()) {
      case 'cardiology':
        return <Heart className="w-5 h-5 text-rose-400 animate-pulse" />;
      case 'orthopedics':
        return <Activity className="w-5 h-5 text-emerald-400" />;
      case 'gastroenterology':
        return <Layers className="w-5 h-5 text-amber-400" />;
      case 'general surgery':
        return <Scissors className="w-5 h-5 text-indigo-400" />;
      default:
        return <FileText className="w-5 h-5 text-cyan-400" />;
    }
  };

  const getSpecialtyBadgeColor = (specialty: string) => {
    switch (specialty.toLowerCase()) {
      case 'cardiology':
        return 'bg-rose-950/40 text-rose-400 border border-rose-900/40';
      case 'orthopedics':
        return 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/40';
      case 'gastroenterology':
        return 'bg-amber-950/40 text-amber-400 border border-amber-900/40';
      case 'general surgery':
        return 'bg-indigo-950/40 text-indigo-400 border border-indigo-900/40';
      default:
        return 'bg-cyan-950/40 text-cyan-400 border border-cyan-900/40';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="preset-selector-container">
      <div className="bg-gradient-to-br from-[#0f172a] via-[#090d1a] to-[#040815] rounded-3xl text-white p-6 md:p-8 border-2 border-slate-800 shadow-2xl relative overflow-hidden text-left">
        <div className="absolute inset-0 bg-[radial-gradient(#0891b2_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-15 pointer-events-none" />
        <div className="absolute -right-16 -bottom-16 opacity-10 pointer-events-none text-cyan-500">
          <Layers className="w-72 h-72 animate-pulse" />
        </div>
        <div className="max-w-2xl relative z-10">
          <span className="bg-cyan-500/20 text-[#3aebff] px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border border-cyan-500/20">
            Clinical Datasets
          </span>
          <h2 className="text-2xl font-black mt-3 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-cyan-300">Kaggle Medical Transcription Presets</h2>
          <p className="text-xs md:text-sm text-slate-300 mt-2 font-medium leading-relaxed">
            Test the advanced NLP engine instantly. Load pre-curated anonymous transcripts, clinical logs, and surgical discharge summaries to see how PranaScan translates complex clinical jargon and extracts medical insights.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={onNavigateToAnalyze}
              className="bg-cyan-500 text-[#070a13] hover:bg-cyan-400 px-5 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-cyan-500/10 transition-all hover:scale-[1.02] cursor-pointer"
            >
              Paste Custom Report
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="presets-grid">
        {MEDICAL_SAMPLES.map((sample) => (
          <div
            key={sample.id}
            className="group bg-slate-950/70 hover:bg-slate-950/95 border-2 border-slate-850 hover:border-cyan-500/50 rounded-2xl shadow-xl hover:shadow-cyan-950/20 transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer"
            onClick={() => onSelect(sample)}
            id={`preset-card-${sample.id}`}
          >
            <div>
              {/* Header card indicator */}
              <div className="p-4 border-b border-slate-900 flex items-center justify-between bg-[#040815]/70">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 shadow-inner">
                    {getSpecialtyIcon(sample.specialty)}
                  </div>
                  <div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border tracking-wider ${getSpecialtyBadgeColor(sample.specialty)}`}>
                      {sample.specialty}
                    </span>
                  </div>
                </div>
                <div className="text-right text-[10px] text-slate-400 font-extrabold flex items-center gap-1.5 bg-slate-900 border border-slate-800 py-1 px-2.5 rounded-md shadow-inner">
                  <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{sample.gender}, {sample.age} yrs</span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 space-y-4 text-left">
                <h3 className="text-sm font-black text-slate-100 group-hover:text-cyan-400 transition-colors leading-snug">
                  {sample.title}
                </h3>
                <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1.5 uppercase tracking-wider">
                  <Calendar className="w-3.5 h-3.5 text-slate-550" />
                  Report Dated: {sample.date}
                </p>
                
                {/* Vitals snapshot */}
                {sample.vitals && (
                  <div className="bg-[#030712]/50 p-3 rounded-lg border border-slate-900 flex items-center justify-between text-[11px] font-semibold text-slate-400">
                    <div>BP: <span className="text-cyan-400 font-black">{sample.vitals.bp || 'N/A'}</span></div>
                    <div className="h-3 w-px bg-slate-850" />
                    <div>HR: <span className="text-cyan-400 font-black">{sample.vitals.hr || 'N/A'} bpm</span></div>
                    <div className="h-3 w-px bg-slate-850" />
                    <div>SpO₂: <span className="text-cyan-400 font-black">{sample.vitals.spo2 || 'N/A'}%</span></div>
                  </div>
                )}

                <div className="relative">
                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed font-normal italic bg-slate-900/60 p-3 rounded-lg border border-dashed border-slate-850 select-all">
                    {sample.rawText}
                  </p>
                  <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />
                </div>
              </div>
            </div>

            {/* CTA bottom card bar */}
            <div className="p-4 bg-[#040815]/90 border-t border-slate-900 text-center flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Kaggle File: #{sample.id}</span>
              <button
                type="button"
                className="bg-gradient-to-r from-cyan-600 to-indigo-600 group-hover:from-cyan-500 group-hover:to-indigo-500 text-white hover:tracking-wide transition-all shadow-md px-4 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 cursor-pointer border border-cyan-500/10"
              >
                Load Preset Report
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
