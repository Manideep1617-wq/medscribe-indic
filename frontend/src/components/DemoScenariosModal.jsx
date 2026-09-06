import React from 'react';
import { X, Sparkles, Languages, Stethoscope, ArrowRight, User } from 'lucide-react';

export default function DemoScenariosModal({ isOpen, onClose, demoCases, onSelectCase }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">Viva Demonstration Case Studies</h3>
              <p className="text-xs text-amber-100">Realistic Multilingual Indian Hospital OPD Consultations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-amber-200 hover:text-white hover:bg-amber-800/50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <p className="text-xs text-slate-600 leading-relaxed">
            Select an Indic clinical encounter scenario below. The AI will parse the doctor-patient dialogue, convert colloquial vernacular expressions into standard clinical SOAP concepts, calculate disease staging, and generate evidence-based ICMR/WHO guidelines.
          </p>

          <div className="space-y-3">
            {demoCases.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onSelectCase(item);
                  onClose();
                }}
                className="group p-4 rounded-xl border border-slate-200 hover:border-teal-500 bg-slate-50/50 hover:bg-teal-50/40 transition-all cursor-pointer shadow-sm hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
                        {item.language}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        {item.specialty}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm group-hover:text-teal-700 transition-colors">
                      {item.title}
                    </h4>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 group-hover:text-teal-600 group-hover:border-teal-300 transition-all">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>

                <div className="mt-2.5 flex items-center space-x-4 text-xs text-slate-600">
                  <div className="flex items-center space-x-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{item.patient.name} ({item.patient.age}y, {item.patient.gender})</span>
                  </div>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-500 font-mono text-[11px]">{item.patient.uhid}</span>
                </div>

                <p className="mt-2 text-xs text-slate-500 line-clamp-2 italic font-serif bg-white p-2 rounded-lg border border-slate-100">
                  "{item.transcript.slice(0, 140)}..."
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
