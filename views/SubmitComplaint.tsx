
import React, { useState, useContext, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Complaint, ComplaintStatus } from '../types';
import { LangContext } from '../App';
import { analyzeComplaint, extractDetailsFromImage, translateAndRefine, transcribeAudio } from '../services/geminiService';
import { 
  ArrowLeft, 
  Camera, 
  FileText, 
  MapPin, 
  Calendar, 
  Loader2,
  Mic,
  CheckCircle2,
  X,
  Hash,
  Sparkles,
  Globe,
  ShieldAlert,
  Zap,
  Square,
  Activity
} from 'lucide-react';

interface SubmitProps {
  user: User;
  onSubmit: (newComplaint: Complaint) => void;
  existingComplaints?: Complaint[];
}

const SubmitComplaint: React.FC<SubmitProps> = ({ user, onSubmit, existingComplaints = [] }) => {
  const navigate = useNavigate();
  const { t } = useContext(LangContext);
  const [description, setDescription] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [postOffice, setPostOffice] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [image, setImage] = useState<string | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  
  const [detectedLang, setDetectedLang] = useState<string | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleExtractDetails = async () => {
    if (!image) return;
    setIsExtracting(true);
    try {
      const details = await extractDetailsFromImage(image);
      if (details) {
        if (details.trackingNumber) setTrackingNumber(details.trackingNumber);
        if (details.postOffice) setPostOffice(details.postOffice);
      }
    } catch (e) {
      console.error("Extraction failed:", e);
    }
    setIsExtracting(false);
  };

  const startRecording = async () => {
    setVoiceError(null);
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mimeType = ['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/wav'].find(type => MediaRecorder.isTypeSupported(type)) || '';
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
        await processVoiceRecording(audioBlob);
        streamRef.current?.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      setVoiceError("Microphone access denied. Please ensure you are on a secure (HTTPS) connection.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processVoiceRecording = async (blob: Blob) => {
    if (blob.size < 500) return; 
    setIsProcessingVoice(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        const rawText = await transcribeAudio(base64Audio, blob.type);
        
        if (rawText && rawText.trim()) {
          setIsTranslating(true);
          const result = await translateAndRefine(rawText);
          if (result?.translated) {
            setDescription(prev => prev ? `${prev}\n${result.translated}` : result.translated);
            setDetectedLang(result.originalLang);
          }
          setIsTranslating(false);
        }
      };
    } catch (err) {
      console.error("Voice process error:", err);
      setVoiceError("The transcription service is temporarily unavailable. Please type your grievance.");
    } finally {
      setIsProcessingVoice(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    setIsSubmitting(true);
    
    try {
      const context = existingComplaints.slice(0, 3).map(c => c.description).join('\n');
      const analysis = await analyzeComplaint(description, image || undefined, context, trackingNumber);
      
      const newComplaint: Complaint = {
        id: `PGC-${Math.floor(Math.random() * 90000) + 10000}`,
        userId: user.id, userName: user.name, description, trackingNumber, postOffice, date, imageUrl: image || undefined,
        status: ComplaintStatus.NEW, analysis,
        updates: [{ timestamp: new Date().toISOString(), author: 'System', message: 'Complaint Logged Successfully.', isInternal: false, type: 'message' }],
        escalationLevel: 0,
        lastActivityAt: new Date().toISOString(),
        slaPaused: false
      };

      onSubmit(newComplaint);
      setTimeout(() => navigate('/menu'), 1500);
    } catch (err) {
      console.error("Submission failed:", err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <button onClick={() => navigate('/')} className="flex items-center gap-3 text-slate-400 hover:text-indiapost-red mb-12 transition-all font-black text-xs uppercase tracking-widest group">
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> {t.nav_home}
      </button>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3.5rem] overflow-hidden shadow-2xl">
        <div className="bg-slate-50 dark:bg-slate-800 p-16 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-4xl font-black uppercase tracking-tight text-slate-900 dark:text-white leading-none">{t.submit_title}</h2>
          <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-indiapost-red mt-4">Grievance Registration Protocol</p>
        </div>

        <form onSubmit={handleSubmit} className="p-16 space-y-16">
          {voiceError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-8 rounded-3xl flex items-center gap-6 text-red-600 dark:text-red-400 animate-in slide-in-from-top-4">
              <ShieldAlert size={24} className="shrink-0" />
              <p className="text-xs font-black uppercase tracking-widest">{voiceError}</p>
              <button type="button" onClick={() => setVoiceError(null)} className="ml-auto p-2 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-xl transition-colors"><X size={20} /></button>
            </div>
          )}

          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
              <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center gap-4">
                <FileText size={20} className="text-indiapost-red" /> {t.submit_desc}
              </label>
              
              <div className="flex items-center gap-4 bg-slate-100 dark:bg-slate-800/50 p-3 rounded-3xl border border-slate-200 dark:border-slate-700">
                <button 
                  type="button" 
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isProcessingVoice || isTranslating}
                  className={`flex items-center gap-4 px-10 py-4 rounded-2xl text-[11px] font-black uppercase transition-all shadow-md active:scale-95 ${isRecording ? 'bg-indiapost-red text-white scale-105 ring-8 ring-red-100 dark:ring-red-900/20 animate-pulse' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-black dark:hover:border-white disabled:opacity-50'}`}
                >
                  {isRecording ? <Square size={18} fill="currentColor" /> : <Mic size={18} />} 
                  {isRecording ? 'Terminate Audio' : 'Neural Voice Input'}
                </button>
                
                {isRecording && (
                  <div className="flex items-center gap-2 px-4">
                    <Activity size={20} className="text-indiapost-red animate-pulse" />
                    <span className="text-[10px] font-black text-indiapost-red uppercase tracking-widest">Listening...</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="relative group">
                 <textarea required rows={8} placeholder={t.submit_placeholder_desc} className={`w-full p-10 bg-slate-50 dark:bg-slate-800 border-2 ${(isProcessingVoice || isTranslating) ? 'border-indiapost-red shadow-lg' : 'border-slate-200 dark:border-slate-700'} rounded-[2.5rem] outline-none focus:border-black dark:focus:border-white transition-all font-medium text-lg leading-relaxed placeholder:text-slate-300`} value={description} onChange={(e) => setDescription(e.target.value)} />
                 
                 {(isProcessingVoice || isTranslating) && (
                   <div className="absolute inset-0 bg-white/70 dark:bg-black/70 backdrop-blur-md rounded-[2.5rem] flex flex-col items-center justify-center gap-6 z-20 animate-in fade-in">
                      <Loader2 className="animate-spin text-indiapost-red" size={56} />
                      <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-900 dark:text-white">
                        {isProcessingVoice ? 'Neural Logic Matrix Extraction...' : 'Refining to Official Grievance Standards...'}
                      </p>
                   </div>
                 )}
              </div>

              {detectedLang && !isProcessingVoice && !isTranslating && (
                <div className="flex items-center justify-end gap-3 px-8 animate-in slide-in-from-top-2">
                   <Globe size={14} className="text-blue-500" />
                   <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">Source Language: {detectedLang}</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="space-y-4">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3"><Hash size={16} className="text-indiapost-red" /> Tracking ID</label>
              <input type="text" placeholder="e.g. EB123456789IN" className="w-full p-6 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-black transition-all font-bold text-lg" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} />
            </div>
            <div className="space-y-4">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-3"><MapPin size={16} className="text-indiapost-red" /> Post Office</label>
              <input type="text" required placeholder={t.submit_placeholder_branch} className="w-full p-6 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-black transition-all font-bold text-lg" value={postOffice} onChange={(e) => setPostOffice(e.target.value)} />
            </div>
            <div className="space-y-4">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3"><Calendar size={16} className="text-indiapost-red" /> Date</label>
              <input type="date" required className="w-full p-6 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-black transition-all font-bold text-lg" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3"><Camera size={16} className="text-indiapost-red" /> Verification Evidence</label>
              {image && (
                <button type="button" onClick={handleExtractDetails} disabled={isExtracting} className="flex items-center gap-3 text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-6 py-3 rounded-2xl border-2 border-slate-200 dark:border-slate-800 hover:bg-black hover:text-white transition-all">
                  {isExtracting ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />} AI Extraction
                </button>
              )}
            </div>
            <div className="border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-[3.5rem] p-16 text-center hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all relative group cursor-pointer">
              {image ? (
                <div className="relative inline-block group/img">
                  <img src={image} alt="Preview" className="max-h-80 mx-auto rounded-3xl shadow-2xl transition-transform group-hover/img:scale-[1.02]" />
                  <button onClick={(e) => { e.preventDefault(); setImage(null); }} className="absolute -top-6 -right-6 bg-black text-white p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all"><X size={24} /></button>
                </div>
              ) : (
                <div className="space-y-6 py-12">
                  <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-[2rem] flex items-center justify-center mx-auto group-hover:bg-black dark:group-hover:bg-white transition-all shadow-xl group-hover:shadow-2xl">
                    <Camera className="text-slate-300 group-hover:text-white dark:group-hover:text-black transition-colors" size={40} />
                  </div>
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Drop Receipt or Click to Upload</p>
                  <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageChange} />
                </div>
              )}
            </div>
          </div>

          <div className="pt-12">
            <button type="submit" disabled={isSubmitting || isProcessingVoice || isRecording || isTranslating} className="w-full bg-black dark:bg-white dark:text-black text-white py-10 rounded-[2.5rem] font-black uppercase text-base tracking-[0.5em] hover:bg-slate-800 dark:hover:bg-slate-100 transition shadow-2xl shadow-black/10 flex items-center justify-center gap-6 active:scale-[0.98] disabled:opacity-50">
              {isSubmitting ? <><Loader2 className="animate-spin" size={24} /> Dispatching Grid Intelligence...</> : <><CheckCircle2 size={32} /> Securely Submit Grievance</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubmitComplaint;
