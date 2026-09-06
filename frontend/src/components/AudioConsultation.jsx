import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  Languages,
  Play,
  Square,
  Upload,
  RefreshCw,
  User,
  PlusCircle,
  AlertCircle,
  FileAudio,
  Check
} from 'lucide-react';
import { consultationAPI } from '../api';

export default function AudioConsultation({
  activePatient,
  onOpenPatientSelector,
  onOpenDemoCases,
  onProcessDialogue,
  onAudioUploaded,
  isProcessing,
  initialTranscript = '',
  initialLanguage = 'Telugu'
}) {
  const [transcript, setTranscript] = useState(initialTranscript);
  const [language, setLanguage] = useState(initialLanguage);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    setTranscript(initialTranscript);
  }, [initialTranscript]);

  useEffect(() => {
    setLanguage(initialLanguage);
  }, [initialLanguage]);

  // Initialize Web Speech Recognition if available in browser
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event) => {
        let currentText = '';
        for (let i = 0; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript + ' ';
        }
        setTranscript(currentText);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        clearInterval(timerRef.current);
      };

      recognition.onend = () => {
        setIsRecording(false);
        clearInterval(timerRef.current);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleRecording = () => {
    if (!isRecording) {
      setTranscript('');
      setRecordingTime(0);
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      if (recognitionRef.current) {
        if (language === 'Telugu') recognitionRef.current.lang = 'te-IN';
        else if (language === 'Hindi') recognitionRef.current.lang = 'hi-IN';
        else recognitionRef.current.lang = 'en-IN';

        try {
          recognitionRef.current.start();
        } catch (e) {
          console.warn('Speech recognition start failed or already active:', e);
        }
      }
    } else {
      setIsRecording(false);
      clearInterval(timerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.warn('Error stopping recognition:', e);
        }
      }
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadedFile(file);
    setIsUploading(true);
    try {
      const result = await consultationAPI.uploadAudio(
        file,
        language,
        activePatient ? activePatient.id : null
      );
      if (onAudioUploaded) {
        onAudioUploaded(result);
      }
    } catch (err) {
      console.error('File upload error:', err);
      alert('Audio file processing failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setIsUploading(false);
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRunAnalysis = () => {
    if (!transcript.trim()) return;
    onProcessDialogue(transcript, language);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
      
      {/* Patient Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-xl bg-teal-100 border border-teal-200 flex items-center justify-center text-teal-800">
            <User className="w-6 h-6" />
          </div>
          <div>
            {activePatient ? (
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-slate-900 text-sm">{activePatient.name}</h3>
                  <span className="text-xs text-slate-500">({activePatient.age}y, {activePatient.gender})</span>
                  {activePatient.blood_group && (
                    <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-700 text-[10px] font-bold border border-red-200">
                      {activePatient.blood_group}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-500 mt-0.5">
                  <span className="font-mono">{activePatient.uhid}</span>
                  <span>•</span>
                  <span>Language: {activePatient.preferred_language || 'Telugu'}</span>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="font-bold text-slate-700 text-sm">No Patient Selected</h3>
                <p className="text-xs text-slate-500">Attach consultation to a patient profile for timeline tracking</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenPatientSelector}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 text-xs font-semibold transition shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{activePatient ? 'Change Patient' : 'Select / Register Patient'}</span>
          </button>
        </div>
      </div>

      {/* Language Selector & Mode Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Languages className="w-4 h-4 text-teal-600" />
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Consultation Language:</span>
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            {[
              { id: 'Telugu', label: 'Telugu (తెలుగు)' },
              { id: 'Hindi', label: 'Hindi (हिंदी)' },
              { id: 'English', label: 'English' },
              { id: 'Mixed', label: 'Code-Mixed (Tenglish/Hinglish)' },
            ].map((lang) => (
              <button
                key={lang.id}
                onClick={() => setLanguage(lang.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  language === lang.id
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        {/* Action Controls: Audio File Upload + Viva Scenarios */}
        <div className="flex items-center space-x-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="audio/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-semibold transition shadow-sm"
            title="Upload pre-recorded audio file (.mp3, .wav, .m4a)"
          >
            {isUploading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-600" />
            ) : (
              <Upload className="w-3.5 h-3.5 text-slate-600" />
            )}
            <span>{isUploading ? 'Uploading Audio...' : 'Upload Audio File'}</span>
          </button>

          <button
            onClick={onOpenDemoCases}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold transition shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Load Indic OPD Scenarios</span>
          </button>
        </div>
      </div>

      {/* Live Audio Visualizer / Recording Controls */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-white border border-slate-700 shadow-inner">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleRecording}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all transform active:scale-95 ${
                isRecording
                  ? 'bg-red-600 text-white animate-pulse shadow-red-600/40 ring-4 ring-red-500/30'
                  : 'bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold shadow-teal-500/30'
              }`}
              title={isRecording ? 'Stop Ambient Recording' : 'Start Ambient Recording'}
            >
              {isRecording ? <Square className="w-6 h-6 fill-current" /> : <Mic className="w-6 h-6" />}
            </button>

            <div>
              <div className="flex items-center space-x-2">
                <span className={`w-2.5 h-2.5 rounded-full ${isRecording ? 'bg-red-500 animate-ping' : 'bg-emerald-400'}`}></span>
                <h4 className="font-bold text-sm">
                  {isRecording ? 'Ambient Listening Active...' : 'Microphone Ready'}
                </h4>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isRecording
                  ? `Recording in progress • ${formatTimer(recordingTime)}`
                  : 'Click microphone to record live consultation in Telugu, Hindi, or English'}
              </p>
            </div>
          </div>

          {/* Waveform Animation during recording */}
          {isRecording && (
            <div className="flex items-center space-x-1.5 h-10 px-4 py-2 bg-slate-800/80 rounded-xl border border-slate-700">
              <div className="w-1 bg-teal-400 rounded-full animate-wave-1"></div>
              <div className="w-1 bg-teal-300 rounded-full animate-wave-2"></div>
              <div className="w-1 bg-emerald-400 rounded-full animate-wave-3"></div>
              <div className="w-1 bg-teal-400 rounded-full animate-wave-4"></div>
              <div className="w-1 bg-cyan-300 rounded-full animate-wave-5"></div>
              <div className="w-1 bg-teal-400 rounded-full animate-wave-2"></div>
              <span className="text-xs font-mono font-bold text-teal-300 ml-2">
                {formatTimer(recordingTime)}
              </span>
            </div>
          )}

        </div>
      </div>

      {/* Transcript Textarea & Realtime Output */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Doctor - Patient Dialogue Transcript (Indic / Vernacular)
          </label>
          <span className="text-[11px] text-slate-500">
            You can also paste or type consultation script directly
          </span>
        </div>

        <div className="relative">
          <textarea
            rows={7}
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="e.g. డాక్టర్: నమస్కారం, ఏం సమస్యతో వచ్చారు? పేషెంట్: రెండు వారాల నుండి ఛాతీలో మంటగా ఉంది, దగ్గు కూడా వస్తుంది..."
            className="w-full p-4 text-xs font-normal leading-relaxed border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none bg-slate-50/50 shadow-inner font-sans"
          />
          {transcript && (
            <button
              onClick={() => setTranscript('')}
              className="absolute right-3 top-3 px-2 py-1 rounded bg-slate-200/80 hover:bg-slate-300 text-slate-600 text-[10px] font-semibold transition"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <Sparkles className="w-4 h-4 text-teal-600" />
          <span>Multimodal Indic NLP converts dialect symptoms to standard SOAP format</span>
        </div>

        <button
          onClick={handleRunAnalysis}
          disabled={!transcript.trim() || isProcessing}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs shadow-lg shadow-teal-600/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Processing Indic Medical Pipeline...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Structure SOAP Notes & Analyze CDS</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
}
