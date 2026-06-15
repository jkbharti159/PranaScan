export interface User {
  id: string;
  username: string;
  fullName: string;
  role: 'clinician' | 'patient' | 'analyst';
  createdAt?: string;
}

export interface ClinicalFinding {
  finding: string;
  details: string;
  significance: 'Routine' | 'Needs Attention' | 'Action Required';
}

export interface MedicalJargon {
  term: string;
  description: string;
  plainEnglish: string;
}

export interface ExtractedEntities {
  medications: Array<{
    name: string;
    purpose: string;
    dosageInstruction: string;
  }>;
  procedures: Array<{
    name: string;
    purpose: string;
    status: string;
  }>;
  vitalSigns: Array<{
    signal: string;
    value: string;
    interpretation: string;
  }>;
}

export interface AnalysisResult {
  patientFriendlySummary: string;
  specialtyClassification: string;
  severityLevel: 'Low/Routine' | 'Medium/Follow-up' | 'High/Consultation' | 'Urgent';
  severityExplanation: string;
  clinicalFindings: ClinicalFinding[];
  medicalJargonTerms: MedicalJargon[];
  entities: ExtractedEntities;
  suggestedDoctorQuestions: string[];
}

export interface HistoryRecord {
  id: string;
  userId: string;
  title: string;
  patientName: string;
  age: number;
  gender: string;
  specialty: string;
  rawText: string;
  analysis: AnalysisResult;
  createdAt: string;
}

export type ActiveTab = 'analyze' | 'diagnose' | 'projection' | 'history' | 'presets' | 'guide';
