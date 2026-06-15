import React, { useState } from 'react';
import { AnalysisResult } from '../types.js';
import { 
  Heart, ShieldAlert, BadgeCheck, FileText, ArrowLeft, Printer, Share2, HelpCircle, 
  Sparkles, Stethoscope, Pill, ClipboardList, Activity, ChevronRight, CheckSquare, Square,
  Languages, Volume2, VolumeX, Play, Pause, Loader2
} from 'lucide-react';
import Medical3DVisualizer from './Medical3DVisualizer.jsx';

interface ReportViewerProps {
  analysis: AnalysisResult;
  rawText: string;
  metadata?: {
    patientName?: string;
    age?: number;
    gender?: string;
    title?: string;
    date?: string;
  };
  onBack: () => void;
  savedLocally?: boolean;
}

export default function ReportViewer({ analysis, rawText, metadata, onBack, savedLocally }: ReportViewerProps) {
  const [selectedJargon, setSelectedJargon] = useState<string | null>(null);
  const [checkedMeds, setCheckedMeds] = useState<Record<string, boolean>>({});
  const [checkedProcs, setCheckedProcs] = useState<Record<string, boolean>>({});

  // Translation and Voice states
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [translatedText, setTranslatedText] = useState<string>('');
  const [translating, setTranslating] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  React.useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const translateToHindi = async () => {
    if (translatedText) {
      setLanguage('hi');
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
      return;
    }
    setTranslating(true);
    setTranslationError(null);
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: analysis.patientFriendlySummary
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Translation to Hindi failed');
      }
      setTranslatedText(data.translatedText);
      setLanguage('hi');
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    } catch (err: any) {
      setTranslationError('Could not connect to Translation Engine.');
    } finally {
      setTranslating(false);
    }
  };

  const handleSpeak = () => {
    if (isSpeaking && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      return;
    }

    if (isSpeaking && isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      return;
    }

    const textToRead = language === 'hi' ? translatedText : analysis.patientFriendlySummary;
    if (!textToRead) return;

    window.speechSynthesis.cancel();
    const cleanText = textToRead.replace(/[*#`_-]/g, ' ');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = language === 'hi' ? 'hi-IN' : 'en-US';

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    setIsSpeaking(true);
    setIsPaused(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleStopSpeech = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  };


  const toggleMed = (medName: string) => {
    setCheckedMeds(prev => ({ ...prev, [medName]: !prev[medName] }));
  };

  const toggleProc = (procName: string) => {
    setCheckedProcs(prev => ({ ...prev, [procName]: !prev[procName] }));
  };

  const pName = metadata?.patientName || "Anonymous Patient";
  const pAge = metadata?.age || 35;
  const pGender = metadata?.gender || "Other";
  const pTitle = metadata?.title || `${analysis.specialtyClassification} Patient Report`;
  const pDate = metadata?.date || new Date().toISOString().split('T')[0];

  // Helper for severity ratings styling
  const getSeverityStyles = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'urgent':
        return {
          bg: 'bg-red-50 border-red-200',
          text: 'text-red-900',
          badge: 'bg-red-650 text-red-700 border-red-200',
          badgeText: 'Urgent Intervention Requested',
          barColor: 'bg-red-600',
          indicator: '🔴'
        };
      case 'high/consultation':
        return {
          bg: 'bg-amber-50 border-amber-200',
          text: 'text-amber-900',
          badge: 'bg-amber-100 text-amber-800 border-amber-200',
          badgeText: 'Specialist Consultation Advisable',
          barColor: 'bg-amber-500',
          indicator: '🟡'
        };
      case 'medium/follow-up':
        return {
          bg: 'bg-blue-50 border-blue-200',
          text: 'text-blue-900',
          badge: 'bg-blue-100 text-blue-800 border-blue-200',
          badgeText: 'Standard Follow-up Advised',
          barColor: 'bg-blue-500',
          indicator: '🔵'
        };
      default:
        return {
          bg: 'bg-slate-50 border-slate-200',
          text: 'text-slate-900',
          badge: 'bg-slate-100 text-slate-700 border-slate-200',
          badgeText: 'Routine Review Level',
          barColor: 'bg-slate-500',
          indicator: '⚪'
        };
    }
  };

  const sev = getSeverityStyles(analysis.severityLevel);

  // Print function directly triggers print view styled for absolute clinical readability
  const handlePrint = () => {
    window.print();
  };

  // Helper to extract numeric values for SVG vitals graphing
  const extractVitalNumbers = (valStr: string): number => {
    // E.g. "142/92" -> average 117, "82 bpm" -> 82, "98.4 F" -> 98.4, "96%" -> 96
    const numericMatch = valStr.match(/(\d+\.?\d*)/);
    if (!numericMatch) return 50; // fallback
    const match = numericMatch[0];
    if (valStr.includes('/')) {
      // Blood pressure diastolic/systolic ratio proxy
      const [sys, dia] = valStr.split('/').map(Number);
      return sys ? (sys + dia) / 2 : 80;
    }
    return Number(match);
  };

  // Dynamic 3D visual target selection based on classification and clinical severity
  const specialtyLower = (analysis.specialtyClassification || '').toLowerCase();
  let modelType3D: 'heart' | 'helix' | 'synapse' = 'helix';
  let initialPulse = 72;
  let colorTheme3D: 'cyan' | 'emerald' | 'amber' | 'rose' = 'cyan';
  
  if (specialtyLower.includes('cardio') || specialtyLower.includes('heart') || specialtyLower.includes('vascular') || specialtyLower.includes('circulation')) {
    modelType3D = 'heart';
    colorTheme3D = 'rose';
    const pulseVital = analysis.entities.vitalSigns?.find(v => v.signal.toLowerCase().includes('rate') || v.signal.toLowerCase().includes('pulse'));
    if (pulseVital) {
      const parsedVal = parseInt(pulseVital.value.replace(/[^0-9]/g, ''));
      if (parsedVal > 100) colorTheme3D = 'rose';
      else if (parsedVal < 60) colorTheme3D = 'emerald';
      if (!isNaN(parsedVal)) initialPulse = parsedVal;
    }
  } else if (specialtyLower.includes('neuro') || specialtyLower.includes('brain') || specialtyLower.includes('synap') || specialtyLower.includes('psychiatry')) {
    modelType3D = 'synapse';
    colorTheme3D = 'cyan';
  } else if (specialtyLower.includes('genetic') || specialtyLower.includes('oncology') || specialtyLower.includes('allergy') || specialtyLower.includes('immunology') || specialtyLower.includes('pulmonology')) {
    modelType3D = 'helix';
    colorTheme3D = 'emerald';
  }

  return (
    <div className="space-y-8" id="report-viewer-workspace">
      
      {/* ACTION TOP BAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 print:hidden">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 px-3.5 py-2 rounded-xl transition-colors cursor-pointer self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard Records
        </button>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
          {savedLocally && (
            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 py-1 px-2.5 rounded-lg font-bold uppercase tracking-wider flex items-center gap-1 shrink-0">
              <BadgeCheck className="w-3.5 h-3.5 text-emerald-650" />
              Securely Saved
            </span>
          )}
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-blue-700 bg-white border border-slate-200 hover:bg-slate-50 px-3.5 py-2 rounded-xl transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print / Export PDF
          </button>
        </div>
      </div>

      {/* CLINCAL RECORD SUMMARY OVERVIEW (PATIENT SUMMARY CARD) */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs print:border-none print:shadow-none" id="print-area">
        
        {/* Clinician Header Branding printable */}
        <div className="p-6 bg-[#0f172a] text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-[#1e293b]">
          <div className="space-y-1">
            <span className="text-[10px] bg-sky-500/20 text-[#38bdf8] px-3 py-1 rounded-md font-bold uppercase tracking-wider border border-sky-500/10 inline-block">
              Clinical Report Analytics
            </span>
            <h2 className="text-lg md:text-xl font-black mt-2 tracking-tight text-white">{pTitle}</h2>
            <p className="text-xs text-slate-400 font-medium">Primary Classification Class: <strong className="text-[#38bdf8] font-bold">{analysis.specialtyClassification} Context</strong></p>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 bg-slate-800/40 p-4 rounded-xl border border-white/5 text-xs font-mono">
            <div><span className="text-slate-400 font-medium">Patient:</span> <strong className="text-white">{pName}</strong></div>
            <div><span className="text-slate-400 font-medium">Age / Sex:</span> <strong className="text-white">{pAge} yr / {pGender}</strong></div>
            <div><span className="text-slate-400 font-medium">Record Date:</span> <strong className="text-white">{pDate}</strong></div>
            <div><span className="text-slate-400 font-medium">Status:</span> <strong className="text-[#38bdf8] font-bold">Processed</strong></div>
          </div>
        </div>

        {/* Dynamic Warning Alert on Print */}
        <div className="hidden print:block border-y border-red-200 bg-red-50 text-red-800 p-3 text-xs text-center font-semibold">
          This document is an AI-managed annotation summary translating clinical transcription terms. It is NON-DIAGNOSTIC.
        </div>

        {/* CONTENT TABS OR CONTAINER */}
        <div className="p-6 md:p-8 space-y-8">
          
          {/* URGENCY ALERT CLASSIFIER */}
          <div className={`p-5 rounded-2xl border-l-4 ${sev.bg} border flex flex-col md:flex-row items-start md:items-center justify-between gap-4`} id="severity-alert-panel">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-base">{sev.indicator}</span>
                <span className={`text-xs font-bold uppercase tracking-widest ${sev.text}`}>
                  Severity Level: {analysis.severityLevel}
                </span>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${sev.badge}`}>
                  {sev.badgeText}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                {analysis.severityExplanation}
              </p>
            </div>
            <div className="w-full md:w-32 bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div className={`h-full ${sev.barColor}`} style={{ width: analysis.severityLevel.includes('Urgent') ? '100%' : analysis.severityLevel.includes('High') ? '75%' : analysis.severityLevel.includes('Medium') ? '50%' : '20%' }} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT / CENTER COLUMN - PATIENT CHRONICLE SUMMARY & FINDINGS */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* PATIENT FRIENDLY SUMMARY */}
              <div className="space-y-4 bg-gradient-to-r from-sky-50 to-indigo-50/40 p-5 md:p-6 rounded-3xl border border-[#bae6fd]">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <h3 className="text-xs font-bold text-[#0369a1] tracking-wider uppercase flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#0369a1] shrink-0" />
                    Patient-Friendly Translation & Audio
                  </h3>
                  
                  {/* Language Selector Toggles */}
                  <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setLanguage('en');
                        window.speechSynthesis.cancel();
                        setIsSpeaking(false);
                        setIsPaused(false);
                      }}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                        language === 'en' 
                          ? 'bg-[#0284c7] text-white' 
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      English
                    </button>
                    <button
                      type="button"
                      onClick={translateToHindi}
                      disabled={translating}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50 ${
                        language === 'hi' 
                          ? 'bg-[#0284c7] text-white' 
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {translating && <Loader2 className="w-3 h-3 animate-spin" />}
                      <Languages className="w-3.5 h-3.5 shrink-0" />
                      Hindi (हिंदी)
                    </button>
                  </div>
                </div>

                {/* Voice Assistant Panel */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-white/75 border border-slate-100 p-3 rounded-2xl">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isSpeaking && !isPaused ? 'bg-sky-500' : 'bg-slate-300'}`}></span>
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${isSpeaking && !isPaused ? 'bg-sky-400' : 'bg-slate-450'}`}></span>
                    </span>
                    <span className="text-[11px] font-black uppercase text-slate-500 tracking-wider">
                      Voice Assistant ({language === 'hi' ? 'Hindi voice' : 'English voice'})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSpeak}
                      className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[11px] px-3.5 py-1.5 rounded-xl transition-all cursor-pointer shadow-xs"
                    >
                      {isSpeaking && !isPaused ? (
                        <>
                          <Pause className="w-3.5 h-3.5" />
                          Pause Readout
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          {isPaused ? 'Resume Readout' : 'Read Aloud'}
                        </>
                      )}
                    </button>

                    {(isSpeaking || isPaused) && (
                      <button
                        type="button"
                        onClick={handleStopSpeech}
                        className="p-1.5 text-rose-650 hover:bg-rose-50 border border-rose-100 rounded-xl transition-colors cursor-pointer"
                        title="Stop Readout"
                      >
                        <VolumeX className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {translationError && (
                  <p className="text-[11px] text-rose-600 font-bold bg-rose-50 p-2.5 rounded-xl border border-rose-100">
                    {translationError}
                  </p>
                )}

                <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-xs sm:text-sm font-medium whitespace-pre-line bg-white/50 p-4 rounded-2xl border border-[#bae6fd]/30" id="patient-empowerment-description">
                  {language === 'hi' ? translatedText || "अनुवाद प्राप्त किया जा रहा है..." : analysis.patientFriendlySummary}
                </div>
              </div>

              {/* DETAILED CLINICAL FINDINGS PARSED */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800 tracking-wide uppercase flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-blue-600" />
                  Key Findings Explained
                </h3>

                <div className="grid grid-cols-1 gap-4" id="clinical-findings-group">
                  {analysis.clinicalFindings.map((finding, idx) => (
                    <div 
                      key={idx}
                      className="bg-slate-50 hover:bg-slate-150 p-4 rounded-xl border border-slate-200 flex items-start gap-3 transition-colors duration-250"
                    >
                      <div className="mt-1">
                        {finding.significance === 'Action Required' ? (
                          <span className="w-2.5 h-2.5 bg-rose-500 rounded-full block" title="Action Required" />
                        ) : finding.significance === 'Needs Attention' ? (
                          <span className="w-2.5 h-2.5 bg-amber-500 rounded-full block" title="Needs Attention" />
                        ) : (
                          <span className="w-2.5 h-2.5 bg-blue-500 rounded-full block" title="Routine Tracking" />
                        )}
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <h4 className="text-sm font-extrabold text-slate-900 leading-none">
                            {finding.finding}
                          </h4>
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${
                            finding.significance === 'Action Required' 
                              ? 'bg-rose-50 border-rose-150 text-rose-700' 
                              : finding.significance === 'Needs Attention'
                              ? 'bg-amber-50 border-amber-150 text-amber-700'
                              : 'bg-blue-50 border-blue-150 text-blue-700'
                          }`}>
                            {finding.significance}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                          {finding.details}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CLINICIAN INSTRUCTIONS / DOCTORS PRESCRIBED AGENTS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Medications List */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                  <h4 className="text-xs font-bold text-slate-700 tracking-wider uppercase flex items-center gap-2 border-b border-slate-100 pb-2">
                    <Pill className="w-4 h-4 text-emerald-600" />
                    Medications & Instructions
                  </h4>
                  {analysis.entities.medications.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No prescriptive pharmaceutical agents listed in transcription.</p>
                  ) : (
                    <ul className="space-y-3">
                      {analysis.entities.medications.map((med, i) => (
                        <li 
                          key={i} 
                          onClick={() => toggleMed(med.name)}
                          className="flex items-start gap-2.5 cursor-pointer select-none group text-xs text-slate-700 font-medium"
                        >
                          <span className="mt-0.5 shrink-0 text-slate-400 group-hover:text-blue-500 transition-colors">
                            {checkedMeds[med.name] ? (
                              <CheckSquare className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </span>
                          <div className={checkedMeds[med.name] ? 'line-through text-slate-400' : ''}>
                            <p className="font-extrabold text-slate-900">{med.name}</p>
                            <p className="text-[10px] text-slate-500 text-slate-500 mt-0.5">
                              {med.dosageInstruction} — <span className="italic">{med.purpose}</span>
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Procedures list */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                  <h4 className="text-xs font-bold text-slate-700 tracking-wider uppercase flex items-center gap-2 border-b border-slate-100 pb-2">
                    <ClipboardList className="w-4 h-4 text-indigo-600" />
                    Procedures Tracker
                  </h4>
                  {analysis.entities.procedures.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No clinical diagnostic procedures specified.</p>
                  ) : (
                    <ul className="space-y-3">
                      {analysis.entities.procedures.map((proc, i) => (
                        <li 
                          key={i} 
                          onClick={() => toggleProc(proc.name)}
                          className="flex items-start gap-2.5 cursor-pointer select-none group text-xs text-slate-700 font-medium"
                        >
                          <span className="mt-0.5 shrink-0 text-slate-400 group-hover:text-blue-500 transition-colors">
                            {checkedProcs[proc.name] ? (
                              <CheckSquare className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </span>
                          <div className={checkedProcs[proc.name] ? 'line-through text-slate-400' : ''}>
                            <p className="font-extrabold text-slate-900 leading-snug">{proc.name}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              Status: <strong className="text-blue-700 font-bold capitalize">{proc.status}</strong> — <span className="italic">{proc.purpose}</span>
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

              </div>

            </div>

            {/* RIGHT COLUMN - JARGON TRANSLATOR & RETURNING VITALS PLOTS */}
            <div className="space-y-8">
              
              {/* DYNAMIC 3D CLINICAL BIO-ENGINE */}
              <div className="space-y-2.5 bg-slate-950 text-slate-100 p-5 rounded-3xl border border-slate-800 shadow-xl print:hidden">
                <div className="flex items-center justify-between pb-2 border-b border-slate-850">
                  <div className="flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-[#38bdf8] shrink-0 animate-pulse" />
                    <span className="text-[10.5px] font-black uppercase text-slate-200 tracking-wider">
                      Bio3D Hologram Projection
                    </span>
                  </div>
                  <span className="text-[9px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full font-mono text-slate-400">12ch/S</span>
                </div>
                
                <div className="overflow-hidden rounded-2xl border border-slate-850">
                  <Medical3DVisualizer 
                    initialModelType={modelType3D} 
                    initialPulseRate={initialPulse} 
                    initialColorTheme={colorTheme3D} 
                    minimal={true}
                  />
                </div>
                
                <p className="text-[9.5px] text-slate-400 font-medium leading-relaxed pt-1.5 select-none">
                  Mapped parameters based on clinical <strong className="text-white font-black">{analysis.specialtyClassification}</strong> transcription indices. Rotate specimen angles via drag.
                </p>
              </div>

              {/* VITALS SVG GRAPHICS PANEL */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                <h3 className="text-xs font-bold text-slate-700 tracking-wider uppercase flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  Key Biomarkers & Vitals Graph
                </h3>

                {analysis.entities.vitalSigns.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No active physiological vital measurements isolated.</p>
                ) : (
                  <div className="space-y-4">
                    {/* Render elegant SVG bar meters for vitals */}
                    {analysis.entities.vitalSigns.map((vital, i) => {
                      const valueNum = extractVitalNumbers(vital.value);
                      // Calculate width percentage loosely scaled
                      let percent = 50;
                      if (vital.signal.toLowerCase().includes('pressure')) {
                        percent = Math.min(100, Math.max(10, ((valueNum - 60) / 100) * 100));
                      } else if (vital.signal.toLowerCase().includes('rate') || vital.signal.toLowerCase().includes('pulse')) {
                        percent = Math.min(100, Math.max(10, ((valueNum - 40) / 120) * 100));
                      } else if (vital.signal.toLowerCase().includes('oxygen') || vital.signal.toLowerCase().includes('spo2')) {
                        percent = Math.min(100, Math.max(10, ((valueNum - 80) / 20) * 100));
                      } else if (vital.signal.toLowerCase().includes('temp')) {
                        percent = Math.min(100, Math.max(10, ((valueNum - 95) / 10) * 100));
                      }

                      return (
                        <div key={i} className="space-y-1 text-xs">
                          <div className="flex justify-between font-bold">
                            <span className="text-slate-800">{vital.signal}</span>
                            <span className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-extrabold">{vital.value}</span>
                          </div>
                          
                          {/* SVG Bar */}
                          <svg className="w-full h-3 bg-slate-100 rounded-lg overflow-hidden" viewBox="0 0 100 12" preserveAspectRatio="none">
                            <defs>
                              <linearGradient id={`grad-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#3b82f6" />
                                <stop offset="100%" stopColor="#1d4ed8" />
                              </linearGradient>
                            </defs>
                            <rect x="0" y="0" width={`${percent}`} height="12" fill={`url(#grad-${i})`} />
                          </svg>

                          <p className="text-[10px] text-slate-500 font-semibold italic">
                            Status Indicator: {vital.interpretation}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* INTERACTIVE JARGON DICTIONARY WIDGET */}
              <div className="bg-slate-900 text-white rounded-2xl p-5 md:p-6 space-y-4 shadow-md" id="clinical-jargon-translator">
                <div className="border-b border-slate-800 pb-2.5">
                  <h3 className="text-xs font-bold text-slate-300 tracking-wider uppercase flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-400" />
                    Clinical Jargon Translator
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Click any term to decode its complex medical terminology.
                  </p>
                </div>

                <div className="space-y-3.5 max-h-96 overflow-y-auto pr-1" id="jargon-scroller">
                  {analysis.medicalJargonTerms.map((jg, i) => (
                    <div 
                      key={i} 
                      onClick={() => setSelectedJargon(selectedJargon === jg.term ? null : jg.term)}
                      className={`p-3 rounded-xl border transition-all duration-200 cursor-pointer text-xs ${
                        selectedJargon === jg.term 
                          ? 'bg-blue-600/30 border-blue-500 shadow-md shadow-blue-900/20' 
                          : 'bg-slate-800 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-sm">
                        <span className="text-blue-300 font-extrabold tracking-tight underline decoration-dotted decoration-blue-400/60 decoration-2">
                          {jg.term}
                        </span>
                        <ChevronRight className={`w-3.5 h-3.5 text-slate-500 transition-transform ${selectedJargon === jg.term ? 'rotate-90 text-blue-300' : ''}`} />
                      </div>

                      {selectedJargon === jg.term ? (
                        <div className="mt-2 space-y-1.5 transition-opacity duration-300">
                          <p className="text-[11px] text-slate-100 font-semibold leading-relaxed">
                            <strong>Definition:</strong> {jg.description}
                          </p>
                          <p className="text-xs text-emerald-300 bg-emerald-950/30 px-2 py-1 rounded inline-block font-extrabold border border-emerald-900/40">
                            <strong>Plain English:</strong> {jg.plainEnglish}
                          </p>
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-400 capitalize mt-1 truncate">
                          Decode: {jg.plainEnglish}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* PHYSICIAN QUESTIONS PANEL */}
              <div className="bg-amber-50/50 rounded-2xl border border-amber-200 p-5 space-y-4">
                <h3 className="text-xs font-bold text-slate-800 tracking-wider uppercase flex items-center gap-2 border-b border-amber-200/50 pb-2">
                  <HelpCircle className="w-4 h-4 text-amber-700" />
                  What to Ask Your Doctor
                </h3>
                <p className="text-[11px] text-amber-800/85 leading-relaxed font-semibold">
                  Take charge of your health trajectory. Print or save these tailored questions for your next provider visit:
                </p>
                <ol className="space-y-3 pl-1">
                  {analysis.suggestedDoctorQuestions.map((q, idx) => (
                    <li key={idx} className="text-xs text-slate-800 flex items-start gap-2 font-medium">
                      <span className="bg-amber-100 text-amber-900 font-black rounded-full w-4 h-4 flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed font-bold text-slate-900">{q}</span>
                    </li>
                  ))}
                </ol>
              </div>

            </div>

          </div>

          {/* HISTORIC RAW CLINICAL REPORT TRANSCRIPT TAB */}
          <div className="border-t border-slate-100 pt-6 space-y-2.5 print:hidden">
            <h3 className="text-slate-700 font-bold text-xs uppercase tracking-wider">
              Original RAW Clinical Report Text
            </h3>
            <pre className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-650 font-mono text-[11px] whitespace-pre-wrap overflow-x-auto leading-relaxed h-48 max-h-72 overflow-y-auto select-all">
              {rawText}
            </pre>
          </div>

        </div>

      </div>

    </div>
  );
}
