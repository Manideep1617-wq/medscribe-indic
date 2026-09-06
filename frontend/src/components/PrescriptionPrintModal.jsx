import React from 'react';
import { X, Printer, Stethoscope, Building } from 'lucide-react';

export default function PrescriptionPrintModal({ isOpen, onClose, doctor, patient, structuredNote }) {
  if (!isOpen || !structuredNote) return null;

  const handlePrint = () => {
    window.print();
  };

  const {
    diagnosis = '',
    disease_stage = '',
    vitals = {},
    chief_complaints = [],
    prescriptions = [],
    recommended_tests = [],
    lifestyle_and_diet = [],
    follow_up_advice = '',
  } = structuredNote;

  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Controls (Hidden in Print) */}
        <div className="bg-slate-900 px-6 py-3.5 text-white flex items-center justify-between print:hidden">
          <span className="font-bold text-xs">Official Medical Prescription Slip Preview</span>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Area */}
        <div id="printable-prescription" className="p-8 sm:p-10 space-y-6 text-slate-900 bg-white font-sans text-xs">
          
          {/* Hospital Header */}
          <div className="border-b-2 border-slate-800 pb-5 flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-base">
                  +
                </div>
                <h1 className="font-extrabold text-xl text-slate-900 uppercase tracking-tight">
                  {doctor?.hospital_name || 'AIIMS Hospital & Research Center'}
                </h1>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Outpatient Department (OPD) • Clinical Encounter Record
              </p>
            </div>

            <div className="text-right">
              <h3 className="font-extrabold text-sm text-teal-800">{doctor?.name || 'Dr. Aarav Sharma, MD'}</h3>
              <p className="text-[11px] text-slate-600 font-semibold">{doctor?.department || 'General Medicine'}</p>
              <p className="text-[10px] text-slate-400 font-mono">Reg. No: MCI-IND-884920</p>
            </div>
          </div>

          {/* Patient Details & Vitals Strip */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
            <div>
              <span className="text-slate-400 font-bold block uppercase text-[9px]">Patient Name</span>
              <span className="font-bold text-slate-900">{patient?.name || structuredNote.patient_details?.name || 'Consultation Patient'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold block uppercase text-[9px]">Age / Gender / Blood</span>
              <span className="font-bold text-slate-900">
                {patient?.age || structuredNote.patient_details?.age || '--'} Yrs / {patient?.gender || structuredNote.patient_details?.gender || '--'} / {patient?.blood_group || 'O+'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-bold block uppercase text-[9px]">UHID / Patient ID</span>
              <span className="font-bold text-slate-900 font-mono">{patient?.uhid || 'UHID-IND-2026-0001'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold block uppercase text-[9px]">Date of Visit</span>
              <span className="font-bold text-slate-900">{currentDate}</span>
            </div>
          </div>

          {/* Vitals Summary */}
          <div className="flex flex-wrap items-center gap-4 text-[11px] p-2.5 rounded-lg border border-slate-200 bg-white">
            <span className="font-bold text-slate-700 uppercase text-[10px]">Vitals:</span>
            <span><strong>BP:</strong> {vitals.blood_pressure || '130/85'}</span>
            <span>•</span>
            <span><strong>Pulse:</strong> {vitals.pulse || '76 bpm'}</span>
            <span>•</span>
            <span><strong>Temp:</strong> {vitals.temperature || '98.4 F'}</span>
            <span>•</span>
            <span><strong>SpO2:</strong> {vitals.spo2 || '98%'}</span>
            {vitals.random_blood_sugar && (
              <>
                <span>•</span>
                <span><strong>RBS:</strong> {vitals.random_blood_sugar}</span>
              </>
            )}
          </div>

          {/* Diagnosis & Stage */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Primary Diagnosis & Stage
            </span>
            <div className="flex items-center space-x-3">
              <span className="font-extrabold text-sm text-slate-900">{diagnosis}</span>
              <span className="px-2 py-0.5 rounded bg-teal-100 text-teal-900 font-bold text-[10px]">
                {disease_stage}
              </span>
            </div>
          </div>

          {/* Rx Prescriptions Table */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center space-x-2 text-sm font-extrabold text-teal-800">
              <span className="text-lg font-serif">℞</span>
              <span>Prescribed Medications</span>
            </div>

            <table className="w-full border-collapse border border-slate-300 text-xs">
              <thead className="bg-slate-100 font-bold text-slate-700">
                <tr>
                  <th className="border border-slate-300 px-3 py-2 text-left">#</th>
                  <th className="border border-slate-300 px-3 py-2 text-left">Medicine & Strength</th>
                  <th className="border border-slate-300 px-2 py-2 text-left">Dosage</th>
                  <th className="border border-slate-300 px-2 py-2 text-left">Frequency</th>
                  <th className="border border-slate-300 px-2 py-2 text-left">Timing</th>
                  <th className="border border-slate-300 px-2 py-2 text-left">Duration</th>
                </tr>
              </thead>
              <tbody>
                {prescriptions.map((p, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="border border-slate-300 px-3 py-2 font-bold">{i + 1}</td>
                    <td className="border border-slate-300 px-3 py-2 font-bold text-slate-900">
                      {p.medicine_name}
                      {p.special_instructions && (
                        <span className="block text-[10px] font-normal text-slate-500 italic">
                          ({p.special_instructions})
                        </span>
                      )}
                    </td>
                    <td className="border border-slate-300 px-2 py-2">{p.dosage}</td>
                    <td className="border border-slate-300 px-2 py-2 font-semibold">{p.frequency}</td>
                    <td className="border border-slate-300 px-2 py-2">{p.timing}</td>
                    <td className="border border-slate-300 px-2 py-2">{p.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Diagnostic Tests & Advice */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="p-3 rounded-lg border border-slate-200 space-y-1">
              <span className="font-bold text-[10px] text-slate-700 uppercase tracking-wider block">
                Required Lab Investigations
              </span>
              <ul className="space-y-1 text-[11px] text-slate-600 list-disc list-inside">
                {recommended_tests.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 space-y-1">
              <span className="font-bold text-[10px] text-slate-700 uppercase tracking-wider block">
                Dietary & Follow-Up Advice
              </span>
              <p className="text-[11px] text-slate-700">
                {follow_up_advice || 'Review in OPD in 2 weeks with test reports.'}
              </p>
              <ul className="space-y-0.5 text-[10px] text-slate-500 list-disc list-inside mt-1">
                {lifestyle_and_diet.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Signatures & Footer */}
          <div className="pt-10 flex items-end justify-between border-t border-slate-200">
            <div className="text-[9px] text-slate-400">
              <p>Generated by MedScribe Indic Clinical Intelligence System</p>
              <p>Certified Clinical Electronic Health Record • Confidential</p>
            </div>
            <div className="text-right space-y-1">
              <div className="w-36 border-b border-slate-700 inline-block"></div>
              <p className="font-bold text-xs text-slate-900">{doctor?.name || 'Dr. Aarav Sharma, MD'}</p>
              <p className="text-[10px] text-slate-500">Authorized Medical Officer</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
