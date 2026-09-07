import React, { useState } from 'react';
import { X, Lock, Mail, User, Building, Stethoscope, Sparkles } from 'lucide-react';
import { authAPI } from '../api';

export default function AuthModal({ isOpen, onClose, onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('doctor@aiims.edu.in');
  const [password, setPassword] = useState('password123');
  const [name, setName] = useState('Dr. Aarav Sharma, MD');
  const [department, setDepartment] = useState('General Medicine & Diabetology');
  const [hospital, setHospital] = useState('AIIMS Research Hospital');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let data;
      if (isRegister) {
        data = await authAPI.register({
          name,
          email,
          password,
          department,
          hospital_name: hospital,
        });
      } else {
        data = await authAPI.login(email, password);
      }
      localStorage.setItem('medscribe_token', data.access_token);
      onLoginSuccess(data.doctor);
      onClose();
    } catch (err) {
      console.error('Auth error:', err);
      if (!err.response) {
        setError('Cannot connect to backend server (is the backend running on port 8000 / Render?). Click "1-Click Demo Login" above to continue in offline demo mode.');
      } else {
        setError(err.response?.data?.detail || 'Authentication failed. Please verify credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    setError('');
    setLoading(true);
    const demoDoctor = {
      id: 1,
      name: 'Dr. Aarav Sharma, MD (AIIMS)',
      email: 'doctor@aiims.edu.in',
      department: 'General Medicine & Diabetology',
      hospital_name: 'AIIMS Hospital & Research Center',
    };

    try {
      const data = await authAPI.login('doctor@aiims.edu.in', 'password123');
      localStorage.setItem('medscribe_token', data.access_token);
      onLoginSuccess(data.doctor);
      onClose();
    } catch (err) {
      // If backend unreachable or login fails, provide instant demo session so presentation never blocks
      console.warn('Backend unavailable, using instant demo doctor profile:', err);
      localStorage.setItem('medscribe_token', 'demo-aiims-doctor-token-2026');
      onLoginSuccess(demoDoctor);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h3 className="font-bold text-base">Doctor Portal</h3>
              <p className="text-xs text-slate-400">Secure clinical authentication</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Demo Login Banner for Examiners */}
        <div className="px-6 pt-5">
          <button
            type="button"
            onClick={handleQuickDemoLogin}
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-semibold text-xs transition shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>1-Click Demo Login (Dr. Aarav Sharma, AIIMS)</span>
          </button>
        </div>

        <div className="px-6 py-4 flex items-center my-1">
          <div className="flex-1 border-t border-slate-200"></div>
          <span className="px-3 text-xs text-slate-400 font-medium">or continue with credentials</span>
          <div className="flex-1 border-t border-slate-200"></div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              {error}
            </div>
          )}

          {isRegister && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Doctor Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    placeholder="e.g. Dr. Priyadarshini Reddy, MD"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    placeholder="Diabetology"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Hospital Name</label>
                  <input
                    type="text"
                    required
                    value={hospital}
                    onChange={(e) => setHospital(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    placeholder="NIMS Hospital"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Medical Staff Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                placeholder="doctor@hospital.org"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-md transition disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : isRegister ? 'Create Doctor Account' : 'Sign In to Clinical Workspace'}
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-xs text-teal-700 hover:underline font-medium"
            >
              {isRegister ? 'Already have an account? Sign in' : "New doctor? Register here"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
