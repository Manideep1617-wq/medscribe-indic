import React from 'react';
import { Stethoscope, User, LogOut, ShieldCheck, Sparkles, BookOpen, Activity, Languages, BarChart2 } from 'lucide-react';

export default function Navbar({
  doctor,
  onLogout,
  onOpenAuth,
  onOpenDemoCases,
  activeTab,
  setActiveTab
}) {
  return (
    <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Tag */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Stethoscope className="w-6 h-6 text-slate-950 font-bold" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-['Plus_Jakarta_Sans'] font-extrabold text-xl tracking-tight text-white">
                  MedScribe <span className="text-teal-400">Indic</span>
                </span>
                <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-full bg-teal-950 text-teal-300 border border-teal-700/50">
                  AIIMS & ICMR Calibrated
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Multilingual Ambient Clinical Intelligence & CDS (తెలుగు • हिंदी • English)
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center space-x-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setActiveTab('consultation')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'consultation'
                  ? 'bg-teal-600 text-white shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Live Consultation</span>
            </button>
            <button
              onClick={() => setActiveTab('patients')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'patients'
                  ? 'bg-teal-600 text-white shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Patients Timeline</span>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'analytics'
                  ? 'bg-teal-600 text-white shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              <span>OPD Analytics</span>
            </button>
          </div>

          {/* Right Action Menu: Viva Demo Loader + Doctor Profile */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onOpenDemoCases}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all shadow-sm group"
              title="Load Indian Clinical OPD Demo Cases for Viva"
            >
              <Sparkles className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
              <span>Viva Demo Cases</span>
            </button>

            {doctor ? (
              <div className="flex items-center space-x-3 pl-3 border-l border-slate-800">
                <div className="text-right hidden md:block">
                  <p className="text-xs font-bold text-slate-100">{doctor.name}</p>
                  <p className="text-[10px] text-teal-400">{doctor.department}</p>
                </div>
                <div className="w-9 h-9 rounded-full bg-teal-700/40 border border-teal-500 flex items-center justify-center text-teal-200 font-bold text-xs">
                  {doctor.name ? doctor.name.replace('Dr. ', '').charAt(0) : 'D'}
                </div>
                <button
                  onClick={onLogout}
                  title="Logout"
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-medium text-xs shadow-md transition-all"
              >
                <User className="w-4 h-4" />
                <span>Doctor Login</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
