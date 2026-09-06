import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Activity,
  Heart,
  Pill,
  CheckCircle,
  Edit3,
  Mic,
  MicOff,
  Sparkles,
  Printer,
  Save,
  Plus,
  Trash2,
  AlertTriangle,
  Send,
  HelpCircle,
  Flame,
  ShieldAlert
} from 'lucide-react';
import { consultationAPI } from '../api';

export default function StructuredNoteEditor({
  structuredNote,
  onUpdateNote,
  onFinalize,
  onPrint,
  isFinalizing,
  activePatient
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [doctorDictation, setDoctorDictation] = useState('');
  const [isDictating, setIsDictating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [refineSuccessMessage, setRefineSuccessMessage] = useState('');

  const dictationRecognitionRef = useRef(null);

  // Initialize dictation speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-IN'; // doctor commonly dictates in English or mixed

      rec.onresult = (event) => {
        let text = '';
        for (let i = 0; i < event.results.length; i++) {
          text += event.results[i][0].transcript + ' ';
        }
        setDoctorDictation(text);
      };

      rec.onend = () => {
        setIsDictating(false);
      };

      dictationRecognitionRef.current = rec;
    }
  }, []);

  const toggleDictation = () => {
    if (!isDictating) {
      setDoctorDictation('');
      setIsDictating(true);
      if (dictationRecognitionRef.current) {
        try {
          dictationRecognitionRef.current.start();
        } catch (e) {
          console.warn('Dictation mic start error:', e);
        }
      }
    } else {
      setIsDictating(false);
      if (dictationRecognitionRef.current) {
        try {
          dictationRecognitionRef.current.stop();
        } catch (e) {
          console.warn('Dictation mic stop error:', e);
        }
      }
    }
  };

  const handleRefineWithVoiceOrText = async () => {
    if (!doctorDictation.trim()) return;
    setIsRefining(true);
    setRefineSuccessMessage('');
    try {
      const updated = await consultationAPI.refineVoice(structuredNote, doctorDictation);
      onUpdateNote(updated);
      setDoctorDictation('');
      setRefineSuccessMessage('Doctor dictation merged into clinical chart successfully!');
      setTimeout(() => setRefineSuccessMessage(''), 4000);
    } catch (err) {
      console.error('Refinement error:', err);
      alert('Failed to refine note with voice instructions: ' + (err.response?.data?.detail || err.message));
    } finally {
      setIsRefining(false);
    }
  };

  if (!structuredNote) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 space-y-2">
        <FileText className="w-10 h-10 mx-auto text-slate-300" />
        <h4 className="font-bold text-slate-700 text-sm">No Structured Note Generated Yet</h4>
        <p className="text-xs max-w-md mx-auto text-slate-500">
          Record or paste a doctor-patient conversation and click "Structure SOAP Notes & Analyze CDS" to generate the clinical record.
        </p>
      </div>
    );
  }

  const {
    detected_language,
    english_translation,
    chief_complaints = [],
    vitals = {},
    symptoms_analysis = [],
    diagnosis = '',
    disease_stage = '',
    prescriptions = [],
    recommended_tests = [],
    lifestyle_and_diet = [],
    follow_up_advice = '',
    red_flag_warnings = [],
    doctor_additional_notes = '',
    longitudinal_recall = null,
  } = structuredNote;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
      
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-base">Structured Clinical Encounter (SOAP)</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-900 text-teal-300 border border-teal-700">
                {detected_language || 'Indic Multilingual'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Extracted & translated from vernacular dialogue into international clinical standards
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onPrint}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
            title="Print Official Medical Prescription"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Rx</span>
          </button>

          <button
            onClick={onFinalize}
            disabled={isFinalizing}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md transition disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isFinalizing ? 'Saving to Records...' : 'Save & Finalize'}</span>
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">

        {/* Longitudinal 10-Second Recall Banner (If Follow-up Visit) */}
        {longitudinal_recall && !longitudinal_recall.is_first_visit && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 shadow-sm space-y-2">
            <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>10-SECOND PATIENT RECALL BRIEF (FOLLOW-UP CONTEXT)</span>
            </div>
            <p className="text-xs text-slate-700 font-medium leading-relaxed">
              {longitudinal_recall.brief_summary || longitudinal_recall.symptom_progression}
            </p>
            {longitudinal_recall.treatment_response && (
              <p className="text-[11px] text-amber-800 italic bg-white/70 p-2 rounded-lg border border-amber-200">
                <strong>Response to Past Rx:</strong> {longitudinal_recall.treatment_response}
              </p>
            )}
          </div>
        )}

        {/* Disease Staging & Diagnosis Hero Card */}
        <div className="p-5 rounded-2xl bg-teal-50/60 border border-teal-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-800 bg-teal-200/60 px-2 py-0.5 rounded-md">
                Clinical Diagnosis
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                ICD-10 Compatible
              </span>
            </div>
            <h2 className="text-lg font-extrabold text-slate-900">{diagnosis}</h2>
          </div>

          <div className="flex items-center space-x-3 bg-white p-3 rounded-xl border border-teal-200 shadow-sm">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Disease Stage / Severity
              </span>
              <span className="text-xs font-extrabold text-teal-900">{disease_stage || 'Stage 1'}</span>
            </div>
          </div>
        </div>

        {/* Vitals Grid */}
        <div>
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
            <Activity className="w-3.5 h-3.5 text-teal-600" />
            <span>Clinical Vitals & Measurements</span>
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {[
              { label: 'Blood Pressure', val: vitals.blood_pressure || '--', icon: '🩺' },
              { label: 'Pulse Rate', val: vitals.pulse || '--', icon: '💓' },
              { label: 'Temperature', val: vitals.temperature || '--', icon: '🌡️' },
              { label: 'SpO2 Oxygen', val: vitals.spo2 || '--', icon: '🫁' },
              { label: 'Blood Sugar', val: vitals.random_blood_sugar || '--', icon: '🩸' },
            ].map((v, i) => (
              <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-lg">{v.icon}</span>
                <p className="text-[10px] text-slate-500 font-semibold uppercase mt-1">{v.label}</p>
                <p className="text-xs font-bold text-slate-900 mt-0.5">{v.val}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Chief Complaints & Vernacular-to-Clinical Translation Table */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Complaints */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Chief Complaints & Duration
            </h4>
            <ul className="space-y-1.5">
              {chief_complaints.map((c, i) => (
                <li key={i} className="flex items-start space-x-2 text-xs text-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-1.5 flex-shrink-0"></span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Vernacular Symptoms Mapping */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Indic Vernacular ➔ Clinical Term Mapping
            </h4>
            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {symptoms_analysis.map((s, i) => (
                <div key={i} className="text-xs bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-900">{s.symptom}</span>
                    {s.vernacular_term && (
                      <span className="text-[11px] text-slate-500 block italic font-serif">
                        Spoken: "{s.vernacular_term}"
                      </span>
                    )}
                  </div>
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                    {s.severity || 'Moderate'}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Prescriptions & Medication Regimen */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
              <Pill className="w-3.5 h-3.5 text-teal-600" />
              <span>Prescribed Medical Regimen (Rx)</span>
            </h4>
            <span className="text-[10px] text-slate-500 font-semibold">
              {prescriptions.length} Meds Prescribed
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold">
                <tr>
                  <th className="px-4 py-2.5 text-left">Medicine & Strength</th>
                  <th className="px-3 py-2.5 text-left">Dosage</th>
                  <th className="px-3 py-2.5 text-left">Frequency</th>
                  <th className="px-3 py-2.5 text-left">Timing</th>
                  <th className="px-3 py-2.5 text-left">Duration</th>
                  <th className="px-4 py-2.5 text-left">Special Instructions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {prescriptions.map((p, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-bold text-teal-900">{p.medicine_name}</td>
                    <td className="px-3 py-2.5 text-slate-600">{p.dosage}</td>
                    <td className="px-3 py-2.5 font-semibold text-slate-800">{p.frequency}</td>
                    <td className="px-3 py-2.5 text-slate-600">{p.timing}</td>
                    <td className="px-3 py-2.5 text-slate-600">{p.duration}</td>
                    <td className="px-4 py-2.5 text-slate-500 italic">{p.special_instructions || '--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recommended Lab Tests, Diet, & Red Flags */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Diagnostic Tests Ordered
            </h4>
            <ul className="space-y-1 text-xs text-slate-700">
              {recommended_tests.map((t, i) => (
                <li key={i} className="flex items-start space-x-1.5">
                  <span className="text-teal-600 font-bold">•</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Diet & Lifestyle Advice
            </h4>
            <ul className="space-y-1 text-xs text-slate-700">
              {lifestyle_and_diet.map((d, i) => (
                <li key={i} className="flex items-start space-x-1.5">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-red-50/60 border border-red-200 space-y-2">
            <h4 className="text-xs font-bold text-red-900 uppercase tracking-wider flex items-center space-x-1">
              <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
              <span>Red Flag Warning Signs</span>
            </h4>
            <ul className="space-y-1 text-xs text-red-800">
              {red_flag_warnings.map((w, i) => (
                <li key={i} className="flex items-start space-x-1.5">
                  <span className="text-red-500 font-bold">!</span>
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Doctor Additional Notes if present */}
        {doctor_additional_notes && (
          <div className="p-3 rounded-xl bg-slate-100 border border-slate-300 text-xs text-slate-800 space-y-1">
            <span className="font-bold uppercase tracking-wider text-[10px] text-slate-500 block">
              Doctor's Manual / Dictated Additions:
            </span>
            <p className="whitespace-pre-line font-mono text-[11px] text-slate-700">
              {doctor_additional_notes}
            </p>
          </div>
        )}

        {/* 🎙️ DOCTOR VOICE DICTATION / REFINEMENT WIDGET */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-teal-900 to-slate-900 text-white border border-teal-700/60 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-teal-500/30 border border-teal-400/40 flex items-center justify-center">
                <Mic className="w-4 h-4 text-teal-300" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Doctor Voice Refinement & Dictation Bar
                </h4>
                <p className="text-[11px] text-slate-300">
                  Missed something? Turn on the mic or type additional instructions; the AI will merge them dynamically into this structured chart.
                </p>
              </div>
            </div>
          </div>

          {refineSuccessMessage && (
            <div className="p-2.5 rounded-lg bg-emerald-500/20 border border-emerald-400 text-emerald-200 text-xs font-semibold flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>{refineSuccessMessage}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={toggleDictation}
              className={`flex-shrink-0 p-3 rounded-xl flex items-center space-x-2 font-bold text-xs transition shadow-md ${
                isDictating
                  ? 'bg-red-600 text-white animate-pulse ring-2 ring-red-400'
                  : 'bg-teal-500 hover:bg-teal-400 text-slate-950'
              }`}
            >
              {isDictating ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              <span>{isDictating ? 'Stop Speaking' : '🎙️ Speak Additions'}</span>
            </button>

            <div className="relative flex-1 w-full">
              <input
                type="text"
                value={doctorDictation}
                onChange={(e) => setDoctorDictation(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRefineWithVoiceOrText();
                }}
                placeholder="e.g. 'Also add Tab Telmisartan 40mg once daily in morning and order 2D Echo'"
                className="w-full pl-3 pr-10 py-2.5 text-xs text-slate-900 bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-400 focus:outline-none placeholder-slate-400 font-sans"
              />
              <button
                type="button"
                onClick={handleRefineWithVoiceOrText}
                disabled={!doctorDictation.trim() || isRefining}
                className="absolute right-1.5 top-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition disabled:opacity-40"
              >
                {isRefining ? 'Merging...' : 'Merge'}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
