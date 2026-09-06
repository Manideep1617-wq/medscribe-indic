import React from 'react';
import { ShieldCheck, AlertTriangle, BookOpen, Sparkles, CheckCircle2, TrendingUp, DollarSign, PlusCircle } from 'lucide-react';

export default function CDSAdvisorPanel({ cdsData, onAcceptSuggestion }) {
  if (!cdsData) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-slate-400">
        <ShieldCheck className="w-8 h-8 mx-auto text-slate-300 mb-2" />
        <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider">
          Clinical Decision Support (CDS)
        </h4>
        <p className="text-[11px] text-slate-500 mt-1">
          Guideline compliance, drug interactions, and evidence-based recommendations will appear here.
        </p>
      </div>
    );
  }

  const {
    efficiency_score = 90,
    guideline_compliance = 'High',
    primary_guideline_source = 'ICMR Standard Treatment Guidelines 2023',
    safety_alerts = [],
    ai_clinical_critique = '',
    recommended_alternatives_or_additions = [],
    cost_effective_indian_alternatives = [],
  } = cdsData;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
      
      {/* Panel Header */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-teal-950 text-white p-5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-sm">AI Clinical Decision Support (CDS)</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-900 text-indigo-200 border border-indigo-700">
                Evidence-Based
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Cross-referenced against ICMR, WHO, and international clinical guidelines
            </p>
          </div>
        </div>

        {/* Efficiency Gauge */}
        <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
          <div className="text-right">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
              Treatment Efficacy
            </span>
            <span className="text-sm font-extrabold text-teal-400">{efficiency_score}%</span>
          </div>
          <div className="w-8 h-8 rounded-full border-2 border-teal-400 flex items-center justify-center text-[10px] font-bold text-teal-300">
            ✓
          </div>
        </div>
      </div>

      <div className="p-5 space-y-5">
        
        {/* Verified Guideline Citation */}
        <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-indigo-50/60 border border-indigo-200/80 text-xs">
          <BookOpen className="w-4 h-4 text-indigo-700 mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-bold text-indigo-950 block">Verified Guideline Reference:</span>
            <span className="text-indigo-900">{primary_guideline_source}</span>
          </div>
        </div>

        {/* Safety & Drug Interactions Alerts */}
        {safety_alerts && safety_alerts.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Safety & Interaction Check</span>
            </h4>
            <div className="space-y-1.5">
              {safety_alerts.map((alert, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-start space-x-2"
                >
                  <span className="font-bold text-amber-700">•</span>
                  <span>{alert}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Clinical Critique */}
        {ai_clinical_critique && (
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Clinical Regimen Evaluation</span>
            </h4>
            <p className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
              {ai_clinical_critique}
            </p>
          </div>
        )}

        {/* Evidence-Based Recommendations & Better Alternatives */}
        {recommended_alternatives_or_additions && recommended_alternatives_or_additions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>Recommended Evidence-Based Enhancements</span>
            </h4>
            <div className="space-y-2.5">
              {recommended_alternatives_or_additions.map((rec, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/90 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-950">{rec.recommendation}</span>
                    {rec.evidence_level && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        {rec.evidence_level}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600 text-[11px] leading-normal">{rec.reasoning}</p>
                  
                  {onAcceptSuggestion && (
                    <button
                      type="button"
                      onClick={() => onAcceptSuggestion(rec)}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition shadow-sm"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>1-Click Add to Prescriptions</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Jan Aushadhi / Generic Cost Optimization */}
        {cost_effective_indian_alternatives && cost_effective_indian_alternatives.length > 0 && (
          <div className="p-3 rounded-xl bg-teal-50/40 border border-teal-200 text-xs text-teal-950 flex items-start space-x-2">
            <DollarSign className="w-4 h-4 text-teal-700 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-bold block">Indian Generic Affordability Note:</span>
              <p className="text-[11px] text-teal-900 mt-0.5">
                {cost_effective_indian_alternatives[0]}
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
