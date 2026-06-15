import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  HeartPulse, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  ClipboardList, 
  HelpCircle, 
  Info, 
  ChevronRight, 
  Printer, 
  Copy, 
  RotateCcw, 
  FileText, 
  Pill, 
  AlertOctagon, 
  Loader2 
} from 'lucide-react';
import Medical3DVisualizer from './Medical3DVisualizer.jsx';

interface DiagnosisResult {
  possibleDiagnoses: Array<{
    disease: string;
    likelihood: 'High' | 'Medium' | 'Low';
    explanation: string;
    symptomMatching: string[];
    treatmentConnection: string;
  }>;
  medicationSafetyAnalysis: Array<{
    medication: string;
    purpose: string;
    safetyNote: string;
  }>;
  redFlags: string[];
  nextSteps: string[];
  disclaimer: string;
}

// Symptom Presets for smooth UX
const SYMPTOM_PRESETS = [
  {
    title: 'Cardiac Warning Sign',
    symptoms: 'Sensation of radiating chest heaviness escalating on climbing stairs, accompanied by mild breathing shortness and unexplained sweating.',
    medications: 'Aspirin 81mg tablet once daily',
    previousTreatments: 'Diagnosed with mild hypertension, recommended diet and active logs.'
  },
  {
    title: 'Spasmodic Asthma',
    symptoms: 'Aggravated breathing difficulties, persistent dry dry night coughs, and wheezing sounds mostly triggered by cold ventilation.',
    medications: 'Albuterol Inhaler (2 puffs as needed)',
    previousTreatments: 'Allergy immunotherapy course completed in 2023.'
  },
  {
    title: 'Gastrointestinal Distress',
    symptoms: 'Burning discomfort and sharp pain located in the epigastric region (upper stomach) radiating upwards to chest, severely intensified about 45 minutes after heavy meals.',
    medications: 'Ibuprofen 400mg occasionally for chronic back pain',
    previousTreatments: 'Previous endoscopy showed mild acid reflux indications.'
  }
];

