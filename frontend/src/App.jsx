import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import DemoScenariosModal from './components/DemoScenariosModal';
import PatientSelectorModal from './components/PatientSelectorModal';
import AudioConsultation from './components/AudioConsultation';
import StructuredNoteEditor from './components/StructuredNoteEditor';
import CDSAdvisorPanel from './components/CDSAdvisorPanel';
import PatientTimeline from './components/PatientTimeline';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import PrescriptionPrintModal from './components/PrescriptionPrintModal';

import { authAPI, patientsAPI, consultationAPI } from './api';

export default function App() {
  const [doctor, setDoctor] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const [activeTab, setActiveTab] = useState('consultation'); // 'consultation' | 'patients' | 'analytics'
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [demoCases, setDemoCases] = useState([]);

  // Consultation State
  const [transcript, setTranscript] = useState('');
  const [languageHint, setLanguageHint] = useState('Telugu');
  const [structuredNote, setStructuredNote] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  // Auto-login or verify existing token
  useEffect(() => {
    const token = localStorage.getItem('medscribe_token');
    if (token) {
      authAPI
        .getMe()
        .then((doc) => setDoctor(doc))
        .catch(() => {
          localStorage.removeItem('medscribe_token');
          setDoctor(null);
        });
    } else {
      handleDemoLoginOnMount();
    }

    // Load demo cases
    consultationAPI
      .getDemoCases()
      .then((cases) => setDemoCases(cases))
      .catch((err) => console.error('Failed to load demo cases:', err));
  }, []);

  const handleDemoLoginOnMount = async () => {
    try {
      const data = await authAPI.login('doctor@aiims.edu.in', 'password123');
      localStorage.setItem('medscribe_token', data.access_token);
      setDoctor(data.doctor);
    } catch (e) {
      // Ignore if not yet seeded
    }
  };

  // Fetch doctor's patients when logged in
  useEffect(() => {
    if (doctor) {
      fetchPatients();
    } else {
      setPatients([]);
      setSelectedPatient(null);
    }
  }, [doctor]);

  const fetchPatients = async () => {
    try {
      const data = await patientsAPI.list();
      setPatients(data);
      if (data.length > 0 && !selectedPatient) {
        fetchPatientTimeline(data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch patients:', err);
    }
  };

  const fetchPatientTimeline = async (patientId) => {
    try {
      const fullP = await patientsAPI.getWithTimeline(patientId);
      setSelectedPatient(fullP);
    } catch (err) {
      console.error('Error fetching patient timeline:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('medscribe_token');
    setDoctor(null);
    setSelectedPatient(null);
  };

  // Handle selecting a demo case
  const handleSelectDemoCase = async (demoCase) => {
    setTranscript(demoCase.transcript);
    setLanguageHint(demoCase.language.includes('Telugu') ? 'Telugu' : demoCase.language.includes('Hindi') ? 'Hindi' : 'English');

    if (doctor) {
      const existing = patients.find((p) => p.name.toLowerCase() === demoCase.patient.name.toLowerCase());
      if (existing) {
        await fetchPatientTimeline(existing.id);
      } else {
        try {
          const newP = await patientsAPI.create({
            name: demoCase.patient.name,
            age: demoCase.patient.age,
            gender: demoCase.patient.gender,
            blood_group: demoCase.patient.blood_group,
            preferred_language: demoCase.language,
          });
          setPatients((prev) => [newP, ...prev]);
          await fetchPatientTimeline(newP.id);
        } catch (e) {
          console.warn('Could not auto-create patient for demo:', e);
        }
      }
    }

    setActiveTab('consultation');
  };

  // Run AI extraction on dialogue
  const handleProcessDialogue = async (rawText, lang) => {
    setIsProcessing(true);
    try {
      const result = await consultationAPI.processDialogue(
        rawText,
        lang,
        selectedPatient ? selectedPatient.id : null
      );
      setStructuredNote(result);
    } catch (err) {
      console.error('Processing error:', err);
      alert('Failed to process dialogue: ' + (err.response?.data?.detail || err.message));
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Audio File Upload Result
  const handleAudioUploaded = (resultNote) => {
    setStructuredNote(resultNote);
    if (resultNote.english_translation) {
      setTranscript(resultNote.english_translation);
    }
  };

  // 1-Click Accept CDS Suggestion into Prescriptions
  const handleAcceptCDSSuggestion = async (suggestion) => {
    if (!structuredNote) return;
    try {
      const updated = await consultationAPI.acceptCDSSuggestion(structuredNote, suggestion);
      setStructuredNote(updated);
    } catch (e) {
      console.error('Accept CDS error:', e);
    }
  };

  // Save finalized record to patient timeline
  const handleFinalizeEncounter = async () => {
    if (!structuredNote) return;
    if (!selectedPatient) {
      setIsPatientModalOpen(true);
      return;
    }

    setIsFinalizing(true);
    try {
      const payload = {
        patient_id: selectedPatient.id,
        raw_transcript: transcript || 'Doctor Consultation',
        language_detected: structuredNote.detected_language || languageHint,
        english_translation: structuredNote.english_translation || '',
        chief_complaints: structuredNote.chief_complaints || [],
        vitals: structuredNote.vitals || {},
        symptoms_detail: structuredNote.symptoms_analysis || [],
        diagnosis: structuredNote.diagnosis || 'Clinical Diagnosis',
        disease_stage: structuredNote.disease_stage || 'Stage 1',
        prescriptions: structuredNote.prescriptions || [],
        lab_tests: structuredNote.recommended_tests || [],
        doctor_additional_notes: structuredNote.doctor_additional_notes || '',
        cds_guideline_analysis: structuredNote.cds_guideline_analysis || {},
      };

      await consultationAPI.finalize(payload);
      alert(`Encounter saved successfully to ${selectedPatient.name}'s medical records!`);
      await fetchPatientTimeline(selectedPatient.id);
      await fetchPatients();
      setActiveTab('patients');
    } catch (err) {
      console.error('Finalize error:', err);
      alert('Failed to finalize encounter: ' + (err.response?.data?.detail || err.message));
    } finally {
      setIsFinalizing(false);
    }
  };

  const handleStartFollowUpConsultation = (patient) => {
    setSelectedPatient(patient);
    setTranscript('');
    setStructuredNote(null);
    setLanguageHint(patient.preferred_language || 'Telugu');
    setActiveTab('consultation');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Top Navbar */}
      <Navbar
        doctor={doctor}
        onLogout={handleLogout}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenDemoCases={() => setIsDemoModalOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Clinical Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {activeTab === 'consultation' ? (
          <div className="space-y-6">
            
            {/* Ambient Consultation Room & Speech Input */}
            <AudioConsultation
              activePatient={selectedPatient}
              onOpenPatientSelector={() => setIsPatientModalOpen(true)}
              onOpenDemoCases={() => setIsDemoModalOpen(true)}
              onProcessDialogue={handleProcessDialogue}
              onAudioUploaded={handleAudioUploaded}
              isProcessing={isProcessing}
              initialTranscript={transcript}
              initialLanguage={languageHint}
            />

            {/* If Structured Note Exists: 2-Column Clinical Layout */}
            {structuredNote && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                {/* Left 2 Cols: Structured SOAP Note & Doctor Dictation Refinement */}
                <div className="lg:col-span-2 space-y-6">
                  <StructuredNoteEditor
                    structuredNote={structuredNote}
                    onUpdateNote={(updated) => setStructuredNote(updated)}
                    onFinalize={handleFinalizeEncounter}
                    onPrint={() => setIsPrintModalOpen(true)}
                    isFinalizing={isFinalizing}
                    activePatient={selectedPatient}
                  />
                </div>

                {/* Right Col: AI Clinical Decision Support (CDS) Guidelines */}
                <div className="lg:col-span-1 space-y-6">
                  <CDSAdvisorPanel
                    cdsData={structuredNote.cds_guideline_analysis}
                    onAcceptSuggestion={handleAcceptCDSSuggestion}
                  />
                </div>

              </div>
            )}

          </div>
        ) : activeTab === 'patients' ? (
          /* Patients Longitudinal Medical History Tab */
          <PatientTimeline
            patients={patients}
            selectedPatient={selectedPatient}
            onSelectPatient={(p) => fetchPatientTimeline(p.id)}
            onStartNewConsultation={handleStartFollowUpConsultation}
            onPatientUpdated={async (patientId) => {
              await fetchPatientTimeline(patientId);
              await fetchPatients();
            }}
          />
        ) : (
          /* Hospital OPD Analytics Dashboard Tab */
          <AnalyticsDashboard />
        )}

      </main>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={(doc) => setDoctor(doc)}
      />

      <DemoScenariosModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        demoCases={demoCases}
        onSelectCase={handleSelectDemoCase}
      />

      <PatientSelectorModal
        isOpen={isPatientModalOpen}
        onClose={() => setIsPatientModalOpen(false)}
        patients={patients}
        onSelectPatient={(p) => fetchPatientTimeline(p.id)}
        onPatientCreated={(p) => setPatients((prev) => [p, ...prev])}
      />

      <PrescriptionPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        doctor={doctor}
        patient={selectedPatient}
        structuredNote={structuredNote}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500">
        <p className="font-semibold text-slate-700">
          MedScribe Indic • Multilingual Ambient Clinical Intelligence & CDS
        </p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Designed for Indian OPD Consultations (Telugu • Hindi • English) • AI in Healthcare Capstone
        </p>
      </footer>

    </div>
  );
}
