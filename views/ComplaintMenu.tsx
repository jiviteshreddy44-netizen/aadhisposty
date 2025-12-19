
import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Complaint, ComplaintStatus } from '../types';
import { LangContext } from '../App';
import { ArrowLeft, ChevronRight, Calendar, MapPin, Tag, Info, History, Star, Send } from 'lucide-react';

interface MenuProps {
  complaints: Complaint[];
  onUpdateFeedback?: (id: string, rating: number, comment: string) => void;
}

const ComplaintMenu: React.FC<MenuProps> = ({ complaints, onUpdateFeedback }) => {
  const navigate = useNavigate();
  const { t } = useContext(LangContext);
  const [feedbackingId, setFeedbackingId] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmitFeedback = (id: string) => {
    if (onUpdateFeedback) {
      onUpdateFeedback(id, rating, comment);
      setFeedbackingId(null);
      setRating(0);
      setComment('');
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 animate-in fade-in duration-700">
      <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-400 hover:text-indiapost-red mb-12 transition-colors font-black text-[10px] uppercase tracking-[0.3em]">
        <ArrowLeft size={16} /> {t.nav_home}
      </button>

      <div className="flex flex-col md:flex-row items-end justify-between gap-8 mb-16">
        <div>
          <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">{t.records_title}</h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.4em] mt-3">Verified Citizen Records</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-sm flex items-center gap-4">
          <History size={16} className="text-indiapost-red" />
          <span>{t.records_total}: <span className="text-indiapost-red text-lg ml-1">{complaints.length}</span></span>
        </div>
      </div>

      {complaints.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-24 text-center rounded-[3rem] border border-slate-200 dark:border-slate-800">
          <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-8">
            <Info size={40} className="text-slate-300" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">{t.records_empty}</h3>
          <p className="text-sm text-slate-400 mb-12 font-bold uppercase tracking-widest">{t.records_empty_sub}</p>
          <button onClick={() => navigate('/submit')} className="bg-black dark:bg-white dark:text-black text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-[0.3em] hover:bg-slate-800 transition">{t.nav_submit}</button>
        </div>
      ) : (
        <div className="grid gap-8">
          {complaints.map((c) => (
            <div key={c.id} className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 hover:border-black dark:hover:border-white transition-all shadow-sm overflow-hidden">
              <div className="p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                <div className="flex-grow">
                  <div className="flex flex-wrap items-center gap-4 mb-6">
                    <span className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">#{c.id}</span>
                    <span className={`px-5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                      c.status === ComplaintStatus.SOLVED ? 'bg-green-50 text-green-600 border-green-100' : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}>
                      {c.status}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-500 mb-8 italic">"{c.description}"</p>
                  <div className="flex flex-wrap items-center gap-10 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
                    <div className="flex items-center gap-3"><Calendar size={16} /> {new Date(c.date).toLocaleDateString()}</div>
                    <div className="flex items-center gap-3"><MapPin size={16} /> {c.postOffice}</div>
                    <div className="flex items-center gap-3"><Tag size={16} /> {c.analysis?.category}</div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-4">
                  <button onClick={() => navigate('/track')} className="bg-black dark:bg-white dark:text-black text-white font-black px-10 py-4 rounded-2xl border border-transparent hover:bg-slate-800 transition-all text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3">
                    {t.records_locate} <ChevronRight size={18} />
                  </button>
                  
                  {c.status === ComplaintStatus.SOLVED && !c.feedback && (
                    <button onClick={() => setFeedbackingId(c.id)} className="text-indiapost-red text-[9px] font-black uppercase tracking-widest hover:underline text-center">Rate Resolution</button>
                  )}
                  {c.feedback && (
                    <div className="flex items-center gap-2 justify-center text-amber-500 font-black text-[10px] uppercase">
                       <Star size={12} fill="currentColor" /> {c.feedback.rating}/5 Rated
                    </div>
                  )}
                </div>
              </div>

              {feedbackingId === c.id && (
                <div className="bg-slate-50 dark:bg-slate-800/50 p-10 border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-2">
                   <p className="text-[10px] font-black uppercase tracking-widest mb-6 text-slate-400">Rate our resolution quality</p>
                   <div className="flex gap-4 mb-8">
                      {[1, 2, 3, 4, 5].map(s => (
                        <button key={s} onClick={() => setRating(s)} className={`p-4 rounded-xl border-2 transition-all ${rating >= s ? 'bg-amber-500 border-amber-500 text-white' : 'border-slate-200 text-slate-300'}`}>
                           <Star size={24} fill={rating >= s ? 'currentColor' : 'none'} />
                        </button>
                      ))}
                   </div>
                   <textarea placeholder="Tell us how we did..." className="w-full p-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:border-black dark:focus:border-white text-sm font-bold mb-6" value={comment} onChange={(e) => setComment(e.target.value)} />
                   <div className="flex justify-end gap-4">
                      <button onClick={() => setFeedbackingId(null)} className="px-8 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Cancel</button>
                      <button onClick={() => handleSubmitFeedback(c.id)} className="bg-black dark:bg-white dark:text-black text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Send size={14} /> Submit Feedback</button>
                   </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ComplaintMenu;