export default function SymptomDiagnostics() {
  const [symptoms, setSymptoms] = useState('');
  const [medications, setMedications] = useState('');
  const [treatments, setTreatments] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Dynamic 3D model states
  const [activeModel, setActiveModel] = useState<'heart' | 'helix' | 'synapse'>('heart');
  const [activePulse, setActivePulse] = useState(72);
  const [activeTheme, setActiveTheme] = useState<'cyan' | 'emerald' | 'amber' | 'rose'>('cyan');

  // Reassuring diagnostic clinical stages
  const loadingMessages = [
    'Initializing secure clinical evaluation protocol...',
    'Synthesizing symptoms against epidemiological databases...',
    'Correlating active medications for safety interactions...',
    'Compiling pharmacovigilance reports and warning indicators...',
    'Formatting diagnostic possibilities and provider guidelines...'
  ];

  const handleSelectPreset = (preset: typeof SYMPTOM_PRESETS[0]) => {
    setSymptoms(preset.symptoms);
    setMedications(preset.medications);
    setTreatments(preset.previousTreatments);
    setError(null);
    setResult(null);

    // Dynamically align the 3D biological visualizer properties to mirror this physical state!
    if (preset.title.includes('Cardiac')) {
      setActiveModel('heart');
      setActivePulse(110);
      setActiveTheme('rose');
    } else if (preset.title.includes('Asthma')) {
      setActiveModel('helix');
      setActivePulse(84);
      setActiveTheme('amber');
    } else if (preset.title.includes('Gastro')) {
      setActiveModel('synapse');
      setActivePulse(76);
      setActiveTheme('emerald');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptoms.trim()) {
      setError('Please describe your active physical symptoms first.');
      return;
    }

    setResult(null);
    setError(null);
    setLoading(true);
    setLoadingStep(0);

    // Rotate loading messages
    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => (prev < loadingMessages.length - 1 ? prev + 1 : prev));
    }, 1600);

    try {
      const response = await fetch('/api/diagnose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('acuramed_token') || ''}`
        },
        body: JSON.stringify({
          symptoms: symptoms.trim(),
          currentMedications: medications.trim(),
          previousTreatments: treatments.trim()
        })
      });

      const data = await response.json();
      clearInterval(stepInterval);

      if (!response.ok) {
        throw new Error(data.error || 'The diagnostics engine encountered an evaluation exception.');
      }

      setResult(data.diagnosis);

      // Analyze returning condition keywords to trigger accurate specimen visualizations!
      const primaryCondition = (data.diagnosis.possibleDiagnoses[0]?.disease || '').toLowerCase();
      const primaryExplanation = (data.diagnosis.possibleDiagnoses[0]?.explanation || '').toLowerCase();

      if (primaryCondition.includes('heart') || primaryCondition.includes('cardiac') || primaryCondition.includes('artery') || primaryExplanation.includes('angina') || primaryExplanation.includes('myocard')) {
        setActiveModel('heart');
        setActivePulse(106);
        setActiveTheme('rose');
      } else if (primaryCondition.includes('asthma') || primaryCondition.includes('bronch') || primaryCondition.includes('lung') || primaryExplanation.includes('allergy')) {
        setActiveModel('helix');
        setActivePulse(82);
        setActiveTheme('amber');
      } else {
        setActiveModel('synapse');
        setActivePulse(74);
        setActiveTheme('cyan');
      }

    } catch (err: any) {
      clearInterval(stepInterval);
      setError(err.message || 'Connection failure. Please ensure your local API credentials are loaded.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSymptoms('');
    setMedications('');
    setTreatments('');
    setResult(null);
    setError(null);
    setActiveModel('heart');
    setActivePulse(72);
    setActiveTheme('cyan');
  };

  const handleCopy = () => {
    if (!result) return;
    const diseaseList = result.possibleDiagnoses
      .map(d => `- ${d.disease} (${d.likelihood} Likelihood):\n  Explanation: ${d.explanation}\n  Matched Symptoms: ${d.symptomMatching.join(', ')}\n  Medication Correlation: ${d.treatmentConnection}`)
      .join('\n\n');
    
    const safetyNote = result.medicationSafetyAnalysis
      .map(m => `- ${m.medication} (${m.purpose}): ${m.safetyNote}`)
      .join('\n');

    const rawClip = `ACURAMED CLINICAL DIAGNOSTICS ASSESSMENT\n\nSymptoms Evaluated:\n${symptoms}\n\nPOSSIBLE CONDITIONS:\n${diseaseList}\n\nPHARMACOVIGILANCE SAFETY REPORT:\n${safetyNote}\n\nRED FLAGS & WARNINGS:\n${result.redFlags.join('\n')}\n\nRECOMMENDED NEXT CLINICAL STEPS:\n${result.nextSteps.join('\n')}\n\n${result.disclaimer}`;

    navigator.clipboard.writeText(rawClip);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8" id="diagnose-tab-root">
      
      {/* Page Header banner styled as Clinical Advisory Core with high-tech dark visuals */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-2xl relative overflow-hidden shadow-cyan-950/25" id="diagnose-banner">
        <div className="absolute inset-0 bg-[radial-gradient(#334155_1.2px,transparent_1.2px)] [background-size:16px_16px] opacity-25 pointer-events-none" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-1.5 max-w-3xl text-left relative z-10">
          <div className="flex items-center gap-2.5">
            <HeartPulse className="w-5 h-5 shrink-0 animate-pulse text-cyan-400" />
            <span className="text-[10px] font-black tracking-widest uppercase font-mono bg-cyan-950/50 text-cyan-400 border border-cyan-500/20 px-2.5 py-1 rounded-full">clinical advisory core</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">Symptom-Based Diagnostics</h2>
          <p className="text-slate-400 text-xs md:text-sm leading-relaxed font-semibold">
            Analyze active patient symptoms, cross-correlate pharmaceutical prescriptions, identify adverse pharmacovigilance signals, and assess probable underlying conditions.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Form Input Panel with 3D dark visuals */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Quick presets list widget */}
          <div className="bg-slate-950 border border-slate-800 text-white rounded-3xl p-6 space-y-4 text-left shadow-2xl relative overflow-hidden shadow-indigo-950/20">
            <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] opacity-25 pointer-events-none" />
            <div className="flex items-start gap-3 relative z-10">
              <div className="p-2 bg-indigo-500/15 rounded-xl text-indigo-400 border border-indigo-500/20">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase text-slate-100 tracking-wider">Diagnostic Presets</h4>
                <p className="text-[10px] text-slate-400 leading-normal mt-0.5 font-medium">
                  Select a classic medical case template to load symptom lists, drug history and treatments:
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-1 relative z-10" id="diagnose-presets-row">
              {SYMPTOM_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectPreset(preset)}
                  className="w-full text-left bg-slate-900/40 hover:bg-slate-900/85 border border-slate-800 hover:border-cyan-500/50 p-3 rounded-xl transition-all duration-150 flex items-center justify-between group cursor-pointer"
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-bold text-slate-200 group-hover:text-cyan-400 transition-colors">{preset.title}</p>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">{preset.symptoms}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-450 shrink-0 transition-transform group-hover:translate-x-0.5" />
                </button>
              ))}
            </div>
          </div>

          {/* Form Panel styled with 3D dark visuals */}
          <form onSubmit={handleSubmit} className="bg-slate-950/90 border border-slate-850 rounded-3xl shadow-2xl overflow-hidden text-left shadow-cyan-950/15" id="symptom-input-form">
            <div className="p-6 md:p-8 space-y-6 relative">
              <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] opacity-35 pointer-events-none" />
              
              <div className="space-y-1 relative z-10" id="symptom-description-subsection">
                <h3 className="text-xs font-black text-slate-200 tracking-widest uppercase flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400 shrink-0" />
                  1. Current Physical Symptoms
                </h3>
                <p className="text-[10px] text-slate-500 font-bold leading-normal uppercase tracking-wider">What feels abnormal? Describe onset, pain indicators, severity.</p>
              </div>

              <div className="relative group z-10">
                <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-slate-700 pointer-events-none group-focus-within:border-cyan-400 transition-colors" />
                <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-slate-700 pointer-events-none group-focus-within:border-cyan-400 transition-colors" />
                <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-slate-700 pointer-events-none group-focus-within:border-cyan-400 transition-colors" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-slate-700 pointer-events-none group-focus-within:border-cyan-400 transition-colors" />
                
                <textarea
                  placeholder="Describe physical complaints in detail...&#10;e.g., Escalating dull substernal throat/chest tightness during brisk walking, fading under rest. Accompanied by minor upper limb tingling."
                  rows={5}
                  className="w-full p-4 font-mono text-[11px] leading-relaxed bg-[#030712]/50 border border-slate-800 rounded-xl focus:bg-slate-950 focus:outline-hidden focus:ring-2 focus:ring-cyan-950 focus:border-cyan-500 text-slate-100 select-all placeholder:text-slate-600 transition-all duration-200"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="border-t border-slate-900 pt-5 space-y-4 relative z-10" id="medications-dosage-subsection">
                <div className="space-y-1">
                  <h3 className="text-xs font-black text-slate-200 tracking-widest uppercase flex items-center gap-2">
                    <Pill className="w-4 h-4 text-indigo-400 shrink-0" />
                    2. Active Medications & Dosage (Optional)
                  </h3>
                  <p className="text-[10px] text-slate-500 leading-normal uppercase font-bold tracking-wider">List active drugs or treatments to assess adverse integrations.</p>
                </div>

                <input
                  type="text"
                  placeholder="e.g. Lisinopril 10mg daily, Aspirin 81mg occasionally"
                  className="w-full text-xs font-bold py-3 px-4 bg-[#030712]/40 border border-slate-800 rounded-xl text-slate-200 placeholder:text-slate-500 focus:bg-slate-950 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-950 focus:outline-hidden transition-all"
                  value={medications}
                  onChange={(e) => setMedications(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="border-t border-slate-900 pt-5 space-y-4 relative z-10" id="previous-treatments-subsection">
                <div className="space-y-1">
                  <h3 className="text-xs font-black text-slate-200 tracking-widest uppercase flex items-center gap-2">
                    <FileText className="w-4 h-4 text-teal-400 shrink-0" />
                    3. Previous Treatments & History (Optional)
                  </h3>
                  <p className="text-[10px] text-slate-500 leading-normal uppercase font-bold tracking-wider">Relevant chronic conditions, previous procedures, or surgeries.</p>
                </div>

                <input
                  type="text"
                  placeholder="e.g. Cardiac angioplasty in 2021, chronic allergy sufferer"
                  className="w-full text-xs font-bold py-3 px-4 bg-[#030712]/45 border border-slate-800 rounded-xl text-slate-200 placeholder:text-slate-500 focus:bg-slate-950 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-950 focus:outline-hidden transition-all"
                  value={treatments}
                  onChange={(e) => setTreatments(e.target.value)}
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="p-4 bg-rose-950/40 border border-rose-900/50 text-rose-200 text-xs font-bold rounded-2xl flex items-start gap-2.5 animate-fade-in relative z-10">
                  <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 animate-pulse" />
                  <span>{error}</span>
                </div>
              )}

            </div>

            <div className="p-6 bg-slate-950 border-t border-slate-900 flex items-center justify-between relative z-10">
              <button
                type="button"
                onClick={handleClear}
                disabled={loading}
                className="text-slate-500 border border-slate-800 hover:bg-slate-910 hover:text-slate-300 text-xs font-bold flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
              
              <button
                type="submit"
                disabled={loading || !symptoms.trim()}
                className="bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white disabled:opacity-30 font-extrabold text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl shadow-lg hover:shadow-cyan-500/20 active:scale-98 transition-all flex items-center gap-2 cursor-pointer border border-cyan-400/20"
              >
                <Activity className="w-4 h-4 shrink-0" />
                Analyze Case
              </button>
            </div>
          </form>

        </div>

        {/* Right Side: Output Diagnostic Report */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            
            {loading && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white border border-slate-200 rounded-3xl p-8 md:p-12 text-center flex flex-col items-center justify-center min-h-[450px] space-y-6"
                id="diagnosing-pulse-box"
              >
                <div className="relative inline-flex items-center justify-center">
                  <div className="absolute w-24 h-24 bg-sky-100 rounded-full animate-ping pointer-events-none" />
                  <div className="relative bg-sky-50 text-[#0284c7] p-6 rounded-3xl border border-sky-100 shadow-md">
                    <Loader2 className="w-12 h-12 animate-spin" />
                  </div>
                </div>

                <div className="space-y-2.5 max-w-sm">
                  <h4 className="text-lg font-black text-slate-800">Diagnostic Processor Engaged</h4>
                  <p className="text-xs text-[#0284c7] font-extrabold bg-sky-50 p-2.5 rounded-xl border border-dashed border-sky-100 leading-relaxed uppercase tracking-wider">
                    {loadingMessages[loadingStep]}
                  </p>
                </div>

                <div className="w-32 bg-slate-100 rounded-full h-1 overflow-hidden">
                  <div className="h-full bg-sky-600 animate-infinite-loading w-1/2 rounded-full" style={{ width: `${((loadingStep + 1) / loadingMessages.length) * 100}%`, transition: 'width 0.4s' }} />
                </div>
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">clinical decision safety analysis</p>
              </motion.div>
            )}

            {!loading && !result && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-slate-950/80 border border-slate-800 rounded-3xl p-6 md:p-8 min-h-[500px] text-left relative overflow-hidden shadow-2xl shadow-indigo-950/20"
                id="diagnostics-placeholder"
              >
                <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1.2px,transparent_1.2px)] [background-size:20px_20px] opacity-25 pointer-events-none" />
                <div className="absolute top-0 left-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

                <div className="md:col-span-7 flex flex-col justify-center space-y-6 text-left relative z-10">
                  <div className="p-3 bg-cyan-950/55 text-cyan-400 border border-cyan-500/25 rounded-2xl w-fit">
                    <HeartPulse className="w-8 h-8" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-lg font-black text-white tracking-tight">Clinical Diagnostics Analyzer</h3>
                    <p className="text-slate-400 text-xs leading-relaxed font-semibold">
                      Provide detailed physical complaints and medication history in the left form, or choose a diagnostic preset template to sync our 3D biometric clinical simulator dynamically.
                    </p>
                  </div>
                  <div className="p-4 bg-slate-900/40 rounded-2xl border border-slate-800/85 text-[11px] text-slate-400 space-y-3">
                    <p className="flex items-start gap-1.5 text-slate-300 font-medium">
                      <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span><strong className="text-white">Pharmacovigilance checks:</strong> Evaluates active drug lists to alert clinicians to possible contraindications.</span>
                    </p>
                    <p className="flex items-start gap-1.5 text-slate-300 font-medium">
                      <Info className="w-4 h-5 text-indigo-400 shrink-0 mt-0.5" />
                      <span><strong className="text-white">Underlying Pathologies:</strong> Pinpoints medical classifications using official Gemini-3.5-flash terminology mapping layouts.</span>
                    </p>
                  </div>
                </div>

                <div className="md:col-span-5 bg-slate-950/95 rounded-2xl border border-slate-800 p-4.5 flex flex-col justify-between shadow-2xl relative z-10">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-850">
                    <span className="text-[10px] uppercase font-black tracking-widest text-[#38bdf8] animate-pulse">Bio3D Holo-Sync</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <div className="my-2 select-none overflow-hidden rounded-xl border border-slate-900 bg-slate-950">
                    <Medical3DVisualizer 
                      initialModelType={activeModel} 
                      initialPulseRate={activePulse} 
                      initialColorTheme={activeTheme} 
                      minimal={true}
                    />
                  </div>
                  <span className="text-[9px] text-slate-500 text-center font-mono uppercase font-black tracking-wider leading-none">
                    Target: {activeModel === 'heart' ? 'cardio ventricles' : activeModel === 'helix' ? 'double helix strands' : 'cortical synaptic net'}
                  </span>
                </div>
              </motion.div>
            )}

            {result && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden text-left space-y-8 p-6 md:p-8 relative print:border-none"
                id="diagnostic-report-container"
              >
                {/* Print and Actions toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5 print:hidden">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                      <CheckCircle className="w-4 h-4" />
                    </span>
                    <span className="text-xs font-black uppercase text-slate-700 tracking-wider">Diagnostic Evaluation Compiled</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopy}
                      className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] px-3 py-2 rounded-xl transition-colors cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {copied ? 'Copied Portfolio' : 'Copy Portfolio'}
                    </button>
                    <button
                      onClick={handlePrint}
                      className="inline-flex items-center gap-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white font-extrabold text-[11px] px-3.5 py-2 rounded-xl transition-all shadow-2xs hover:shadow-xs cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Print Dossier
                    </button>
                  </div>
                </div>

                {/* Patient / Symptoms Summary Box */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-2.5">
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">Evaluated Clinical Symptoms</h4>
                  <p className="text-xs font-mono text-slate-800 leading-relaxed font-bold bg-white border border-slate-200 p-3 rounded-xl">
                    "{symptoms}"
                  </p>
                  {(medications || treatments) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 pt-2 border-t border-slate-150">
                      {medications && (
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Existing Medications:</span>
                          <span className="text-xs font-bold text-slate-700">{medications}</span>
                        </div>
                      )}
                      {treatments && (
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Clinical History:</span>
                          <span className="text-xs font-bold text-slate-700">{treatments}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Probable Conditions List */}
                <div className="space-y-6">
                  
                  {/* Dynamic 3D specimen render row inside result card */}
                  <div className="bg-slate-950 text-slate-100 p-5 rounded-3xl border border-slate-800 shadow-xl print:hidden grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                    <div className="md:col-span-7 space-y-2 text-left">
                      <span className="text-[9px] font-black tracking-widest bg-sky-500/15 text-[#38bdf8] px-2.5 py-1 rounded-full border border-sky-500/10 uppercase inline-block font-mono">Diagnostic bio-sync</span>
                      <h4 className="text-xs font-black text-white uppercase tracking-wider">Holographic Specimen Correlation Map</h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
                        The bio-engine matched your case parameters with the 
                        <strong className="text-white"> {activeModel === 'heart' ? 'Cardio Chamber' : activeModel === 'helix' ? 'Double Helix Polymer' : 'Neural Synaptic Net'}</strong> specimen, pulsating at <span className="text-[#38bdf8] font-black">{activePulse} BPM</span>. Hold and drag to inspect orbital details.
                      </p>
                    </div>
                    <div className="md:col-span-5 overflow-hidden rounded-2xl border border-slate-850">
                      <Medical3DVisualizer 
                        initialModelType={activeModel} 
                        initialPulseRate={activePulse} 
                        initialColorTheme={activeTheme} 
                        minimal={true}
                      />
                    </div>
                  </div>

                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-2.5">
                    <Activity className="w-4 h-4 text-blue-600 shrink-0" />
                    Possible Underlying Pathologies
                  </h3>

                  <div className="space-y-4">
                    {result.possibleDiagnoses.map((diag, index) => {
                      const lColors = {
                        High: 'bg-rose-100 text-rose-800 border-rose-200',
                        Medium: 'bg-amber-100 text-amber-800 border-amber-200',
                        Low: 'bg-blue-100 text-blue-800 border-blue-200'
                      }[diag.likelihood] || 'bg-slate-100 text-slate-800';

                      return (
                        <div key={index} className="border border-slate-200 rounded-2xl p-5 hover:border-slate-350 transition-all space-y-3.5">
                          <div className="flex items-center justify-between gap-4 flex-wrap">
                            <h4 className="text-sm font-black text-slate-900">{diag.disease}</h4>
                            <span className={`text-[10px] font-black border uppercase tracking-wider px-2.5 py-1 rounded-full ${lColors}`}>
                              {diag.likelihood} Likelihood
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                            {diag.explanation}
                          </p>

                          {/* Symptom correlation tags */}
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Aligned Indicators:</span>
                            {diag.symptomMatching.map((sym, si) => (
                              <span key={si} className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                                {sym}
                              </span>
                            ))}
                          </div>

                          {/* Drug/Treatment connection note */}
                          <div className="bg-sky-50 bg-opacity-40 border border-sky-100 rounded-xl p-3.5 text-xs text-sky-850 leading-relaxed font-medium">
                            <div className="font-extrabold text-[#0284c7] uppercase text-[10px] tracking-wider mb-0.5">Therapeutic Correlation:</div>
                            {diag.treatmentConnection}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Medication Safety and Interaction Board */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-2.5">
                    <Pill className="w-4 h-4 text-purple-600 shrink-0" />
                    PranaScan Bio-Safety Pharmacovigilance
                  </h3>

                  {result.medicationSafetyAnalysis.length === 0 ? (
                    <div className="text-xs text-slate-500 italic p-4 bg-slate-50 rounded-2xl text-center">
                      No prescription logs presented. Safety verification is complete.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {result.medicationSafetyAnalysis.map((med, index) => (
                        <div key={index} className="flex gap-4 p-4 border border-purple-100 bg-purple-50 bg-opacity-10 rounded-2xl items-start">
                          <div className="p-2 bg-purple-100 text-purple-700 rounded-xl shrink-0 mt-0.5">
                            <Pill className="w-4 h-4" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-baseline gap-2">
                              <span className="text-xs font-black text-slate-900">{med.medication}</span>
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">({med.purpose})</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed font-medium">
                              {med.safetyNote}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Emergency Red Flags warning panel */}
                <div className="border-l-4 border-rose-500 bg-rose-50 bg-opacity-20 rounded-r-2xl p-5 space-y-3" id="diagnose-red-flags">
                  <div className="flex items-center gap-2 text-rose-800">
                    <AlertOctagon className="w-5 h-5 text-rose-500 shrink-0" />
                    <h4 className="text-xs font-black uppercase tracking-widest">CRITICAL CLINICAL RED FLAGS</h4>
                  </div>
                  <ul className="list-disc pl-5 text-xs text-slate-700 leading-relaxed space-y-1.5 font-semibold">
                    {result.redFlags.map((flag, idx) => (
                      <li key={idx} className="marker:text-rose-500">{flag}</li>
                    ))}
                  </ul>
                </div>

                {/* Actionable Next Steps Checklist */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-2.5">
                    <ClipboardList className="w-4 h-4 text-emerald-650 shrink-0" />
                    Recommended Consultation Preparedness Steps
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3" id="diagnose-next-steps">
                    {result.nextSteps.map((step, idx) => (
                      <div key={idx} className="flex gap-3 p-3.5 bg-slate-50 border border-slate-100 rounded-xl items-start">
                        <div className="p-1 mt-0.5 rounded-full bg-emerald-100 text-emerald-700 shrink-0">
                          <CheckCircle className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs text-slate-700 leading-relaxed font-bold">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Advisory Safety Disclaimer */}
                <div className="p-4 bg-amber-50/10 border border-amber-200/50 rounded-2xl flex gap-3 text-left">
                  <div className="p-1.5 bg-amber-50 text-amber-700 rounded-lg shrink-0 h-fit">
                    <Info className="w-4 h-4" />
                  </div>
                  <p className="text-[10px] leading-relaxed text-slate-500 font-semibold italic">
                    {result.disclaimer}
                  </p>
                </div>

              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
