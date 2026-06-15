import React, { useState } from 'react';
import { HistoryRecord } from '../types.js';
import { Search, FolderHeart, Calendar, Trash2, Eye, UserPlus, FileHeart } from 'lucide-react';

interface HistoryListProps {
  records: HistoryRecord[];
  loading: boolean;
  onSelectRecord: (record: HistoryRecord) => void;
  onDeleteRecord: (id: string) => void;
  onNavigateToAnalyze: () => void;
}

export default function HistoryList({ records, loading, onSelectRecord, onDeleteRecord, onNavigateToAnalyze }: HistoryListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('All');

  const specialties = ['All', ...Array.from(new Set(records?.map(r => r.specialty).filter(Boolean) || []))];

  const filteredRecords = (records || []).filter(record => {
    const matchesSearch = 
      record.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.rawText.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSpecialty = specialtyFilter === 'All' || record.specialty === specialtyFilter;
    
    return matchesSearch && matchesSpecialty;
  });

  const getPriorityBadgeColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'urgent':
        return 'bg-rose-950/40 text-rose-400 border border-rose-900/50';
      case 'high/consultation':
        return 'bg-amber-950/40 text-amber-400 border border-amber-900/50';
      case 'medium/follow-up':
        return 'bg-cyan-950/40 text-cyan-400 border border-cyan-900/50';
      default:
        return 'bg-slate-900/40 text-slate-400 border border-slate-800';
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-[#0f172a] via-[#090d1a] to-[#040815] border-2 border-slate-800 rounded-3xl p-12 text-center space-y-4 shadow-2xl relative overflow-hidden" id="history-loading">
        <div className="absolute inset-0 bg-[radial-gradient(#0891b2_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-10 pointer-events-none" />
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto relative z-10" />
        <p className="text-sm font-semibold text-slate-400 font-mono tracking-wide animate-pulse relative z-10">Decrypting clinical records...</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-[#0f172a] via-[#090d1a] to-[#040815] border-2 border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-left space-y-6 animate-fade-in" id="history-list-workspace">
      {/* 3D background dot matrix */}
      <div className="absolute inset-0 bg-[radial-gradient(#0891b2_1.2px,transparent_1.2px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

      <div className="relative z-10 space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="text-left">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <FolderHeart className="w-5 h-5 text-cyan-400 animate-pulse" />
              Patient Clinical Records
            </h2>
            <p className="text-xs text-slate-400 mt-1 font-medium leading-relaxed">
              Manage, search, and review securely processed report insights with geometric record tracking.
            </p>
          </div>

          <button
            onClick={onNavigateToAnalyze}
            className="bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl px-4 py-2.5 text-xs font-black shadow-lg shadow-cyan-950/20 transition-all flex items-center gap-1.5 self-stretch md:self-auto justify-center cursor-pointer border border-cyan-400/20"
          >
            <UserPlus className="w-4 h-4" />
            New Report Analysis
          </button>
        </div>

        {records.length === 0 ? (
          <div className="bg-slate-950/50 border border-slate-800 rounded-3xl p-12 text-center max-w-xl mx-auto space-y-4 shadow-inner relative overflow-hidden" id="history-empty-state">
            <div className="w-16 h-16 bg-cyan-950/40 border border-cyan-800/30 rounded-2xl flex items-center justify-center mx-auto text-cyan-400">
              <FileHeart className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-100">No report scans saved yet</h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                Please run active analyses while logged in, and they will automatically populate here in your clinician workspace.
              </p>
            </div>
            <button
              onClick={onNavigateToAnalyze}
              className="inline-flex items-center gap-1.5 bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 hover:from-cyan-500/20 hover:to-indigo-500/20 text-cyan-350 border border-cyan-500/30 font-bold px-4 py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
            >
              Submit your first report annotation
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* SEARCH & FILTERS CONTROLS */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-3 relative overflow-hidden shadow-xl" id="history-search-filter-box">
              <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-15 pointer-events-none" />
              <div className="relative w-full sm:flex-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Search className="w-4 h-4 text-slate-500" />
                </span>
                <input
                  type="text"
                  placeholder="Search patient, specialty or transcription content..."
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-900/50 border border-slate-800 rounded-xl focus:bg-slate-950/80 focus:border-cyan-500/70 focus:ring-2 focus:ring-cyan-950 focus:outline-hidden text-slate-200 placeholder:text-slate-500 font-bold transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-black text-slate-400 shrink-0 uppercase tracking-widest font-mono">Specialty:</span>
                <select
                  className="block w-full sm:w-44 py-2 px-3 text-sm bg-slate-900/60 border border-slate-800 rounded-xl focus:bg-slate-950 focus:outline-hidden text-slate-300 font-bold cursor-pointer"
                  value={specialtyFilter}
                  onChange={(e) => setSpecialtyFilter(e.target.value)}
                >
                  {specialties.map(spec => (
                    <option key={spec} value={spec} className="bg-slate-950 text-slate-200">{spec}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* RECORDS GRID */}
            {filteredRecords.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs font-semibold bg-slate-950/60 border border-slate-800 rounded-2xl">
                No clinical logs matched your search terms or filters.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="history-grid-container">
                {filteredRecords.map((record) => (
                  <div
                    key={record.id}
                    className="bg-slate-950/70 hover:bg-slate-950/95 border border-slate-800 hover:border-cyan-500/40 shadow-xl hover:shadow-cyan-950/10 transition-all duration-300 flex flex-col justify-between overflow-hidden relative group"
                    id={`history-record-${record.id}`}
                  >
                    <div className="p-5 space-y-4">
                      {/* Badge & Date */}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] bg-cyan-950/40 border border-cyan-900/50 text-cyan-400 py-0.5 px-2.5 rounded-full font-bold uppercase tracking-wider">
                          {record.specialty}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          {new Date(record.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>

                      <div className="space-y-1 text-left">
                        <h4 className="text-base font-black text-slate-100 group-hover:text-cyan-400 transition-colors line-clamp-1 leading-snug">
                          {record.patientName}
                        </h4>
                        <p className="text-xs font-semibold text-slate-400">
                          {record.gender}, {record.age} Years Old
                        </p>
                      </div>

                      <div className="border-t border-slate-900 pt-3 text-left">
                        <p className="text-xs font-extrabold text-slate-250 line-clamp-1">
                          {record.title}
                        </p>
                        <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-relaxed font-normal italic bg-[#030712]/50 border border-slate-800 p-2.5 rounded-lg select-all">
                          {record.rawText}
                        </p>
                      </div>

                      {/* Urgency Rating pill */}
                      {record.analysis?.severityLevel && (
                        <div className={`mt-2 py-1 px-3 text-[11px] font-bold border rounded-lg text-left ${getPriorityBadgeColor(record.analysis.severityLevel)}`}>
                          Primary Classification: {record.analysis.severityLevel}
                        </div>
                      )}
                    </div>

                    {/* BOTTOM ACTIONS */}
                    <div className="bg-[#040815]/50 p-3 h-14 border-t border-slate-900 flex items-center justify-between">
                      <button
                        onClick={() => onSelectRecord(record)}
                        className="text-xs font-bold text-slate-300 hover:text-cyan-400 transition-all flex items-center gap-1.5 bg-[#0e1424]/60 hover:bg-[#0e1424] py-1.5 px-3 rounded-md border border-slate-800 cursor-pointer"
                      >
                        <Eye className="w-4 h-4 text-cyan-400" />
                        Review Parsing
                      </button>

                      <button
                        onClick={() => onDeleteRecord(record.id)}
                        className="text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/35 transition-colors p-2 rounded-md cursor-pointer"
                        title="Delete Record Permanently"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
