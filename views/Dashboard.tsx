
// @ts-nocheck
import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Complaint, ComplaintStatus } from '../types';
import { LangContext } from '../App';
import { findNearbyBranches } from '../services/geminiService';
import { 
  PlusCircle, Search, ClipboardList, ChevronRight, Mail, MapPin, Sparkles, Navigation, ExternalLink, Loader2
} from 'lucide-react';

interface DashboardProps {
  user: User;
  complaints: Complaint[];
}

const Dashboard: React.FC<DashboardProps> = ({ user, complaints }) => {
  const { t } = useContext(LangContext);
  const [isLocating, setIsLocating] = useState(false);
  const [branches, setBranches] = useState<any>(null);

  const activeCount = complaints.filter(c => c.status !== ComplaintStatus.CLOSED && c.status !== ComplaintStatus.SOLVED).length;

  const handleFindBranches = () => {
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const result = await findNearbyBranches(pos.coords.latitude, pos.coords.longitude);
      setBranches(result);
      setIsLocating(false);
    }, () => {
      alert("Please enable location services.");
      setIsLocating(false);
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-700">
      <section className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-12 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-10 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4 opacity-70">
            <Sparkles size={16} className="text-indiapost-red" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">{t.smart_redressal}</span>
          </div>
          <h2 className="text-5xl font-black tracking-tighter uppercase leading-none">{t.welcome},<br/><span className="text-indiapost-red">{user.name}</span></h2>
        </div>
        
        <div className="relative z-10 bg-slate-50 dark:bg-slate-800 px-10 py-8 rounded-[2rem] border border-slate-200 dark:border-slate-700 text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">{t.active_cases}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-6xl font-black text-indiapost-red">{activeCount}</span>
            <span className="text-sm font-bold text-slate-400 uppercase">Pending</span>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { to: "/submit", icon: PlusCircle, title: t.reg, sub: t.reg_sub, color: "text-indiapost-red", bg: "bg-red-50" },
          { to: "/track", icon: Search, title: t.track, sub: t.track_sub, color: "text-slate-800", bg: "bg-slate-100" },
          { to: "/menu", icon: ClipboardList, title: t.hub, sub: t.hub_sub, color: "text-slate-600", bg: "bg-slate-100" }
        ].map((action, idx) => (
          <Link key={idx} to={action.to} className="group p-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] hover:border-indiapost-red transition-all shadow-sm">
            <div className={`${action.bg} dark:bg-slate-800 w-20 h-20 rounded-3xl flex items-center justify-center ${action.color} mb-10 border border-slate-100 dark:border-slate-700 group-hover:bg-indiapost-red group-hover:text-white transition-all`}>
              <action.icon size={36} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4 uppercase tracking-tighter">{action.title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-10">{action.sub}</p>
            <div className="flex items-center text-slate-900 dark:text-slate-100 group-hover:text-indiapost-red text-[10px] font-black uppercase gap-2 transition-colors">
              {t.proceed} <ChevronRight size={16} />
            </div>
          </Link>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3rem] p-12 shadow-sm">
         <div className="flex flex-col md:flex-row justify-between items-start gap-10">
            <div className="max-w-xl">
               <div className="flex items-center gap-3 text-indiapost-red mb-4">
                  <Navigation size={20} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Real-Time Assistance</span>
               </div>
               <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Locate Nearest Branch</h3>
               <p className="text-sm text-slate-500 mt-4 leading-relaxed font-medium">Use our AI-powered branch finder to see operational India Post offices near your current GPS location.</p>
               <button onClick={handleFindBranches} disabled={isLocating} className="mt-8 bg-black dark:bg-white dark:text-black text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all flex items-center gap-3">
                  {isLocating ? <Loader2 className="animate-spin" size={16} /> : <MapPin size={16} />} Find Nearby Branch
               </button>
            </div>
            
            {branches && (
              <div className="w-full md:w-96 bg-slate-50 dark:bg-slate-800 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-xl animate-in slide-in-from-right">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Nearby Results</p>
                 <div className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-relaxed">
                    {branches.text}
                 </div>
                 <div className="mt-6 flex flex-wrap gap-2">
                    {branches.links.map((link, i) => (
                       <a key={i} href={link} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-white dark:bg-slate-700 px-4 py-2 rounded-xl text-[8px] font-black uppercase text-indiapost-red border border-slate-100 dark:border-slate-600 hover:bg-indiapost-red hover:text-white transition-all">
                          View Map <ExternalLink size={10} />
                       </a>
                    ))}
                 </div>
              </div>
            )}
         </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3.5rem] p-16 flex flex-col md:flex-row items-center justify-between gap-12">
        <div className="space-y-6 max-w-xl text-center md:text-left">
          <h4 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">{t.resources}</h4>
          <p className="text-base text-slate-500 font-medium leading-relaxed">{t.resources_sub}</p>
        </div>
        <div className="grid grid-cols-2 gap-8">
          <div className="p-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl text-center group cursor-pointer hover:border-indiapost-red transition-all">
            <Mail className="mx-auto mb-4 text-indiapost-red" size={32} />
            <span className="text-[11px] font-black uppercase text-slate-600 dark:text-slate-300 tracking-[0.2em]">{t.speed}</span>
          </div>
          <div className="p-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl text-center group cursor-pointer hover:border-indiapost-red transition-all">
            <MapPin className="mx-auto mb-4 text-indiapost-red" size={32} />
            <span className="text-[11px] font-black uppercase text-slate-600 dark:text-slate-300 tracking-[0.2em]">{t.find}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
