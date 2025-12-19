
import React, { useState, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Complaint, ComplaintStatus, ConsignmentScan } from '../types';
import { LangContext } from '../App';
import { Search, ArrowLeft, CheckCircle, Clock, ShieldCheck, MapPin, Package, ChevronRight, Printer, Share2, Info, AlertCircle } from 'lucide-react';

interface TrackProps {
  complaints: Complaint[];
}

const TrackStatus: React.FC<TrackProps> = ({ complaints }) => {
  const navigate = useNavigate();
  const { t } = useContext(LangContext);
  const [searchId, setSearchId] = useState('');
  const [selected, setSelected] = useState<Complaint | null>(complaints[0] || null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const found = complaints.find(c => 
      c.id.toLowerCase() === searchId.toLowerCase() || 
      c.trackingNumber?.toLowerCase() === searchId.toLowerCase()
    );
    setSelected(found || null);
    if (!found) alert("No record found with that Tracking Number or Ref ID.");
  };

  // Mock scan history if it doesn't exist
  const mockScans: ConsignmentScan[] = useMemo(() => [
    { date: "24/10/2023", time: "14:22:10", office: "New Delhi GPO", event: "Item Dispatched" },
    { date: "23/10/2023", time: "09:15:45", office: "Delhi NSH", event: "Item Received" },
    { date: "23/10/2023", time: "08:10:20", office: "Delhi NSH", event: "Item Bagged" },
    { date: "22/10/2023", time: "18:45:12", office: "Mumbai Central", event: "Item Dispatched" },
    { date: "22/10/2023", time: "11:30:00", office: "Mumbai Central", event: "Item Booked" },
  ], []);

  const steps = [
    { key: ComplaintStatus.NEW, label: "Booked", icon: Clock },
    { key: ComplaintStatus.IN_PROGRESS, label: "In Transit", icon: Package },
    { key: ComplaintStatus.SOLVED, label: "Out for Delivery", icon: MapPin },
    { key: ComplaintStatus.CLOSED, label: "Delivered", icon: CheckCircle },
  ];

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 animate-in fade-in duration-700">
      <div className="flex justify-between items-center mb-10">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-400 hover:text-indiapost-red transition-colors font-black text-[10px] uppercase tracking-widest">
          <ArrowLeft size={14} /> {t.nav_home}
        </button>
        <div className="flex gap-4">
          <button className="p-2 text-slate-400 hover:text-black"><Printer size={18} /></button>
          <button className="p-2 text-slate-400 hover:text-black"><Share2 size={18} /></button>
        </div>
      </div>

      <div className="text-center mb-12">
        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">Track Consignment</h1>
        <p className="text-indiapost-red font-bold uppercase text-[9px] tracking-[0.4em] mt-3">Public Tracking System (PTS)</p>
      </div>

      <form onSubmit={handleSearch} className="max-w-3xl mx-auto mb-16 relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-indiapost-red to-indiapost-amber rounded-xl blur opacity-20 group-focus-within:opacity-40 transition duration-1000"></div>
        <div className="relative flex">
          <input
            type="text"
            placeholder="Enter Consignment Number (e.g. EB123456789IN)"
            className="w-full pl-8 pr-44 py-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl outline-none focus:ring-2 focus:ring-indiapost-red transition-all text-xl font-bold tracking-tight"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
          />
          <button type="submit" className="absolute right-3 top-3 bottom-3 bg-indiapost-red text-white px-10 rounded-lg font-black hover:bg-red-800 transition-all flex items-center gap-3 uppercase text-[11px] tracking-widest shadow-lg active:scale-95">
            <Search size={18} /> Track Now
          </button>
        </div>
      </form>

      {selected ? (
        <div className="space-y-8">
          {/* TRACKING HEADER CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
             <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                   <p className="text-lg font-black text-slate-900 dark:text-white uppercase">{selected.status}</p>
                </div>
             </div>
             <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Consignment No</p>
                <p className="text-lg font-black text-slate-900 dark:text-white uppercase">{selected.trackingNumber || 'N/A'}</p>
             </div>
             <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Booking Date</p>
                <p className="text-lg font-black text-slate-900 dark:text-white uppercase">{new Date(selected.date).toLocaleDateString()}</p>
             </div>
             <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Destination</p>
                <p className="text-lg font-black text-slate-900 dark:text-white uppercase truncate">{selected.postOffice}</p>
             </div>
          </div>

          {/* OFFICIAL TRACKING TABLE */}
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            <div className="bg-slate-50 dark:bg-slate-800 px-10 py-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-3">
                <Package size={16} className="text-indiapost-red" /> Consignment Details
              </h3>
              <div className="text-[9px] font-black text-slate-400 uppercase">Last Updated: 10 mins ago</div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                    <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Time</th>
                    <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Office</th>
                    <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Event</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {mockScans.map((scan, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-10 py-5 text-sm font-bold text-slate-900 dark:text-white">{scan.date}</td>
                      <td className="px-10 py-5 text-sm font-medium text-slate-500">{scan.time}</td>
                      <td className="px-10 py-5 text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">{scan.office}</td>
                      <td className="px-10 py-5">
                         <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${i === 0 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                           {scan.event}
                         </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* COMPLAINT STATUS LINK (If associated) */}
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800 rounded-3xl p-8 flex items-center justify-between group cursor-pointer hover:border-amber-400 transition-all">
             <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-amber-500 shadow-sm border border-amber-50">
                   <AlertCircle size={32} />
                </div>
                <div>
                   <h4 className="text-xl font-black text-amber-900 dark:text-amber-200 uppercase tracking-tight">Grievance Linked: #{selected.id}</h4>
                   <p className="text-xs font-bold text-amber-600/70 uppercase tracking-widest mt-1">Our AI Architect is actively investigating this delay.</p>
                </div>
             </div>
             <button onClick={() => navigate('/menu')} className="bg-amber-500 text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg group-hover:scale-105 transition-all">View Redressal</button>
          </div>
        </div>
      ) : searchId && (
        <div className="text-center p-24 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-inner">
          <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-8">
            <Info size={40} className="text-slate-300" />
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">No Consignment Record</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verify the number or try our help desk</p>
        </div>
      )}

      {/* FOOTER INFO */}
      <div className="mt-20 p-10 bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-10">
         <div className="flex items-center gap-4">
            <ShieldCheck size={24} className="text-indiapost-red" />
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-relaxed">Verified by Central Postal Authentication Unit</p>
         </div>
         <div className="flex items-center gap-4">
            <MapPin size={24} className="text-indiapost-red" />
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-relaxed">Real-time Node tracking across 1.5 Lakh Branches</p>
         </div>
         <div className="flex items-center gap-4">
            <Clock size={24} className="text-indiapost-red" />
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-relaxed">Historical data maintained for 12 months</p>
         </div>
      </div>
    </div>
  );
};

export default TrackStatus;
