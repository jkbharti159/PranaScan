export interface MedicalSample {
  id: string;
  title: string;
  specialty: string;
  patientName: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  date: string;
  rawText: string;
  vitals?: {
    bp?: string; // Blood pressure, e.g. "135/85"
    hr?: number;  // Heart rate, bpm, e.g. 78
    temp?: number; // Body temperature, F, e.g. 98.6
    spo2?: number; // SpO2, %, e.g. 98
    weight?: string; // Weight, lbs or kg
  };
}

export const MEDICAL_SAMPLES: MedicalSample[] = [
  {
    id: "cardio-01",
    title: "Cardiology Consult - Mild Hypertension & Dyspnea",
    specialty: "Cardiology",
    patientName: "Robert Miller",
    age: 58,
    gender: "Male",
    date: "2026-05-14",
    vitals: {
      bp: "142/92",
      hr: 82,
      temp: 98.4,
      spo2: 96,
      weight: "192 lbs"
    },
    rawText: `REASON FOR CONSULTATION:
Evaluation of atypical chest pressure and mild dyspnea on exertion, escalating over the past 3 weeks.

HISTORY OF PRESENT ILLNESS:
The patient is a 58-year-old male with a history of essential hypertension and hyperlipidemia. He reports experiencing transient, substernal tightness when walking up steep inclines. The pressure typically resolves within 5 minutes of rest. No diaphoresis, radiation to the left arm, or syncope reported. Active medications include lisinopril 10mg daily and atorvastatin 20mg daily. He admits to inconsistent medication compliance.

PHYSICAL EXAMINATION:
GENERAL: Well-developed, mildly obese male in no acute distress.
VITAL SIGNS: BP: 142/92 mmHg, HR: 82 bpm, Temp: 98.4 F, SpO2: 96% on room air.
HEART: Normal S1 and S2. No S3, S4, or murmur detected. Regular rhythm.
LUNGS: Clear to auscultation bilaterally. No wheezes, rales, or rhonchi.
EXTREMITIES: No trace peripheral edema. Warm and well-perfused.

DIAGNOSTIC WORKUP & EKG:
Electrocardiogram (EKG) demonstrates normal sinus rhythm at 80 bpm with borderline left ventricular hypertrophy (LVH) criteria. No acute ST-segment or T-wave abnormalities identified.

IMPRESSION & CLINICAL PLAN:
1. ATYPICAL CHEST PAIN / RULE OUT CORONARY ARTERY DISEASE (CAD): Symptomatology is concerning for stable angina. Schedule outpatient myocardial perfusion imaging (nuclear stress test) to evaluate for inducible myocardial ischemia.
2. STAGE II HYPERTENSION (UNCONTROLLED): Elevated BP currently at 142/92. Increase lisinopril to 20mg daily. Reemphasize strict daily compliance and self-monitoring of BP at home.
3. HYPERLIPIDEMIA: Continue atorvastatin 20mg daily. Draw fasting lipid panel on follow-up visit.
4. LIFESTYLE MODIFICATIONS: Urged low-sodium dietary restrictions and a structured cardiovascular exercise regimen (at least 30 minutes of brisk walking 5 days a week). Avoid isometric lifting. MD warning issued regarding immediate cessation of exertion upon onset of symptoms.`
  },
  {
    id: "ortho-02",
    title: "Knee MRI Report - Left Meniscal Tear Evaluation",
    specialty: "Orthopedics",
    patientName: "Sarah Jenkins",
    age: 34,
    gender: "Female",
    date: "2026-06-02",
    vitals: {
      bp: "118/74",
      hr: 68,
      temp: 98.6,
      spo2: 99,
      weight: "145 lbs"
    },
    rawText: `EXAMINATION:
Magnetic Resonance Imaging (MRI) of the left knee without intravenous contrast.

CLINICAL HISTORY:
The patient is a 34-year-old female who experienced an acute twisting injury of the left knee while running outdoors 10 days ago. Complains of posterior-medial joint line pain, mechanical clicking, and a feeling of giving way. Physical exam reveals positive McMurray test on medial rotation and localized tenderness along the medial joint line.

FINDINGS:
MEDIAL MENISCUS: There is a high signal intensity line extending to the inferior articular surface of the posterior horn of the medial meniscus, consistent with an oblique Grade II/III medial meniscal tear. Minimal parameniscal fluid is visualized.
LATERAL MENISCUS: Intact. No evidence of horizontal or vertical tear.
LIGAMENTS: Anterior Cruciate Ligament (ACL) and Posterior Cruciate Ligament (PCL) are intact with normal trajectory and signal characteristics. Medial Collateral Ligament (MCL) shows mild increased signal, suggesting a Grade I sprain. Lateral Collateral Ligament (LCL) is unremarkable.
CARTILAGE & BONES: Normal cartilage thickness along the patellofemoral joint. No focal subchondral microfracture or bone marrow edema.
EFFUSION: Mild-to-moderate reactive joint effusion in the suprapatellar bursa.

IMPRESSION & RECOMMENDATIONS:
1. Grade II oblique tear of the posterior horn of the medial meniscus.
2. Grade I sprain of the Medial Collateral Ligament (MCL), representing micro-fiber stretching but no complete macroscopic disruption.
3. Mild reactive joint effusion.
Clinical decision: Recommend conservative management initially: compression sleeve, R.I.C.E protocol, and targeted physical therapy concentrating on quadriceps strengthening for 6 weeks. If persistent locking, mechanical block, or severe mechanical instability occurs, outpatient arthroscopic partial meniscectomy may be indicated.`
  },
  {
    id: "gi-03",
    title: "Esophagogastroduodenoscopy (EGD) - Chronic Gastritis Assessment",
    specialty: "Gastroenterology",
    patientName: "James Carter",
    age: 47,
    gender: "Male",
    date: "2026-03-22",
    vitals: {
      bp: "128/80",
      hr: 72,
      temp: 98.2,
      spo2: 98,
      weight: "178 lbs"
    },
    rawText: `PROCEDURE PERFORMED:
Esophagogastroduodenoscopy (Upper Endoscopy / EGD) with mucosal biopsy.

INDICATIONS:
A 47-year-old male with persistent postprandial epigastric pain, early satiety, and reflux symptoms unresponsive to an empiric 4-week trial of omeprazole 20mg daily. Rule out peptic ulcer disease, Barrett's esophagus, or Helicobacter pylori infection.

PRE-MEDICATION & ANESTHESIA:
MAC (Monitored Anesthesia Care) using propofol, administered by the anesthesia team. Upper airway anesthetized with topical Cetacaine.

DESCRIPTION OF PROCEDURE:
The video endoscope was passed safely into the esophagus and advanced under direct visualization to the second part of the duodenum. The mucosal lining of the esophagus was found to be intact with no endoscopic evidence of Barrett's esophagus or esophagitis. Lower esophageal sphincter tight and situated at 40 cm.
The stomach was entered easily. Normal retroflexion and gastric distensibility. Diffuse, patchily distributed erythema with mucosal vascular congestion was found in the gastric antrum and body. There were no discrete mucosal ulcerations, suspicious nodules, or bleeding. Antral biopsy was taken for Helicobacter pylori rapid urease testing (CLOtest) and histopathological review.
The duodenum (bulb and second segment) was unremarkable. No duodenitis or celiac-like blunting of distal mucosal folds.

IMPRESSION & DISCHARGE RECOMMENDATIONS:
1. Diffuse erythematous antral gastritis. Biopsy taken.
2. Normal esophagus and duodenum.
Clinical plan: Patient discharged in stable condition. Continue twice-daily proton-pump inhibitor (omeprazole 40mg daily) pending biopsy pathology. If CLOtest is positive for Helicobacter pylori, initiate standard triple eradication therapy (clarithromycin 500mg, amoxicillin 1g, both twice daily for 14 days). Follow up in Gastroenterology clinic in 2 weeks for pathology results.`
  },
  {
    id: "surgery-04",
    title: "Surgical Discharge Summary - Post-Appendectomy",
    specialty: "General Surgery",
    patientName: "Michael Chang",
    age: 26,
    gender: "Male",
    date: "2026-04-30",
    vitals: {
      bp: "120/70",
      hr: 64,
      temp: 98.8,
      spo2: 98,
      weight: "160 lbs"
    },
    rawText: `PROCEDURE PERFORMED:
Laparoscopic appendectomy for acute suppurative appendicitis.

HOSPITAL COURSE:
The patient is a 26-year-old male who self-presented to the Emergency Department with a 12-hour history of acute periumbilical pain migrating to the right lower quadrant, accompanied by anorexia and low-grade pyrexia (99.8 F). Abdominal CT scan confirmed distended appendix measuring 11mm with surrounding fat stranding. He underwent uncomplicated three-port laparoscopic appendectomy. Postoperatively, his pain was well-controlled, he was tolerant of a regular clear liquid diet progressing to soft and normal food, and was ambulating safely.

DISCHARGE PHYSICAL EXAM:
Vitals are stable. Abdomen is soft, non-distended. Small laparoscopic portals in the periumbilical, left lower quadrant, and suprapubic regions are clean, dry, and intact with Dermabond skin adhesive. No sign of erythema, purulent drainage, or hematoma.

DISCHARGE INSTRUCTIONS:
1. DIET: Normal diet as tolerated. Encourage fiber and hydration to counteract opioid-induced constipation.
2. ACTIVITY: Restrict heavy lifting (nothing over 10 lbs) and vigorous physical exertion/valsalva for the next 4 weeks to prevent incisional hernia formation. Ambulate regularly to active venous circulation.
3. MEDICATIONS: Acetaminophen 500-1000mg orally every 6 hours as needed for mild-to-moderate pain. Take tramadol 50mg (short course) only for severe breakthrough pain. docusate sodium 100mg orally twice daily to prevent constipation.
4. INCISION CARE: Showering is permitted after 48 hours; do not scrub over incisions. Pat dry. Do not soak in bathtubs or pools.
5. RED-FLAG CLINICAL SYMPTOMS: Patient instructed to report immediately if temp >101 F, worsening abdominal pain, persistent nausea/emesis, or redness/discharge at portal incisions. Scheduled for surgical follow-up in 10 days.`
  }
];
