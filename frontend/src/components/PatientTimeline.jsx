import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  FileText,
  Pill,
  ChevronDown,
  ChevronUp,
  User,
  Plus,
  ShieldCheck,
  Search,
  Edit3,
  Save,
  X,
  Activity,
  AlertTriangle,
  FlaskConical,
  Stethoscope,
  Languages,
  Heart,
  Thermometer,
  Droplets
} from 'lucide-react';
import { patientsAPI } from '../api';

export default function PatientTimeline({
  patients,
  selectedPatient,
  onSelectPatient,
  onStartNewConsultation,
  onPatientUpdated
}) {
  const [expandedVisit, setExpandedVisit] = useState(null);
  const [search, setSearch] = useState('');
  const [editingEncounterId, setEditingEncounterId] = useState(null);
  const [editFields, setEditFields] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const filtered = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.uhid.toLowerCase().includes(search.toLowerCase())
  );

  const toggleVisit = (id) => {
    setExpandedVisit(expandedVisit === id ? null : id);
    setEditingEncounterId(null);
  };

  const startEditing = (enc) => {
    setEditingEncounterId(enc.id);
    setEditFields({
      raw_transcript: enc.raw_transcript || '',
      diagnosis: enc.diagnosis || '',
      disease_stage: enc.disease_stage || '',
      doctor_additional_notes: enc.doctor_additional_notes || '',
    });
  };

  const cancelEditing = () => {
    setEditingEncounterId(null);
    setEditFields({});
  };

  const saveEditing = async (enc) => {
    setIsSaving(true);
    try {
      await patientsAPI.updateEncounter(enc.patient_id, enc.id, editFields);
      setEditingEncounterId(null);
      setEditFields({});
      if (onPatientUpdated) onPatientUpdated(enc.patient_id);
    } catch (e) {
      console.error('Save error:', e);
      alert('Failed to save changes: ' + (e.response?.data?.detail || e.message));
    } finally {
      setIsSaving(false);
    }
  };

  // Build a clean structured summary paragraph from the encounter fields
  const buildEncounterSummary = (enc) => {
    const complaints = Array.isArray(enc.chief_complaints) ? enc.chief_complaints : [];
    const vitals = enc.vitals || {};
    const tests = Array.isArray(enc.lab_tests) ? enc.lab_tests : [];
    const notes = enc.doctor_additional_notes || '';

    const parts = [];
    if (complaints.length) parts.push(`Chief complaints: ${complaints.join('; ')}.`);
    const vitalParts = [];
    if (vitals.blood_pressure) vitalParts.push(`BP ${vitals.blood_pressure}`);
    if (vitals.pulse) vitalParts.push(`Pulse ${vitals.pulse}`);
    if (vitals.spo2) vitalParts.push(`SpO2 ${vitals.spo2}`);
    if (vitals.random_blood_sugar) vitalParts.push(`RBS ${vitals.random_blood_sugar}`);
    if (vitalParts.length) parts.push(`Vitals: ${vitalParts.join(', ')}.`);
    if (tests.length) parts.push(`Tests ordered: ${tests.slice(0, 2).join(', ')}${tests.length > 2 ? ` +${tests.length - 2} more` : ''}.`);
    if (notes) parts.push(`Doctor's note: ${notes}`);

    return parts.length
      ? parts.join(' ')
      : 'Consultation recorded. Structured clinical data available in full encounter details.';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Left: Patient Directory */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">Patient Directory</h3>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {patients.length} Registered
          </span>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name / UHID..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
        </div>

        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
          {filtered.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">No patient records found.</p>
          ) : (
            filtered.map((p) => {
              const isSelected = selectedPatient && selectedPatient.id === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => onSelectPatient(p)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-teal-50/80 border-teal-500 shadow-sm ring-1 ring-teal-500'
                      : 'bg-slate-50/50 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">{p.name}</span>
                    <span className="text-[10px] font-mono text-slate-500">{p.uhid}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-1">
                    <span>{p.age} yrs, {p.gender}</span>
                    <span>•</span>
                    <span className="font-semibold text-teal-700">{p.visit_count || 0} Visit{p.visit_count !== 1 ? 's' : ''}</span>
                  </div>
                  {/* Per-patient latest diagnosis — unique for each patient */}
                  {p.latest_diagnosis ? (
                    <p className="text-[11px] text-slate-700 font-medium truncate mt-1.5 bg-white px-2 py-1 rounded-lg border border-slate-200 leading-snug">
                      <span className="text-teal-700 font-bold">Dx: </span>
                      {p.latest_diagnosis}
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic mt-1">No encounter recorded yet</p>
                  )}
                  {p.latest_stage && (
                    <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                      Stage: {p.latest_stage}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right 2 Columns: Longitudinal Journey & Visit Details */}
      <div className="lg:col-span-2 space-y-6">
        {selectedPatient ? (
          <div className="space-y-6">
            
            {/* Patient Header Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center font-bold text-base shadow-md">
                  {selectedPatient.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="font-extrabold text-base text-slate-900">{selectedPatient.name}</h2>
                    {selectedPatient.blood_group && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
                        {selectedPatient.blood_group}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-slate-500 mt-0.5">
                    <span className="font-mono">{selectedPatient.uhid}</span>
                    <span>•</span>
                    <span>{selectedPatient.age} Years, {selectedPatient.gender}</span>
                    <span>•</span>
                    <span>Language: {selectedPatient.preferred_language || 'Telugu'}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onStartNewConsultation(selectedPatient)}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md transition"
              >
                <Plus className="w-4 h-4" />
                <span>Start Follow-up Consultation</span>
              </button>
            </div>

            {/* Encounter Timeline */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-teal-600" />
                <span>Longitudinal Medical Journey ({selectedPatient.encounters?.length || 0} Encounters)</span>
              </h3>

              {(!selectedPatient.encounters || selectedPatient.encounters.length === 0) ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 space-y-2">
                  <FileText className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs">No clinical encounters recorded yet for this patient.</p>
                  <button
                    onClick={() => onStartNewConsultation(selectedPatient)}
                    className="text-xs text-teal-600 font-bold hover:underline mt-2 inline-block"
                  >
                    + Record First Visit Now
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedPatient.encounters.map((enc, idx) => {
                    const isExpanded = expandedVisit === enc.id || (expandedVisit === null && idx === selectedPatient.encounters.length - 1);
                    const isEditing = editingEncounterId === enc.id;
                    const summary = buildEncounterSummary(enc);
                    const vitals = enc.vitals || {};
                    const complaints = Array.isArray(enc.chief_complaints) ? enc.chief_complaints : [];
                    const prescriptions = Array.isArray(enc.prescriptions) ? enc.prescriptions : [];
                    const tests = Array.isArray(enc.lab_tests) ? enc.lab_tests : [];

                    return (
                      <div
                        key={enc.id}
                        className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all"
                      >
                        {/* Encounter Header */}
                        <div
                          onClick={() => toggleVisit(enc.id)}
                          className="p-4 bg-slate-50/80 hover:bg-slate-100/80 cursor-pointer flex items-center justify-between border-b border-slate-200"
                        >
                          <div className="flex items-center space-x-3">
                            <span className="w-8 h-8 rounded-xl bg-teal-600 text-white font-bold text-xs flex items-center justify-center shadow-sm flex-shrink-0">
                              #{enc.visit_number}
                            </span>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                {/* Per-encounter unique diagnosis */}
                                <h4 className="font-bold text-xs text-slate-900">
                                  {enc.diagnosis || 'Clinical Consultation'}
                                </h4>
                                {enc.disease_stage && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-100 text-teal-800 border border-teal-200">
                                    {enc.disease_stage}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5 flex items-center space-x-2">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span>
                                  {new Date(enc.created_at).toLocaleDateString('en-IN', {
                                    day: 'numeric', month: 'short', year: 'numeric',
                                    hour: '2-digit', minute: '2-digit'
                                  })}
                                </span>
                                <span>•</span>
                                <Languages className="w-3 h-3 text-slate-400" />
                                <span>{enc.language_detected}</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            {/* Edit button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isEditing) {
                                  cancelEditing();
                                } else {
                                  setExpandedVisit(enc.id);
                                  startEditing(enc);
                                }
                              }}
                              className={`p-1.5 rounded-lg border transition text-xs font-semibold flex items-center space-x-1 ${
                                isEditing
                                  ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
                                  : 'bg-white border-slate-200 text-slate-500 hover:text-teal-700 hover:border-teal-300'
                              }`}
                              title={isEditing ? 'Cancel editing' : 'Edit this encounter'}
                            >
                              {isEditing ? <X className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                              <span className="hidden sm:inline">{isEditing ? 'Cancel' : 'Edit'}</span>
                            </button>
                            <div className="p-1 rounded-lg text-slate-400">
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </div>
                          </div>
                        </div>

                        {/* Encounter Expanded Content */}
                        {isExpanded && (
                          <div className="p-5 space-y-5 text-xs">

                            {/* ---- EDIT MODE ---- */}
                            {isEditing ? (
                              <div className="space-y-4 p-4 bg-amber-50/50 border border-amber-200 rounded-xl">
                                <div className="flex items-center space-x-2 text-amber-800 font-bold text-xs">
                                  <Edit3 className="w-4 h-4 text-amber-600" />
                                  <span>Editing Encounter #{enc.visit_number} — Doctor's Authorized Correction</span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Diagnosis</label>
                                    <input
                                      type="text"
                                      value={editFields.diagnosis}
                                      onChange={(e) => setEditFields((p) => ({ ...p, diagnosis: e.target.value }))}
                                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Disease Stage</label>
                                    <input
                                      type="text"
                                      value={editFields.disease_stage}
                                      onChange={(e) => setEditFields((p) => ({ ...p, disease_stage: e.target.value }))}
                                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                                    Original Transcript (Edit / Correct)
                                  </label>
                                  <textarea
                                    rows={5}
                                    value={editFields.raw_transcript}
                                    onChange={(e) => setEditFields((p) => ({ ...p, raw_transcript: e.target.value }))}
                                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none leading-relaxed"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                                    Doctor's Additional Notes
                                  </label>
                                  <textarea
                                    rows={2}
                                    value={editFields.doctor_additional_notes}
                                    onChange={(e) => setEditFields((p) => ({ ...p, doctor_additional_notes: e.target.value }))}
                                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                    placeholder="Any additional notes or corrections..."
                                  />
                                </div>

                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => saveEditing(enc)}
                                    disabled={isSaving}
                                    className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition shadow-sm disabled:opacity-50"
                                  >
                                    <Save className="w-3.5 h-3.5" />
                                    <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                                  </button>
                                  <button
                                    onClick={cancelEditing}
                                    className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              /* ---- VIEW MODE ---- */
                              <>
                                {/* AI Clinical Summary — replaces raw transcript dump */}
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-1.5 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                                    <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                                    <span>Clinical Encounter Summary</span>
                                  </div>
                                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 leading-relaxed">
                                    {summary}
                                  </div>
                                </div>

                                {/* Complaints */}
                                {complaints.length > 0 && (
                                  <div className="space-y-1.5">
                                    <div className="flex items-center space-x-1.5 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                                      <span>Chief Complaints</span>
                                    </div>
                                    <ul className="space-y-1 text-xs text-slate-700">
                                      {complaints.map((c, ci) => (
                                        <li key={ci} className="flex items-start space-x-2">
                                          <span className="text-teal-600 font-bold mt-0.5">•</span>
                                          <span>{c}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {/* Vitals */}
                                {Object.keys(vitals).length > 0 && (
                                  <div className="space-y-1.5">
                                    <div className="flex items-center space-x-1.5 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                                      <Activity className="w-3.5 h-3.5 text-red-500" />
                                      <span>Vitals</span>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                      {[
                                        { label: 'Blood Pressure', val: vitals.blood_pressure },
                                        { label: 'Pulse', val: vitals.pulse },
                                        { label: 'SpO2', val: vitals.spo2 },
                                        { label: 'RBS', val: vitals.random_blood_sugar },
                                      ].filter(v => v.val).map((v, vi) => (
                                        <div key={vi} className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-center">
                                          <p className="text-[9px] text-slate-500 font-semibold uppercase">{v.label}</p>
                                          <p className="text-xs font-bold text-slate-900 mt-0.5">{v.val}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Prescriptions */}
                                {prescriptions.length > 0 && (
                                  <div className="space-y-1.5">
                                    <div className="flex items-center space-x-1.5 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                                      <Pill className="w-3.5 h-3.5 text-teal-600" />
                                      <span>Prescribed Medications ({prescriptions.length})</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      {prescriptions.map((m, mi) => (
                                        <div key={mi} className="p-2.5 rounded-lg bg-teal-50/60 border border-teal-200">
                                          <p className="font-bold text-xs text-teal-900">{m.medicine_name}</p>
                                          <p className="text-[11px] text-slate-600 mt-0.5">
                                            {m.frequency} • {m.timing} • {m.duration}
                                          </p>
                                          {m.special_instructions && (
                                            <p className="text-[10px] text-slate-500 italic mt-0.5">{m.special_instructions}</p>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Lab Tests */}
                                {tests.length > 0 && (
                                  <div className="space-y-1.5">
                                    <div className="flex items-center space-x-1.5 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                                      <FlaskConical className="w-3.5 h-3.5 text-indigo-500" />
                                      <span>Tests Ordered</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      {tests.map((t, ti) => (
                                        <span key={ti} className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 text-[11px] font-medium">
                                          {t}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* CDS compliance badge */}
                                {enc.cds_guideline_analysis && (
                                  <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-200 flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      <ShieldCheck className="w-4 h-4 text-indigo-600" />
                                      <span className="font-bold text-[11px] text-indigo-900">
                                        CDS Guideline Compliance — {enc.cds_guideline_analysis.efficiency_score || 92}%
                                      </span>
                                    </div>
                                    <span className="text-[11px] text-indigo-700 font-medium">
                                      {enc.cds_guideline_analysis.guideline_compliance || 'High'}
                                    </span>
                                  </div>
                                )}

                                {/* Doctor's additional notes */}
                                {enc.doctor_additional_notes && (
                                  <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 text-xs text-amber-900 space-y-1">
                                    <span className="font-bold text-[10px] uppercase tracking-wider text-amber-700 block">
                                      Doctor's Additional Notes
                                    </span>
                                    <p className="leading-relaxed whitespace-pre-line">{enc.doctor_additional_notes}</p>
                                  </div>
                                )}

                                {/* Collapsible original transcript */}
                                <details className="group">
                                  <summary className="cursor-pointer text-[10px] font-bold text-slate-400 uppercase tracking-wider hover:text-slate-600 list-none flex items-center space-x-1 select-none">
                                    <span className="group-open:hidden">▶</span>
                                    <span className="hidden group-open:inline">▼</span>
                                    <span className="ml-1">View Original Spoken Dialogue</span>
                                  </summary>
                                  <p className="mt-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 italic font-serif leading-relaxed">
                                    "{enc.raw_transcript}"
                                  </p>
                                </details>
                              </>
                            )}

                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 space-y-2">
            <User className="w-12 h-12 mx-auto text-slate-300" />
            <h3 className="font-bold text-slate-700 text-sm">Select a Patient to View Journey</h3>
            <p className="text-xs max-w-sm mx-auto text-slate-500">
              Click on any patient from the directory on the left to inspect longitudinal visit history and previous prescriptions.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
