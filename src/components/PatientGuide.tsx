import React, { useState } from 'react';
import { BookOpen, ShieldAlert, CheckCircle, Brain, ArrowUpRight } from 'lucide-react';
import Suffixes3DVisualizer from './Suffixes3DVisualizer.jsx';
import Abbreviations3DVisualizer from './Abbreviations3DVisualizer.jsx';

export default function PatientGuide() {
  const [activeSuffix, setActiveSuffix] = useState<string | null>(null);
  const [activeAbbrev, setActiveAbbrev] = useState<string | null>(null);

  const suffixes = [
    { suffix: "-itis", meaning: "Inflammation or infection", example: "Gastritis (stomach lining swelling), Arthritis (joint inflammation)" },
    { suffix: "-ectomy", meaning: "Surgical removal of a body part", example: "Appendectomy (removal of appendix), Tonsillectomy (removal of tonsils)" },
    { suffix: "-otomy", meaning: "Cutting into or making an incision", example: "Laparotomy (abdominal incision), Arthrotomy (joint incision)" },
    { suffix: "-megaly", meaning: "Abnormal enlargement", example: "Cardiomegaly (enlarged heart), Hepatomegaly (enlarged liver)" },
    { suffix: "-pathy", meaning: "Disease or disorder of a system", example: "Neuropathy (nerve disorder), Cardiomyopathy (heart muscle disease)" }
  ];

  const acronyms = [
    { acronym: "PRN", meaning: 'Pro Re Nata', translation: "Take only as needed when symptoms arise" },
    { acronym: "qd / Daily", meaning: 'Quaque Die', translation: "Take once every single day" },
    { acronym: "bid", meaning: 'Bis in Die', translation: "Take twice daily, usually morning and night" },
    { acronym: "NPO", meaning: 'Nil Per Os', translation: "Do not eat or drink anything (fasting instructions)" },
    { acronym: "R.I.C.E", meaning: 'Rest, Ice, Compression, Elevation', translation: "Standard muscle or joint recovery protocol" }
  ];

  return (
    <div className="space-y-8 animate-fade-in" id="patient-guide-view">
      
      {/* Intro Hero banner */}
      <div className="bg-[#0f172a] rounded-2xl text-white p-6 md:p-8 border border-slate-800 shadow-md relative overflow-hidden" id="patient-guide-hero">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <BookOpen className="w-64 h-64 text-sky-400" />
        </div>
        <div className="max-w-2xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-1.5 bg-sky-500/20 text-[#38bdf8] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-sky-500/10">
            <BookOpen className="w-3.5 h-3.5 text-sky-400" />
            Health Literacy Empowerment Guidance
          </div>
          <h2 className="text-2.5xl font-black mt-3 tracking-tight">Understanding Your Medical Chart</h2>
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-medium">
            Clinical summaries and transcripts use specialized Latin-derived shorthand. This glossary guide is designed to clarify common clinical terminologies and prepare you for fruitful consultations with your medical providers.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Suffixes dictionary & Interactive Visualizer Panel */}
        <div className="lg:col-span-2 space-y-8" id="patient-guide-glossary-content">
          
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl relative overflow-hidden" id="suffixes-dictionary-card">
            <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
              <Brain className="w-5 h-5 text-emerald-400" />
              Deciphering Common Medical Suffixes
            </h3>
            
            <p className="text-xs text-slate-400 leading-relaxed font-semibold">
              Doctors combine root Greek or Latin words with standard suffixes to state anatomical status. Hover over any suffix item to view its corresponding interactive <strong className="text-cyan-400 font-bold">3D physiological state projection</strong>:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
              {/* Left Column: Suffix List */}
              <div className="space-y-3" id="suffixes-list-container">
                {suffixes.map((item, idx) => {
                  const isHovered = activeSuffix === item.suffix;
                  return (
                    <div 
                      key={idx} 
                      className={`p-3.5 border rounded-xl flex items-start gap-3.5 transition-all cursor-crosshair min-w-0 ${
                        isHovered 
                          ? 'bg-white border-white text-slate-950 shadow-md scale-[1.01]' 
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850/80 hover:border-slate-700'
                      }`}
                      onMouseEnter={() => setActiveSuffix(item.suffix)}
                      onMouseLeave={() => setActiveSuffix(null)}
                    >
                      <div className={`font-extrabold text-xs px-2.5 py-1.5 rounded-lg font-mono shrink-0 border transition-colors ${
                        isHovered
                          ? 'bg-cyan-100 text-cyan-950 border-cyan-200'
                          : 'bg-emerald-950/50 text-emerald-400 border-emerald-950/20'
                      }`}>
                        {item.suffix}
                      </div>
                      <div className="space-y-0.5 text-xs min-w-0 flex-1">
                        <p className={`font-extrabold transition-colors ${isHovered ? 'text-slate-950' : 'text-white'}`}>
                          {item.meaning}
                        </p>
                        <p className={`leading-relaxed text-[11px] transition-colors ${isHovered ? 'text-slate-700' : 'text-slate-400'}`}>
                          <strong className={isHovered ? 'text-slate-900' : 'text-slate-300'}>Examples:</strong> <span className="italic">{item.example}</span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right Column: Embedded 3D Biometric Suffix Visualizer */}
              <div className="flex flex-col justify-between border border-slate-800 rounded-2xl p-2.5 bg-slate-900/30 h-[310px]" id="suffixes-scanner-column">
                <div className="text-[10px] font-bold text-slate-400 px-3 pt-2 uppercase tracking-widest flex items-center justify-between border-b border-slate-800/60 pb-2">
                  <span className="text-slate-300">Somatic Spatial Scanner</span>
                  <div className="flex items-center gap-1.5 font-mono text-[9px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="text-cyan-400/90 font-bold">
                      {activeSuffix ? `ACTIVE: ${activeSuffix.toUpperCase()}` : 'STANDBY'}
                    </span>
                  </div>
                </div>
                
                {/* 3D Field Wrapper */}
                <div className="flex-1 h-[210px] relative overflow-hidden bg-slate-950/20 rounded-xl my-2 flex items-center justify-center">
                  <Suffixes3DVisualizer 
                    activeSuffix={activeSuffix} 
                    onHoverSuffix={setActiveSuffix} 
                  />
                </div>

                {/* Secure non-overlapping footer status read-out */}
                <div className="px-3 pb-1 pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[9px] font-mono text-slate-500">
                  <span className="tracking-wide">REF: PHYSIO-MATRIX</span>
                  <span className="text-cyan-400 font-bold transition-all duration-200">
                    {activeSuffix ? `Inspecting ${activeSuffix}` : 'Hover suffix item to focus 3D field'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Abbreviations & Interactive Chrono Visualizer Panel */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl relative overflow-hidden" id="abbreviations-dictionary-card">
            <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
              <BookOpen className="w-5 h-5 text-indigo-400" />
              Standard Medical Abbreviations
            </h3>

            <p className="text-xs text-slate-400 leading-relaxed font-semibold">
              Medical prescriptions and dosage schedules use classic timing codexes to dictate intake cycles. Hover rows to verify molecular <strong className="text-cyan-400 font-bold">chrono-dosage orbits</strong>:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
              {/* Left Column: Abbreviations list cards instead of narrow overlapping table */}
              <div className="space-y-3" id="abbrev-list-container">
                {acronyms.map((ac, idx) => {
                  const isHighlighted = activeAbbrev?.toLowerCase().includes(ac.acronym.toLowerCase().split(' ')[0]) || false;
                  return (
                    <div 
                      key={idx} 
                      className={`p-3.5 border rounded-xl flex items-start gap-3.5 transition-all cursor-crosshair min-w-0 ${
                        isHighlighted 
                          ? 'bg-white border-white text-slate-950 shadow-md scale-[1.01]' 
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850/80 hover:border-slate-700'
                      }`}
                      onMouseEnter={() => setActiveAbbrev(ac.acronym)}
                      onMouseLeave={() => setActiveAbbrev(null)}
                    >
                      <div className={`font-extrabold text-xs px-2.5 py-1.5 rounded-lg font-mono shrink-0 border transition-colors ${
                        isHighlighted
                          ? 'bg-indigo-100 text-indigo-950 border-indigo-250'
                          : 'bg-blue-950/50 text-blue-400 border-blue-950/20'
                      }`}>
                        {ac.acronym}
                      </div>
                      <div className="space-y-0.5 text-xs min-w-0 flex-1">
                        <p className={`font-extrabold transition-colors ${isHighlighted ? 'text-slate-950' : 'text-white'}`}>
                          {ac.translation}
                        </p>
                        <p className={`leading-relaxed text-[11px] transition-colors ${isHighlighted ? 'text-slate-700' : 'text-slate-400'}`}>
                          <strong className={isHighlighted ? 'text-slate-900' : 'text-slate-300'}>Latin Origin:</strong> <span className="italic">{ac.meaning}</span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right Column: Embedded Chrono Orbits */}
              <div className="flex flex-col justify-between border border-slate-800 rounded-2xl p-2.5 bg-slate-900/30 h-[310px]" id="abbreviations-synthesizer-column">
                <div className="text-[10px] font-bold text-slate-400 px-3 pt-2 uppercase tracking-widest flex items-center justify-between border-b border-slate-800/60 pb-2">
                  <span className="text-slate-300">Cycle Interval Synthesizer</span>
                  <div className="flex items-center gap-1.5 font-mono text-[9px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                    <span className="text-indigo-400/90 font-bold">
                      {activeAbbrev ? `SYNC: ${activeAbbrev.toUpperCase().split(' ')[0]}` : 'SCANNING'}
                    </span>
                  </div>
                </div>

                {/* 3D Field Wrapper */}
                <div className="flex-1 h-[210px] relative overflow-hidden bg-slate-950/20 rounded-xl my-2 flex items-center justify-center">
                  <Abbreviations3DVisualizer 
                    activeAbbrev={activeAbbrev} 
                  />
                </div>

                {/* Secure non-overlapping footer status read-out */}
                <div className="px-3 pb-1 pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[9px] font-mono text-slate-500">
                  <span className="tracking-wide">REF: TIMELINE-DOSAGE</span>
                  <span className="text-cyan-400 font-bold transition-all duration-200">
                    {activeAbbrev ? `Frequency: ${activeAbbrev}` : 'Syncing timeline frequencies'}
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
 
        {/* Action items and safety boundaries */}
        <div className="space-y-6" id="patient-guide-sidebar">
          <div className="bg-slate-900 text-white rounded-2xl p-5 md:p-6 space-y-4 shadow-md border border-slate-800" id="medical-ai-responsibility-card">
            <div className="inline-flex bg-amber-500/20 text-amber-300 p-2 rounded-xl">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
            </div>
            <h3 className="text-sm font-bold tracking-widest uppercase text-slate-100">
              Responsible Use of Medical AI
            </h3>
            
            <ul className="space-y-4 text-xs font-semibold text-slate-300">
              <li className="flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  <strong>Empowerment, Not Self-Treatment:</strong> Use PranaScan AI to translate complicated wording so you are informed, but do not make therapeutic adjustments or medication adjustments without consulting your provider.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  <strong>Prepare Clinic Logs:</strong> Jot down the suggested provider questions and present them to your doctor. It maximizes the effectiveness of your clinical consultation.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  <strong>Clinical Disclaimers:</strong> Remember that AI algorithms cannot inspect your physical body, look at active tissue directly, or run physical tests. Full confirmation rests with medical practitioners.
                </span>
              </li>
            </ul>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 md:p-6 space-y-3" id="patient-guide-tip-card">
            <h4 className="text-xs font-bold text-emerald-950 tracking-wider uppercase">
              Important Tip
            </h4>
            <p className="text-xs text-emerald-900 leading-relaxed font-semibold">
              Bring a companion to complex clinical visits or consults, if possible. They can help record clinician inputs while you discuss the generated report annotations together.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
