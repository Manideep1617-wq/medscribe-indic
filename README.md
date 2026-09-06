# 🩺 MedScribe Indic: Multilingual Ambient Clinical Intelligence & Clinical Decision Support (CDS) System

> **4th Year AI in Healthcare Capstone Project**  
> Calibrated for Indian Outpatient (OPD) Consultations with support for **Telugu (తెలుగు), Hindi (हिंदी), English, and Code-Mixed dialogues (Tenglish/Hinglish)**.

---

## 🌟 Key Innovations & Features

1. **Ambient Doctor-Patient Listening & Vernacular Translation**:
   - Captures spoken consultation in Telugu, Hindi, or English.
   - Automatically translates colloquial complaints (e.g. *"గుండెల్లో మంట"* ➔ *Epigastric Burning/GERD*, *"छाती में भारीपन"* ➔ *Retrosternal Chest Tightness*) into international clinical terminology.
2. **Automated Structured SOAP Note & Disease Staging**:
   - Generates standardized Electronic Health Records with Chief Complaints, Vitals, Symptoms Breakdown, ICD-10 compatible Diagnosis, Disease Staging (e.g. *Stage 2 Hypertension / Uncontrolled Diabetology*), and Prescription Regimen.
3. **🎙️ Interactive Doctor Voice Refinement / Dictation**:
   - If the doctor wants to add or modify any clinical parameter, they simply speak (e.g., *"Also add Tab Telmisartan 40mg and order 2D Echo"*) or type.
   - The AI dynamically merges the dictation into the structured record without overwriting previous parameters.
4. **Evidence-Based Clinical Decision Support (CDS)**:
   - Evaluates the doctor's chosen regimen against **ICMR 2023, WHO, and NICE Guidelines**.
   - Generates treatment efficacy scores, checks drug-drug interactions & safety alerts, and suggests verified 1st-line alternatives and Jan Aushadhi generic cost savings.
5. **Longitudinal Patient Journey & "10-Second Recall Card"**:
   - Solves the memory-gap in follow-up visits. When a patient returns for Visit 2 or 3, the AI provides a concise comparative brief highlighting symptom changes, past drug response, and recommended action points.
6. **Printable Hospital Prescription Slip**:
   - 1-click printable official OPD prescription with doctor header, patient UHID, vitals, Rx table, and clinical notes.
7. **Viva Demonstration Suite**:
   - Built-in realistic Indian OPD case studies (Diabetology in Telugu, Cardiology in Hindi, Orthopedics in Tenglish) for instant offline or online evaluation.

---

## 🏛️ System Architecture

```
[ Ambient Microphone / Audio / Transcript ]
       │
       ▼ (Telugu / Hindi / English)
[ Multimodal Indic Clinical Engine ]
   ├── 1. Speech-to-Text & Vernacular-to-Clinical Concept Mapping
   ├── 2. SOAP Structuring & Disease Staging
   ├── 3. CDS Guidelines Validator (ICMR & WHO Protocols)
   └── 4. Longitudinal Delta Engine (Visit 1 vs Visit 2)
       │
       ▼
[ Doctor Review Portal ] ◄──── [ 🎙️ Doctor Voice Dictation Add-on ]
       │ (1-Click Approval)
       ▼
[ SQLite Database & Patient Longitudinal Timeline ]
       │
       ▼
[ Printable Hospital Prescription Slip / EHR ]
```

---

## 🚀 How to Run the Project

### 1. Prerequisites
- Python 3.10+
- Node.js 18+

### 2. Backend Setup
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```
*Backend API docs available at: `http://localhost:8000/docs`*

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Frontend running at: `http://localhost:5173`*

### 4. Quick Start Scripts (Windows)
Double-click `run_backend.bat` and `run_frontend.bat` to launch both servers simultaneously!

---

## 👨‍🏫 College Viva & Demo Guide

1. **Step 1 - Login**: Use the **"1-Click Demo Login"** button on the top right (Dr. Aarav Sharma, AIIMS).
2. **Step 2 - Load a Clinical Scenario**: Click **"Viva Demo Cases"** and select **Case 1 (Telugu Diabetes Consultation)** or **Case 2 (Hindi Chest Pain)**.
3. **Step 3 - Run Structuring**: Click **"Structure SOAP Notes & Analyze CDS"**.
4. **Step 4 - Inspect the Output**:
   - Review the translated Vernacular Mapping (*"గుండెల్లో మంట"* ➔ *Epigastric Burning*).
   - Review Disease Staging & Prescription Table.
   - Review the **CDS Advisor Panel** on the right (Efficacy Score, ICMR Guideline Reference, Drug Alerts).
5. **Step 5 - Demonstrate Doctor Voice Dictation**:
   - Under the structured note, click the **"🎙️ Speak Additions"** mic button or type: *"Also add Tab Pantoprazole 40mg before breakfast and order HbA1c"*.
   - Click **"Merge"** and show how the AI dynamically updates the structured chart!
6. **Step 6 - Save & Check Longitudinal Timeline**:
   - Click **"Save & Finalize"**.
   - Switch to the **"Patients Timeline"** tab to view the patient's multi-visit medical journey and the **"10-Second Recall Card"**.
7. **Step 7 - Print Rx**: Click **"Print Rx"** to display the official hospital prescription preview.
