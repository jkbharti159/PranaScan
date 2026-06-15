import React, { useState, useEffect } from 'react';
import Header from './components/Header.jsx';
import LoginModal from './components/LoginModal.jsx';
import PresetSelector from './components/PresetSelector.jsx';
import HistoryList from './components/HistoryList.jsx';
import ReportViewer from './components/ReportViewer.jsx';
import PatientGuide from './components/PatientGuide.jsx';
import SymptomDiagnostics from './components/SymptomDiagnostics.jsx';
import Medical3DVisualizer from './components/Medical3DVisualizer.jsx';
import Ambient3DBackground from './components/Ambient3DBackground.jsx';
import Footer3DVisuals from './components/Footer3DVisuals.jsx';
import { User, ActiveTab, HistoryRecord, AnalysisResult } from './types.js';
import { MedicalSample } from './data/samples.js';
import { 
  FileText, ArrowDownToLine, BrainCircuit, Activity, Sparkles, CheckCircle2, AlertCircle, FileDigit, ShieldAlert,
  Upload, X, FileUp
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('analyze');
  
  // Custom paste states filled by presets or wrote by hand
  const [reportText, setReportText] = useState('');
  const [reportTitle, setReportTitle] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState<'Male' | 'Female' | 'Other'>('Male');

  // File upload states
  const [uploadedFile, setUploadedFile] = useState<{ data: string; mimeType: string; name: string } | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Active processed analysis viewing states
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
  const [currentRawText, setCurrentRawText] = useState('');
  const [currentMetadata, setCurrentMetadata] = useState<any>(null);

  // Database historical logs
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Modals & General UI triggers
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [submittingAnalysis, setSubmittingAnalysis] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState('Parsing transcription segments...');
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const processFile = (file: File) => {
    // Validate types: pdf, images
    const validMimes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';
    
    if (!isImage && !isPdf) {
      setAnalysisError('Invalid file format. Please upload a PDF or an Image file (PNG, JPG, WEBP, GIF).');
      return;
    }

    setAnalysisError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target?.result as string;
      setUploadedFile({
        data: base64Data,
        mimeType: file.type || (isPdf ? 'application/pdf' : 'image/jpeg'),
        name: file.name
      });
      if (!reportTitle) {
        setReportTitle(`Analysis of ${file.name}`);
      }
      showToast(`Selected document "${file.name}" for analysis.`);
    };
    reader.onerror = () => {
      setAnalysisError('Failed to read the file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Authentication Check on startup
  useEffect(() => {
    const storedToken = localStorage.getItem('acuramed_token');
    const storedUser = localStorage.getItem('acuramed_user');
    
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('acuramed_token');
        localStorage.removeItem('acuramed_user');
      }
    }
  }, []);

  // Sync historical archives whenever User logs in or token is updated
  useEffect(() => {
    if (token) {
      fetchHistory();
    } else {
      setHistoryRecords([]);
    }
  }, [token]);

  const fetchHistory = async () => {
    if (!token) return;
    setHistoryLoading(true);
    try {
      const response = await fetch('/api/history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setHistoryRecords(data.history || []);
      }
    } catch (err) {
      console.error('Failed to load past scans:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Preset selected trigger
  const handleSelectPreset = (sample: MedicalSample) => {
    setUploadedFile(null);
    setReportText(sample.rawText);
    setReportTitle(sample.title);
    setPatientName(sample.patientName);
    setPatientAge(sample.age.toString());
    setPatientGender(sample.gender);
    setActiveTab('analyze');
    showToast(`Loaded preset "${sample.specialty}" report details. Feel free to modify or click submit.`);
  };

  const handleLoginSuccess = (usr: User, tkn: string) => {
    setUser(usr);
    setToken(tkn);
    localStorage.setItem('acuramed_token', tkn);
    localStorage.setItem('acuramed_user', JSON.stringify(usr));
    showToast(`Welcome back, ${usr.fullName}! Clinical workspace loaded.`);
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('acuramed_token');
    localStorage.removeItem('acuramed_user');
    setCurrentAnalysis(null);
    setActiveTab('analyze');
    showToast('Securely logged out from PranaScan clinical workspace.');
  };

  // Submit report parser
  const handleProcessAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportText.trim() && !uploadedFile) {
      setAnalysisError('Please provide raw report transcription text or upload a medical document (PDF/Image) to analyze.');
      return;
    }

    setSubmittingAnalysis(true);
    setAnalysisError(null);

    // Rotation of reassuring clinical loader messages. Highly professional UX
    const loaderMsgs = [
      'Initializing secure local clinical sandbox...',
      'Injecting unstructured document segments into clinical NLP engines...',
      'De-coding abbreviations and clinical shorthand notes...',
      'Evaluating anatomical bio-markers and vitals arrays...',
      'Compacting findings into patient-friendly empowerment guidelines...',
      'Polishing medical jargon annotations dictionary...'
    ];

    let msgIdx = 0;
    const interval = setInterval(() => {
      msgIdx = (msgIdx + 1) % loaderMsgs.length;
      setSubmissionMessage(loaderMsgs[msgIdx]);
    }, 2800);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          rawText: reportText,
          uploadedFile: uploadedFile || undefined,
          title: reportTitle.trim() || undefined,
          patientName: patientName.trim() || undefined,
          age: patientAge ? Number(patientAge) : undefined,
          gender: patientGender,
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'The parsing core rejected the report schema.');
      }

      // Load results in reviewer
      const finalRawText = reportText.trim() || `[Multimodal Document Uploaded: ${uploadedFile?.name || 'Medical File'}]`;
      setCurrentAnalysis(data.analysis);
      setCurrentRawText(finalRawText);
      setCurrentMetadata({
        patientName: patientName.trim() || undefined,
        age: patientAge ? Number(patientAge) : undefined,
        gender: patientGender,
        title: reportTitle.trim() || data.analysis.specialtyClassification + " Report Analysis",
        date: new Date().toISOString().split('T')[0]
      });

      // Clear the inputs on successful submission
      setReportText('');
      setUploadedFile(null);

      if (token) {
        fetchHistory(); // refresh sidebar history lists in background
        showToast('Analysis completed. Record saved to your cloud workspace.');
      } else {
        showToast('Analysis completed. Log in to permanently safe-keep records.');
      }
    } catch (err: any) {
      setAnalysisError(err.message || 'Transmission with clinical endpoints collapsed.');
    } finally {
      clearInterval(interval);
      setSubmittingAnalysis(false);
    }
  };

  // Delete historical scan
  const handleDeleteHistory = async (id: string) => {
    if (!token) return;
    if (!confirm('Are you absolute certain you want to remove this patient record permanently? This is irreversible.')) {
      return;
    }

    try {
      const response = await fetch(`/api/history/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        showToast('Patient record pruned.');
        fetchHistory();
        if (currentMetadata && currentMetadata.id === id) {
          setCurrentAnalysis(null);
        }
      }
    } catch (err) {
      showToast('Pruning operational error.');
    }
  };

  // Review a historic scan
  const handleReviewHistoricScan = (record: HistoryRecord) => {
    setCurrentAnalysis(record.analysis);
    setCurrentRawText(record.rawText);
    setCurrentMetadata({
      id: record.id,
      patientName: record.patientName,
      age: record.age,
      gender: record.gender,
      title: record.title,
      date: record.createdAt.substring(0, 10)
    });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col md:flex-row font-sans text-slate-800 antialiased relative overflow-x-hidden" id="clinic-app-root">
      {/* DYNAMIC AMBIENT 3D BACKGROUND WAVE LATTICE */}
      <Ambient3DBackground />
      
      {/* HEADER NAVBAR / LEFT SIDEBAR */}
      <Header 
        user={user} 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab);
          // If navigating back to scan, close reviewer unless viewing details
          if (tab !== 'analyze') {
            setCurrentAnalysis(null);
          }
        }} 
        onLogout={handleLogout}
        onOpenLogin={() => setShowLoginModal(true)}
      />

      {/* RIGHT WORKSPACE CONTEXT PANEL */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0 min-h-screen" id="main-workspace-pane">
        
        {/* WORKSPACE TOP CONSOLE HEADER ON DESKTOP */}
        <div className="hidden md:flex h-16 bg-white border-b border-slate-200 items-center justify-between px-8 sticky top-0 z-20 shrink-0" id="desktop-top-header">
          <div className="flex items-center gap-3">
            <h2 className="text-xs font-black text-[#0f172a] uppercase tracking-wider">
              {activeTab === 'analyze' && currentAnalysis ? 'Analysis Reviewer' : activeTab === 'analyze' ? 'Report Analyzer Core' : activeTab === 'presets' ? 'Clinical Datasets Catalog' : activeTab === 'history' ? 'Patient History Vault' : 'Empowerment Glossary Guides'}
            </h2>
            <div className="h-4 w-px bg-slate-200" />
            <span className="text-[10px] bg-[#f0f9ff] text-[#0369a1] border border-[#bae6fd] py-0.5 px-2 rounded-md font-mono font-bold tracking-tight uppercase">SECURE VAULT</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider">Secure Online Workspace</span>
          </div>
        </div>

        {/* TOAST SYSTEM ACCENTS */}
        {toastMessage && (
          <div className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-slate-800 text-white py-3 px-5 rounded-xl text-xs font-bold shadow-xl flex items-center gap-3 animate-slide-in" id="workspace-toast">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* MAIN CONTAINER */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* ACTIVE ANALYZED DETAILS VIEW OVERLAY (IF ANALYZING IS IN VIEW) */}
        {activeTab === 'analyze' && currentAnalysis ? (
          <ReportViewer 
            analysis={currentAnalysis}
            rawText={currentRawText}
            metadata={currentMetadata}
            onBack={() => {
              setCurrentAnalysis(null);
              setActiveTab('analyze');
            }}
            savedLocally={!!token}
          />
        ) : (
          <div>
            {/* VIEW DISPATCHING */}
            {activeTab === 'analyze' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                
                {/* FORM COLUMN */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Hero banner summary with high-tech 3D dark visuals */}
                  <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden shadow-cyan-950/25">
                    <div className="absolute inset-0 bg-[radial-gradient(#334155_1.2px,transparent_1.2px)] [background-size:16px_16px] opacity-25 pointer-events-none" />
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="relative z-10 space-y-2">
                      <div className="flex items-center gap-2 text-cyan-400 font-mono text-[10px] uppercase font-bold tracking-widest">
                        <Activity className="w-3.5 h-3.5 animate-pulse" />
                        <span>BIO-DATA INTERPRETATION SYSTEM ACTIVE</span>
                      </div>
                      <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">AI Medical Report Analyzer</h2>
                      <p className="text-xs md:text-sm text-slate-400 leading-relaxed max-w-2xl font-semibold">
                        Secure, AI-driven NLP diagnostic decoding terminal. Paste clinical transcription reports, physician charts or discharge summaries to instantly translate medical abbreviations, resolve structural terminology, and analyze dosage patterns.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleProcessAnalysis} className="bg-slate-950/80 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden shadow-indigo-950/20" id="analysis-input-form">
                    <div className="p-6 md:p-8 space-y-8 relative">
                      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] opacity-35 pointer-events-none" />
                      
                      {/* Section 1: File upload block */}
                      <div className="space-y-3 relative z-10" id="document-upload-section">
                        <div className="space-y-1">
                          <h3 className="text-xs font-black text-slate-200 tracking-wider uppercase flex items-center gap-2">
                            <Upload className="w-4 h-4 text-cyan-400 shrink-0" />
                            Clinical Document Upload (PDF or Image)
                          </h3>
                          <p className="text-xs text-slate-500 font-medium">Upload an anonymous diagnostic report, patient chart, lab tests PDF, or prescription image.</p>
                        </div>

                        {/* Interactive Drag and Drop Upload Zone */}
                        <div
                          onDragEnter={handleDrag}
                          onDragOver={handleDrag}
                          onDragLeave={handleDrag}
                          onDrop={handleDrop}
                          onClick={() => document.getElementById('clinical-file-picker')?.click()}
                          className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-3 relative overflow-hidden ${
                            dragActive 
                              ? 'border-cyan-400 bg-cyan-950/40 shadow-lg shadow-cyan-500/10' 
                              : uploadedFile 
                                ? 'border-emerald-500 bg-emerald-950/15' 
                                : 'border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/60'
                          }`}
                        >
                          <input
                            type="file"
                            id="clinical-file-picker"
                            className="hidden"
                            accept="application/pdf,image/*"
                            onChange={handleFileChange}
                            disabled={submittingAnalysis}
                          />

                          {uploadedFile ? (
                            <div className="flex flex-col items-center justify-center gap-2 w-full animate-fade-in" onClick={(e) => e.stopPropagation()}>
                              <div className="p-3 bg-emerald-950/80 border border-emerald-500/30 rounded-full text-emerald-400 shadow-xl shadow-emerald-950/30">
                                <FileUp className="w-6 h-6 animate-bounce" />
                              </div>
                              <div className="space-y-1 max-w-md">
                                <p className="text-xs font-bold text-slate-100 truncate">{uploadedFile.name}</p>
                                <p className="text-[10px] text-slate-400 font-mono uppercase font-bold tracking-wider">{uploadedFile.mimeType}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setUploadedFile(null)}
                                className="mt-2 text-[10px] font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 bg-rose-950/50 hover:bg-rose-950/80 px-2.5 py-1.5 rounded-md border border-rose-900/50 transition-colors cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                                Remove File
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center gap-2">
                              <div className={`p-3 rounded-full text-slate-400 transition-all ${dragActive ? 'bg-cyan-950 text-cyan-400' : 'bg-slate-950 border border-slate-850'}`}>
                                <Upload className="w-6 h-6 text-slate-400" />
                              </div>
                              <p className="text-xs text-slate-300 font-bold">
                                {dragActive ? "Drop the file here!" : "Drag & drop your medical document here, or click to browse"}
                              </p>
                              <p className="text-[10px] text-slate-500 font-medium">
                                Supports PDF, PNG, JPG, JPEG, WEBP, GIF (Max 10MB)
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Visual OR Separator */}
                      <div className="relative flex py-2 items-center z-10">
                        <div className="flex-grow border-t border-slate-800"></div>
                        <span className="flex-shrink mx-4 text-[10px] text-slate-500 font-extrabold uppercase tracking-widest bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800">OR</span>
                        <div className="flex-grow border-t border-slate-800"></div>
                      </div>

                      {/* Section 2: Transcription Paste input */}
                      <div className="space-y-3 relative z-10" id="transcription-paste-section">
                        <div className="space-y-1">
                          <h3 className="text-xs font-black text-slate-200 tracking-wide uppercase flex items-center gap-2">
                            <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                            Unstructured Transcription Paste Box
                          </h3>
                          <p className="text-xs text-slate-500 font-medium">Alternatively, paste clinical reports, general consult summaries, or hospital discharge papers.</p>
                        </div>

                        {analysisError && (
                          <div className="p-4 bg-rose-950/40 border border-rose-900/55 text-rose-200 text-xs font-semibold rounded-2xl flex items-start gap-2.5 animate-fade-in">
                            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 animate-pulse" />
                            <span>{analysisError}</span>
                          </div>
                        )}

                        <div className="relative group">
                          {/* Slashes/Corner markers to emphasize 3D UI depth */}
                          <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-slate-700 pointer-events-none group-focus-within:border-cyan-400 transition-colors" />
                          <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-slate-700 pointer-events-none group-focus-within:border-cyan-400 transition-colors" />
                          <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-slate-700 pointer-events-none group-focus-within:border-cyan-400 transition-colors" />
                          <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-slate-700 pointer-events-none group-focus-within:border-cyan-400 transition-colors" />

                          <textarea
                            placeholder={uploadedFile ? "Optional: Add extra clinical notes or guidelines to combine with the file analysis..." : "PASTE DISCHARGE SUMMARY OR CLINICAL TRANSCRIPT HERE...\ne.g., REASON FOR CONSULTATION: Evaluation of chest tightness on exertion escalating...\nPHYSICAL EXAMINATION: Vitals show BP 142/92, HR 82 bpm..."}
                            rows={10}
                            className="w-full p-4 font-mono text-[11px] leading-relaxed bg-[#030712]/50 border border-slate-800 rounded-xl focus:bg-slate-950 focus:outline-hidden focus:ring-2 focus:ring-cyan-950 focus:border-cyan-500 text-slate-100 select-all placeholder:text-slate-600 transition-all duration-200"
                            value={reportText}
                            onChange={(e) => setReportText(e.target.value)}
                            required={!uploadedFile}
                            disabled={submittingAnalysis}
                          />
                          {reportText && (
                            <button
                              type="button"
                              onClick={() => setReportText('')}
                              className="absolute top-3 right-3 text-[10px] bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 py-1 px-2.5 rounded-md font-bold transition-all active:scale-95 cursor-pointer"
                            >
                              Clear Text
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Section 3: Optional Patient Demographics & Identification */}
                      <div className="border-t border-slate-800 pt-6 space-y-4 relative z-10" id="patient-demographics-section">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                          <h4 className="text-xs font-black text-slate-200 tracking-wider uppercase">
                            Optional Patient Demographics & Identification
                          </h4>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="md:col-span-2">
                            <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Patient Key Name</label>
                            <input
                              type="text"
                              placeholder="e.g. Robert Miller"
                              className="w-full text-xs font-bold py-2.5 px-3 bg-[#030712]/40 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-600 focus:bg-slate-950 focus:outline-hidden focus:border-cyan-500 focus:ring-2 focus:ring-cyan-950 transition-all"
                              value={patientName}
                              onChange={(e) => setPatientName(e.target.value)}
                              disabled={submittingAnalysis}
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Age</label>
                            <input
                              type="number"
                              min="0"
                              max="125"
                              placeholder="e.g. 58"
                              className="w-full text-xs font-bold py-2.5 px-3 bg-[#030712]/40 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-600 focus:bg-slate-950 focus:outline-hidden focus:border-cyan-500 focus:ring-2 focus:ring-cyan-950 transition-all"
                              value={patientAge}
                              onChange={(e) => setPatientAge(e.target.value)}
                              disabled={submittingAnalysis}
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Physiological Sex</label>
                            <select
                              className="w-full text-xs font-bold py-2.5 px-3 bg-[#030712]/40 border border-slate-800 rounded-xl text-slate-150 focus:bg-slate-950 focus:outline-hidden focus:border-cyan-500 focus:ring-2 focus:ring-cyan-950 transition-all"
                              value={patientGender}
                              onChange={(e) => setPatientGender(e.target.value as any)}
                              disabled={submittingAnalysis}
                            >
                              <option value="Male" className="bg-slate-950 text-slate-200">Male</option>
                              <option value="Female" className="bg-slate-950 text-slate-200">Female</option>
                              <option value="Other" className="bg-slate-950 text-slate-200">Other</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Report Identification Summary Title</label>
                          <input
                            type="text"
                            placeholder="e.g. EGD Endoscopy Consultation Report - Chronic Gastritis"
                            className="w-full text-xs font-bold py-2.5 px-3 bg-[#030712]/40 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-600 focus:bg-slate-950 focus:outline-hidden focus:border-cyan-500 focus:ring-2 focus:ring-cyan-950 transition-all"
                            value={reportTitle}
                            onChange={(e) => setReportTitle(e.target.value)}
                            disabled={submittingAnalysis}
                          />
                        </div>
                      </div>

                    </div>

                    {/* Bottom Submission actions with 3D elements */}
                    <div className="p-6 bg-slate-950 border-t border-slate-900 flex items-center justify-between relative z-10">
                      <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest font-black">PranaScan Core: v3.5-flash-active</span>
                      <button
                        type="submit"
                        disabled={submittingAnalysis || (!reportText.trim() && !uploadedFile)}
                        className="bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white disabled:opacity-30 font-extrabold text-xs tracking-wider uppercase px-6 py-3.5 rounded-xl shadow-lg hover:shadow-cyan-500/20 active:scale-98 transition-all flex items-center gap-2 cursor-pointer border border-cyan-400/20"
                      >
                        <BrainCircuit className="w-4 h-4 shrink-0" />
                        Summarize & Decode Jargon
                      </button>
                    </div>
                  </form>
                </div>

                {/* SIDEBAR SUBSECTION (WIDGET PANEL) */}
                <div className="space-y-6">
                  
                  {/* 3D BIO-MATHEMATICAL VISUALS WIDGET */}
                  <Medical3DVisualizer />

                  {/* DATASETS INTRO MODULE ACCENTS */}
                  <div className="bg-slate-900 text-white rounded-3xl p-5 md:p-6 space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/10 shadow-inner">
                        <FileDigit className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-150">Load Sample Demographics</h4>
                        <p className="text-[11px] text-slate-400 leading-normal mt-0.5 font-medium">
                          Quickly click to load realistic medical transcript samples from the clinical datasets index.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab('presets')}
                      className="w-full bg-slate-800 hover:bg-slate-750 text-white border border-slate-700 py-2.5 rounded-xl text-xs font-semibold transition-all hover:tracking-wide"
                    >
                      Browse Medical Transcriptions
                    </button>
                  </div>

                  {/* MINI HISTORIC HISTORY RECORDS SIDEBAR WITH 3D DARK VISUALS */}
                  <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 md:p-6 space-y-4 shadow-xl relative overflow-hidden shadow-indigo-950/15" id="history-sidebar-widget">
                    <div className="absolute inset-0 bg-[radial-gradient(#334155_1.2px,transparent_1.2px)] [background-size:16px_16px] opacity-20 pointer-events-none" />
                    
                    <div className="relative z-10 flex items-center justify-between border-b border-slate-800 pb-2">
                      <h3 className="text-xs font-black text-slate-100 uppercase tracking-widest">
                        Recent Annotation History
                      </h3>
                      <div className="flex items-center gap-1 font-mono text-[8px] text-slate-550">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                        <span>VAULT</span>
                      </div>
                    </div>

                    {!user ? (
                      <div className="space-y-3.5 text-center py-5 bg-slate-900/60 rounded-2xl border border-slate-900/80 p-4 relative z-10">
                        <p className="text-[11px] text-slate-400 leading-normal font-semibold">
                          Sign in to create a secure medical folder and permanently archive clinical scans.
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowLoginModal(true)}
                          className="inline-flex text-[10px] bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 hover:from-cyan-500/20 hover:to-indigo-500/20 text-cyan-300 border border-cyan-500/30 font-bold px-3 py-1.5 rounded-lg transition-transform active:scale-95 cursor-pointer"
                        >
                          Unlock Secure Storage
                        </button>
                      </div>
                    ) : historyLoading ? (
                      <div className="flex items-center gap-2 py-4 z-10 relative">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                        <p className="text-xs text-slate-400 italic">Syncing clinical files...</p>
                      </div>
                    ) : historyRecords.length === 0 ? (
                      <p className="text-[11px] text-slate-500 italic py-4 text-center relative z-10">No annotated logs found. Run a scan to populate archives.</p>
                    ) : (
                      <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 relative z-10" id="sidebar-history-list">
                        {historyRecords.slice(0, 5).map((rec) => (
                          <div 
                            key={rec.id}
                            onClick={() => handleReviewHistoricScan(rec)}
                            className="p-3 bg-slate-900/40 hover:bg-slate-900/80 rounded-xl border border-slate-800 hover:border-slate-700 cursor-pointer transition-all duration-200 group"
                          >
                            <p className="text-xs font-bold text-slate-200 truncate group-hover:text-cyan-400 transition-colors">{rec.patientName || "Anonymous Patient"}</p>
                            <div className="flex justify-between items-center text-[10px] text-slate-500 font-semibold mt-1">
                              <span className="bg-cyan-950/40 text-cyan-450 border border-cyan-950/20 px-1.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase shrink-0">{rec.specialty}</span>
                              <span className="truncate ml-1 text-slate-500">{rec.createdAt.substring(0, 10)}</span>
                            </div>
                          </div>
                        ))}
                        {historyRecords.length > 5 && (
                          <button
                            type="button"
                            onClick={() => setActiveTab('history')}
                            className="w-full text-center text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors mt-2 block"
                          >
                            View all {historyRecords.length} records →
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                </div>

              </div>
            )}

            {activeTab === 'presets' && (
              <PresetSelector 
                onSelect={handleSelectPreset} 
                onNavigateToAnalyze={() => setActiveTab('analyze')}
              />
            )}

            {activeTab === 'projection' && (
              <div className="space-y-6" id="3d-projection-lab-wrapper">
                <Medical3DVisualizer isWidescreenShowcase={true} />
              </div>
            )}

            {activeTab === 'history' && (
              <HistoryList 
                records={historyRecords}
                loading={historyLoading}
                onSelectRecord={handleReviewHistoricScan}
                onDeleteRecord={handleDeleteHistory}
                onNavigateToAnalyze={() => setActiveTab('analyze')}
              />
            )}

            {activeTab === 'guide' && (
              <PatientGuide />
            )}

            {activeTab === 'diagnose' && (
              <SymptomDiagnostics />
            )}
          </div>
        )}

      </main>

      {/* Patient Advisory Disclaimer Bar - Shuffled to the bottom row as requested */}
      <div className="bg-amber-50 text-amber-900 px-6 py-2.5 text-xs text-center border-y border-amber-200 font-extrabold flex items-center justify-center gap-2 print:hidden shrink-0" id="medical-disclaimer-banner">
        <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
        <span>
          <strong>Patient Advisory:</strong> Non-diagnostic AI assistant. All insights should be verified by professional clinicians.
        </span>
      </div>

      {/* FOOTER ADVISORIES */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-16 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-400 space-y-4 font-medium">
          <div>
            <p>© {new Date().getFullYear()} PranaScan AI Platform (HealthTech Systems). Certified secure client logs repository.</p>
            <p className="max-w-2xl mx-auto italic text-[10px] leading-normal text-slate-400 mt-1">
              PranaScan employs high-performance language modeling processors to identify biomedical clinical segments, terms, and acronyms. This process remains entirely non-diagnostic, educational, and represents standard clinical semantic processing. Always double-check physical files or original PDFs.
            </p>
          </div>

          {/* 3D Dark Visuals Row */}
          <div className="py-2 max-w-2xl mx-auto">
            <Footer3DVisuals />
          </div>
        </div>
      </footer>

      </div>

      {/* SECURE AUTH MODALS */}
      {showLoginModal && (
        <LoginModal 
          onCheckAuth={() => {}} 
          onClose={() => setShowLoginModal(false)}
          onSuccess={handleLoginSuccess}
        />
      )}

      {/* SUBMISSION / ANALYZING PROGRESS OVERLAY screen */}
      {submittingAnalysis && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4" id="clinical-processing-barrier">
          <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-2xl relative overflow-hidden max-w-sm w-full text-center space-y-6">
            
            {/* Top scanning animation bar */}
            <div className="absolute top-0 inset-x-0 h-1 bg-blue-650 animate-pulse" />

            <div className="relative inline-flex items-center justify-center">
              {/* Outer Pulsing Aura Circle */}
              <div className="absolute w-20 h-20 bg-blue-100/60 rounded-full animate-ping pointer-events-none" />
              <div className="relative bg-blue-50 text-blue-600 p-5 rounded-2xl border border-blue-100">
                <BrainCircuit className="w-10 h-10 animate-pulse text-blue-600" />
              </div>
            </div>

            <div className="space-y-2 text-center">
              <h4 className="text-base font-bold text-slate-900">Clinical Parser Active</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto animate-pulse font-bold text-blue-700 bg-blue-50/50 p-2 rounded-xl border border-dashed border-blue-100">
                {submissionMessage}
              </p>
            </div>

            <div className="pt-2">
              <div className="w-24 bg-slate-100 rounded-full h-1 mx-auto overflow-hidden">
                <div className="h-full bg-blue-600 animate-infinite-loading w-1/2 rounded-full" style={{ animation: 'loading-strip 1.5s infinite linear' }} />
              </div>
              <p className="text-[10px] text-slate-400 mt-3 font-semibold uppercase tracking-widest">Medical NLP Annotation</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
