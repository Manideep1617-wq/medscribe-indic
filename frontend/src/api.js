import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL 
  ? `${import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')}/api`
  : '/api';

const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('medscribe_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: async (email, password) => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    const res = await api.post('/auth/token', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return res.data;
  },
  register: async (data) => {
    const res = await api.post('/auth/register', data);
    return res.data;
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
};

export const patientsAPI = {
  list: async (search = '') => {
    const res = await api.get(`/patients/?search=${encodeURIComponent(search)}`);
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/patients/', data);
    return res.data;
  },
  getWithTimeline: async (patientId) => {
    const res = await api.get(`/patients/${patientId}`);
    return res.data;
  },
  updateEncounter: async (patientId, encounterId, data) => {
    const res = await api.patch(`/patients/${patientId}/encounters/${encounterId}`, data);
    return res.data;
  },
};

export const consultationAPI = {
  getDemoCases: async () => {
    const res = await api.get('/consultations/demo-cases');
    return res.data;
  },
  getStats: async () => {
    const res = await api.get('/consultations/stats');
    return res.data;
  },
  processDialogue: async (transcript, languageHint = 'Telugu', patientId = null) => {
    const res = await api.post('/consultations/process-dialogue', {
      transcript,
      language_hint: languageHint,
      patient_id: patientId,
    });
    return res.data;
  },
  uploadAudio: async (file, languageHint = 'Telugu', patientId = null) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('language_hint', languageHint);
    if (patientId) formData.append('patient_id', patientId);
    const res = await api.post('/consultations/upload-audio', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  refineVoice: async (currentRecord, doctorDictation) => {
    const res = await api.post('/consultations/refine-voice', {
      current_record: currentRecord,
      doctor_dictation: doctorDictation,
    });
    return res.data;
  },
  acceptCDSSuggestion: async (currentRecord, suggestion) => {
    const res = await api.post('/consultations/accept-cds', {
      current_record: currentRecord,
      suggestion,
    });
    return res.data;
  },
  analyzeCDS: async (diagnosis, diseaseStage, prescriptions, complaints = []) => {
    const res = await api.post('/consultations/analyze-cds', {
      diagnosis,
      disease_stage: diseaseStage,
      prescriptions,
      complaints,
    });
    return res.data;
  },
  finalize: async (payload) => {
    const res = await api.post('/consultations/finalize', payload);
    return res.data;
  },
};

export default api;
