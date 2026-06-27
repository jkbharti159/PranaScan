import { GoogleGenAI, Type } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined. Please configure it in your AI Studio Secrets panel.");
    }
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

/**
 * Executes a Gemini content generation call with exponential backoff retries on 503/429/UNAVAILABLE errors
 * and falls back to a secondary model if the primary model continues to experience disruptions.
 */
async function generateContentWithRetryAndFallback(
  ai: GoogleGenAI,
  options: {
    model: string;
    fallbackModel?: string;
    contents: any;
    config: any;
    retries?: number;
    delay?: number;
  }
) {
  let currentModel = options.model;
  let attempt = 0;
  const maxRetries = options.retries ?? 3;
  let currentDelay = options.delay ?? 1200;

  while (attempt <= maxRetries) {
    try {
      const response = await ai.models.generateContent({
        model: currentModel,
        contents: options.contents,
        config: options.config,
      });
      return response;
    } catch (error: any) {
      const errorMessage = String(error?.message || error || "");
      const isRateLimitOr503 = 
        errorMessage.includes("503") || 
        errorMessage.includes("demand") || 
        errorMessage.includes("UNAVAILABLE") || 
        errorMessage.includes("429") || 
        errorMessage.includes("ResourceExhausted") ||
        error?.status === 503 ||
        error?.status === 429 ||
        error?.status === "UNAVAILABLE";

      if (isRateLimitOr553Error(error, errorMessage) && attempt < maxRetries) {
        attempt++;
        console.warn(`[Gemini SDK] High demand/503 on model ${currentModel} (attempt ${attempt}/${maxRetries}). Retrying in ${currentDelay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, currentDelay));
        currentDelay *= 2; // Exponential backoff
        continue;
      }

      // Try fallback model if we have one and we're on the primary model
      if (isRateLimitOr553Error(error, errorMessage) && options.fallbackModel && currentModel !== options.fallbackModel) {
        console.warn(`[Gemini SDK] Model ${currentModel} failed after retries. Switching to fallback model: ${options.fallbackModel}`);
        currentModel = options.fallbackModel;
        attempt = 0; // Reset attempt count for fallback model
        currentDelay = options.delay ?? 1000; // Reset delay
        continue;
      }

      // Propagate original error to be displayed elegantly on the client
      throw error;
    }
  }
  throw new Error("Could not contact the clinical parsing parser due to transient upstream network spikes. Please retry shortly.");
}

function isRateLimitOr553Error(error: any, message: string): boolean {
  return (
    message.includes("503") || 
    message.includes("demand") || 
    message.includes("UNAVAILABLE") || 
    message.includes("429") || 
    message.includes("ResourceExhausted") ||
    error?.status === 503 ||
    error?.status === 429 ||
    error?.status === "UNAVAILABLE"
  );
}

export interface AnalysisResult {
  patientFriendlySummary: string;
  specialtyClassification: string;
  severityLevel: 'Low/Routine' | 'Medium/Follow-up' | 'High/Consultation' | 'Urgent';
  severityExplanation: string;
  clinicalFindings: Array<{
    finding: string;
    details: string;
    significance: 'Routine' | 'Needs Attention' | 'Action Required';
  }>;
  medicalJargonTerms: Array<{
    term: string;
    description: string;
    plainEnglish: string;
  }>;
  entities: {
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
  };
  suggestedDoctorQuestions: string[];
}

export interface UploadedFile {
  data: string;
  mimeType: string;
  name: string;
}

export async function analyzeMedicalReport(
  rawText: string,
  file?: UploadedFile
): Promise<AnalysisResult> {
  const ai = getGeminiClient();

  // If a file is uploaded but no rawText is provided, adjust prompt context
  const textContext = rawText && rawText.trim() 
    ? rawText 
    : "No additional copy-pasted text was provided. Please analyze the attached medical document file/image directly.";

  const prompt = `You are an expert HealthTech and Natural Language Processing (NLP) system specializing in clinical linguistics, medical entity translation, and clinical transcription summaries.
Your task is to analyze the following raw medical report, transcription, or patient record:

---
${textContext}
---

Extract clinical insights and produce a fully annotated patient empowerment analysis in JSON format.
You must return a valid JSON object matching the following TypeScript interface structure (do not return any other text, just the raw JSON):

interface AnalysisResult {
  patientFriendlySummary: string; // Empathetic, plain-language description translating the key findings. Keep it highly concise (limit to 2-3 clear, high-impact sentences) to avoid processing latency.
  specialtyClassification: string; // The primary medical specialty involved (e.g. Cardiology, Neurology, Orthopedics, General Surgery, Gastroenterology, Pulmonology, etc.)
  severityLevel: 'Low/Routine' | 'Medium/Follow-up' | 'High/Consultation' | 'Urgent'; 
  severityExplanation: string; // Concise explanation of what this rating represents for the patient. Explain that this is a non-diagnostic classification.
  clinicalFindings: Array<{
    finding: string; // Specific physical, laboratory, or radiological finding extracted from the text (e.g., "Left Meniscal Tear")
    details: string; // Concise explanation of what this finding physically means in the body
    significance: 'Routine' | 'Needs Attention' | 'Action Required'; // Priority flag based on report urgency
  }>; // Extract at most 4 key findings to minimize latency.
  medicalJargonTerms: Array<{
    term: string; // The acronym, abbreviation, or complex medical terminology found (e.g. "dyspnea", "CLOtest")
    description: string; // Precise medical definitions
    plainEnglish: string; // Friendly, approachable translation (e.g., "shortness of breath")
  }>; // Extract at most 4 key terms to minimize latency.
  entities: {
    medications: Array<{
      name: string; // Name of drug (e.g. "Lisinopril")
      purpose: string; // Medical purpose (e.g. "Blood pressure manager")
      dosageInstruction: string; // Extracted dose and frequency (e.g. "20mg daily")
    }>;
    procedures: Array<{
      name: string; // E.g., "Endoscopy", "Biopsy"
      purpose: string; // Purpose of the procedure
      status: string; // "Completed", "Scheduled", "Recommended", or "Underway"
    }>;
    vitalSigns: Array<{
      signal: string; // E.g., "Blood Pressure", "Heart Rate"
      value: string; // Value found
      interpretation: string; // E.g., "Slightly Elevated", "Optimal"
    }>;
  };
  suggestedDoctorQuestions: string[]; // Practical, empowering questions that the patient can ask their physician. Limit to 3 key questions max.
}

Be extremely concise, clear, and direct. Avoid any verbose or fluffy text. Your focus is translation, patient education, and fast processing. Generate non-diagnostic insights and explicitly state the clinical context. Do not leave any fields empty. Ensure that if there are no medications, procedures, or vitals present in the text/file, you still return a clean empty array rather than null. Limit extracted lists (findings, jargon, questions) to a maximum of 3-4 high-yield items each to maintain ultra-fast generation times.`;

  // Build the parts arrays to handle multimodal input properly via GoogleGenAI SDK
  const contents: any[] = [];
  
  if (file) {
    // Strip the potential data URL scheme prefix if present (e.g. "data:application/pdf;base64,")
    let base64Data = file.data;
    if (base64Data.includes(",")) {
      base64Data = base64Data.split(",")[1];
    }
    
    contents.push({
      inlineData: {
        data: base64Data,
        mimeType: file.mimeType
      }
    });
  }
  
  contents.push({
    text: prompt
  });

  const response = await generateContentWithRetryAndFallback(ai, {
    model: "gemini-3.5-flash",
    fallbackModel: "gemini-3.1-flash-lite",
    contents: contents,
    config: {
      systemInstruction: "You are a state-of-the-art medical NLP and patient-friendly report annotation assistant. You process unstructured clinical texts or uploaded document files (PDFs/Images) directly, extract medical metadata, translate complex vocabulary, and structure the data into high-fidelity JSON objects safely.",
      responseMimeType: "application/json",
      temperature: 0.1,
    }
  });

  const text = response.text;
  if (!text) {
    throw new Error("Unable to extract response from Gemini model.");
  }

  try {
    const cleanedText = text.trim();
    const resultObj: AnalysisResult = JSON.parse(cleanedText);
    return resultObj;
  } catch (error) {
    console.error("Failed to parse Gemini JSON output. Raw response was:", text);
    throw new Error("Clinical annotation engine returned a malformed response format. Please try analyzing again.");
  }
}

export interface DiagnosisResult {
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

export async function diagnosePossibleDisease(
  symptoms: string,
  currentMedications: string,
  previousTreatments: string
): Promise<DiagnosisResult> {
  const ai = getGeminiClient();

  const prompt = `You are a world-class clinical diagnostic AI assistant specializing in symptom analysis, pharmacovigilance, medication correlation, and patient clinical advice.
Your task is to analyze the following patient details:

---
PATIENT COMPLAINT / SYMPTOMS:
${symptoms}

CURRENT MEDICATIONS & DOSAGE:
${currentMedications || "None specified or no active medications"}

PREVIOUS TREATMENTS / EXPERIENCES:
${previousTreatments || "None specified or no previous clinical treatments"}
---

Based on these clinical parameters, evaluate possible underlying conditions or diseases, explore potential interactions/safety signals with current medications, and compile a structured, patient-centric diagnosis guide.

Your response must be a single, valid JSON object matching the following structure (do not return any other text, markdown formatting, or wrappers other than the exact compliant JSON):

{
  "possibleDiagnoses": [
    {
      "disease": "Disease Name or Clinical Condition",
      "likelihood": "High" | "Medium" | "Low",
      "explanation": "Detailed physiological explanation linking their specific symptoms to this condition, translating pathological terms into approachable but precise clinical context.",
      "symptomMatching": ["Symptom A from input", "Symptom B from input"],
      "treatmentConnection": "Explanation of how current medications or past treatments correlate here (e.g., is this medication typically used to treat this condition? Or can this transition be a side effect? Or can it mask indicators?)"
    }
  ],
  "medicationSafetyAnalysis": [
    {
      "medication": "Name of medication being evaluated",
      "purpose": "Clinical purpose of this medicine based on context",
      "safetyNote": "A helpful notice on potential interactions with symptoms (e.g., if experiencing symptom X, caution must be exercised with medication Y because...)"
    }
  ],
  "redFlags": [
    "Crucial clinical warning sign or emergency physical symptom to watch out for, describing when the patient must seek urgent emergency care immediately."
  ],
  "nextSteps": [
    "Practical, actionable non-diagnostic recommendations (e.g., keeping a daily symptom log, specific specialists to consult, standard diagnostic labs a doctor might recommend to verify)."
  ],
  "disclaimer": "A warm, high-integrity medical safety disclaimer clarifying that this is an AI-powered advisory tool, not a professional diagnostic decision, and that the patient must consult an authenticated healthcare practitioner."
}

Please make your assessment highly robust, thoroughly evaluating interactions and symptoms. Return at least 2 or 3 high-fidelity possible conditions unless the symptoms are extremely narrow.`;

  const response = await generateContentWithRetryAndFallback(ai, {
    model: "gemini-3.5-flash",
    fallbackModel: "gemini-3.1-flash-lite",
    contents: prompt,
    config: {
      systemInstruction: "You are an expert diagnostic assistant. Analyze patient complaints and ongoing medications to suggest potential underlying diseases and deliver structured pharmacovigilance advice safely in JSON format.",
      responseMimeType: "application/json",
      temperature: 0.15,
    }
  });

  const text = response.text;
  if (!text) {
    throw new Error("Unable to extract diagnostic response from Gemini.");
  }

  try {
    const cleanedText = text.trim();
    const resultObj: DiagnosisResult = JSON.parse(cleanedText);
    return resultObj;
  } catch (error) {
    console.error("Failed to parse diagnosis JSON. Raw output was:", text);
    throw new Error("Diagnostic engine returned an unreadable structured format. Please retry your symptom evaluation.");
  }
}

export async function translatePatientSummaryHindi(textToTranslate: string): Promise<string> {
  const ai = getGeminiClient();

  const prompt = `You are an expert clinical translator specializing in medical-to-Hindi semantic translation.
Translate the following patient-friendly clinical report summary accurately into pure, approachable, and highly readable Hindi using the Devanagari script.

Guidelines:
1. Translate medically complex scenarios into simple, patient-relatable Hindi (avoid overly dense or formal academic terms from pure Sanskrit/Persian if common Hindustani equivalents are clearly understood).
2. Maintain high supportive empathy and reassurance.
3. Keep formatting (bullet points, spacing) structurally accurate.
4. Output ONLY the translated content with no extra outer wrappers, conversational text, or prefixes.

Text to translate:
"${textToTranslate}"`;

  const response = await generateContentWithRetryAndFallback(ai, {
    model: "gemini-3.5-flash",
    fallbackModel: "gemini-3.1-flash-lite",
    contents: prompt,
    config: {
      systemInstruction: "You are a professional clinical translator specializing in English to Hindi medical translations. Translate the provided text directly and return only the translated content.",
      temperature: 0.2,
    }
  });

  const output = response.text;
  if (!output) {
    throw new Error("Failed to receive translation response from Gemini.");
  }
  return output.trim();
}


