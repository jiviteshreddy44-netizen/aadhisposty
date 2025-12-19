
// @ts-nocheck
import React, { useState, useMemo } from 'react';
import { Complaint, ComplaintStatus, TicketUpdate, User } from '../types';
import { polishDraft } from '../services/geminiService';
import { 
  Search, CheckCircle, Clock, Zap, Send, Inbox,
  LayoutGrid, BarChart, AlertTriangle, Target,
  Sparkles, Cpu, Loader2, TrendingUp, Globe, 
  Settings, Mail, Hash, 
  MessageSquare, User as UserAvatar, 
  Image as ImageIcon, Download, ChevronRight,
  Filter, Info, ListChecks, Activity, MessageCircle,
  AlertOctagon, History, Shield, Tag, Timer, Users,
  UserCheck
} from 'lucide-react';

interface AdminProps {
  complaints: Complaint[];
  user: User;
  onUpdate: (updatedComplaints: Complaint[]) => void;
}

type ViewFilter = 'inbox' | 'unassigned' | 'all' | 'closed' | 'dashboard';

const AdminTickets: React.FC<AdminProps> = ({ complaints: initialComplaints, user, onUpdate }) => {
  const [complaints, setComplaints] = useState<Complaint[]>(initialComplaints);
  const [selectedId, setSelectedId] = useState<string | null>(initialComplaints[0]?.id || null);
  const [currentView, setCurrentView] = useState<ViewFilter>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [replyText, setReplyText] = useState('');
  const [isPolishing, setIsPolishing] = useState(false);

  const selectedTicket = complaints.find(c => c.id === selectedId);

  const stats = useMemo(() => {
    const total = complaints.length;
    const closed = complaints.filter(c => c.status === ComplaintStatus.CLOSED).length;
    return {
      inbox: total - closed,
      unassigned: complaints.filter(c => !c.assignedAgentId).length,
      all: total,
      closed,
      avgPriority: Math.round(complaints.reduce((acc, c) => acc + (c.analysis?.priorityScore || 0), 0) / (total || 1)),
      resolvedRate: total > 0 ? Math.round((closed / total) * 100) : 0
    };
  }, [complaints]);

  const filtered = useMemo(() => {
    return complaints.filter(c => {
      const matchesSearch = c.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           c.userName.toLowerCase().includes(searchQuery.toLowerCase());
      if (currentView === 'dashboard') return false;
      const matchesView = currentView === 'inbox' ? c.status !== ComplaintStatus.CLOSED :
                         currentView === 'unassigned' ? !c.assignedAgentId :
                         currentView === 'closed' ? c.status === ComplaintStatus.CLOSED : true;
      return matchesSearch && matchesView;
    }).sort((a, b) => (b.analysis?.priorityScore || 0) - (a.analysis?.priorityScore || 0));
  }, [complaints, searchQuery, currentView]);

  const handleAction = (status: ComplaintStatus, message: string, isInternal: boolean = false) => {
    if (!selectedId || !message.trim()) return;
    const update: TicketUpdate = {
      timestamp: new Date().toISOString(),
      author: user.name,
      message,
      isInternal,
      type: isInternal ? 'internal_note' : 'message'
    };
    const updated = complaints.map(c => 
      c.id === selectedId ? { 
        ...c, 
        status: isInternal ? c.status : status, 
        updates: [...c.updates, update], 
        lastActivityAt: new Date().toISOString() 
      } : c
    );
    setComplaints(updated);
    onUpdate(updated);
    setReplyText('');
  };

  const handlePolish = async () => {
    if (!replyText.trim()) return;
    setIsPolishing(true);
    const polished = await polishDraft(replyText);
    if (polished) setReplyText(polished);
    setIsPolishing(false);
  };

  const DashboardView = () => (
    <div className="p-12 space-y-12 animate-in fade-in duration-700 max-w-7xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white uppercase">Supervisor Hub</h2>
          <p className="text-xs font-bold text-indiapost-red uppercase tracking-[0.4em] mt-3">Operational Intelligence Command</p>
        </div>
        <button className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:shadow-lg transition-all">
          <Download size={16} /> Export System Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {[
          { label: 'Active Tasks', val: stats.inbox, sub: 'Needs Attention', icon: Inbox, color: 'text-slate-900' },
          { label: 'Avg Resolution', val: '2.4h', sub: 'Last 24 Hours', icon: Timer, color: 'text-green-600' },
          { label: 'Priority Avg', val: stats.avgPriority, sub: 'System Wide', icon: Target, color: 'text-indiapost-red' },
          { label: 'Success Rate', val: `${stats.resolvedRate}%`, sub: 'Citizen Satisfaction', icon: TrendingUp, color: 'text-blue-600' }
        ].map((kpi, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all">
            <kpi.icon size={20} className={`${kpi.color} mb-6`} />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</p>
            <p className="text-4xl font-black mt-2 text-slate-900 dark:text-white">{kpi.val}</p>
            <p className="text-[9px] font-bold text-slate-300 uppercase mt-2 tracking-widest">{kpi.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm">
           <div className="flex justify-between items-center mb-10">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-3">
                <Globe size={18} className="text-blue-500" /> Regional Stress Points
              </h3>
              <button className="text-[10px] font-black uppercase text-blue-500">Live Map</button>
           </div>
           <div className="space-y-8">
              {['Mumbai NSH', 'Delhi Air Hub', 'Kolkata Central', 'Chennai GPO'].map((loc, i) => (
                <div key={i} className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black uppercase tracking-tight text-slate-700 dark:text-slate-200">{loc}</span>
                    <span className="text-[10px] font-bold text-slate-400">{Math.floor(Math.random() * 100)} Active</span>
                  </div>
                  <div className="h-2 bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indiapost-red transition-all duration-1000" style={{ width: `${Math.random() * 70 + 30}%` }} />
                  </div>
                </div>
              ))}
           </div>
        </div>
        
        <div className="bg-slate-900 text-white p-10 rounded-[3rem] border border-slate-800 shadow-xl relative overflow-hidden">
           <Activity className="absolute -right-8 -bottom-8 opacity-5" size={240} />
           <div className="relative z-10">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-10 flex items-center gap-3">
                <Zap size={18} className="text-indiapost-red" /> Live Grievance Feed
              </h3>
              <div className="space-y-6">
                {complaints.slice(0, 4).map((c, i) => (
                  <div key={i} className="flex items-center gap-6 p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all cursor-pointer border border-white/5">
                    <div className="w-10 h-10 rounded-full bg-indiapost-red/20 text-indiapost-red flex items-center justify-center font-black">
                      {c.userName.charAt(0)}
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="text-xs font-black uppercase truncate tracking-tight">#{c.id} — {c.userName}</p>
                      <p className="text-[10px] text-slate-400 truncate mt-1">{c.description}</p>
                    </div>
                    <ChevronRight size={16} className="text-slate-700" />
                  </div>
                ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen -m-8 bg-[#F8FAFC] dark:bg-black overflow-hidden font-sans">
      
      {/* 1. PRIMARY SIDEBAR */}
      <aside className="w-20 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col items-center py-10 shrink-0 shadow-sm">
        <div className="w-12 h-12 bg-indiapost-red rounded-2xl flex items-center justify-center text-white mb-12 shadow-xl shadow-red-500/20">
          <Mail size={24} />
        </div>
        <nav className="flex-grow space-y-8">
          {[
            { id: 'dashboard', icon: LayoutGrid, label: 'Analytics' },
            { id: 'inbox', icon: Inbox, label: 'Tickets' },
            { id: 'unassigned', icon: Filter, label: 'Triage' },
            { id: 'all', icon: BarChart, label: 'Records' }
          ].map(item => (
            <div key={item.id} className="relative group flex flex-col items-center">
              <button 
                onClick={() => setCurrentView(item.id as ViewFilter)}
                className={`p-3.5 rounded-2xl transition-all ${currentView === item.id ? 'bg-slate-900 text-white dark:bg-white dark:text-black scale-110 shadow-lg' : 'text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900'}`}
              >
                <item.icon size={22} />
              </button>
              <span className="absolute left-20 bg-slate-900 text-white text-[9px] font-black uppercase py-1 px-3 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-[100] tracking-widest">{item.label}</span>
            </div>
          ))}
        </nav>
        <button className="p-3 text-slate-300 hover:text-slate-600 transition-colors"><Settings size={22} /></button>
      </aside>

      {currentView === 'dashboard' ? (
        <main className="flex-grow overflow-y-auto custom-scrollbar">
          <DashboardView />
        </main>
      ) : (
        <>
          {/* 2. THREAD LIST */}
          <aside className="w-[360px] bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0">
            <div className="p-8 border-b border-slate-100 dark:border-slate-900 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">{currentView} List</h2>
                <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-[10px] font-black">{filtered.length}</span>
              </div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <input 
                  type="text" placeholder="Filter grievances..." 
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-xs outline-none focus:ring-1 focus:ring-indiapost-red transition-all font-medium"
                  value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex-grow overflow-y-auto custom-scrollbar space-y-1 p-4">
               {filtered.map(ticket => (
                 <div 
                   key={ticket.id}
                   onClick={() => setSelectedId(ticket.id)}
                   className={`p-6 rounded-[2rem] cursor-pointer transition-all duration-300 ${selectedId === ticket.id ? 'bg-[#F0F7FF] dark:bg-slate-900 shadow-md ring-1 ring-blue-100 dark:ring-blue-900' : 'hover:bg-slate-50 dark:hover:bg-slate-900'}`}
                 >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-black uppercase tracking-tight truncate max-w-[180px] text-slate-900 dark:text-white">{ticket.userName}</span>
                      <div className={`w-2.5 h-2.5 rounded-full ${ticket.analysis?.priorityScore > 75 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-slate-200'}`} />
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed font-medium">{ticket.description}</p>
                    <div className="flex justify-between items-center mt-5">
                      <span className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.2em]">#{ticket.id}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">{new Date(ticket.lastActivityAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                    </div>
                 </div>
               ))}
            </div>
          </aside>

          {/* 3. WORKSPACE */}
          <main className="flex-grow flex flex-col min-w-0 bg-white dark:bg-black">
            {selectedTicket ? (
              <>
                <header className="px-10 py-8 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white/80 dark:bg-black/80 backdrop-blur-md sticky top-0 z-10">
                   <div className="flex items-center gap-6">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-slate-500 uppercase">
                        {selectedTicket.userName.charAt(0)}
                      </div>
                      <div>
                        <h2 className="text-sm font-black uppercase text-slate-900 dark:text-white flex items-center gap-3">
                          {selectedTicket.userName} <span className="text-slate-300">/</span> <span className="text-indiapost-red">#{selectedTicket.id}</span>
                        </h2>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-800">{selectedTicket.analysis?.category}</span>
                          <span className="text-[9px] font-bold text-green-500 uppercase flex items-center gap-1"><Shield size={10} /> Verified Identity</span>
                        </div>
                      </div>
                   </div>
                   <div className="flex items-center gap-4">
                      <button className="p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all"><History size={20} /></button>
                      <button onClick={() => handleAction(ComplaintStatus.CLOSED, "Grievance marked as resolved by officer.")} className="px-6 py-3 bg-black dark:bg-white dark:text-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                        <CheckCircle size={16} /> Resolve Case
                      </button>
                   </div>
                </header>

                <div className="flex-grow overflow-y-auto custom-scrollbar bg-[#FDFDFD] dark:bg-slate-950/20 px-10 py-12">
                   <div className="max-w-4xl mx-auto space-y-12">
                      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden group">
                         <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Cpu size={120} />
                         </div>
                         <div className="flex items-center gap-3 text-indiapost-red mb-6">
                            <Sparkles size={18} />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em]">AI Architect Briefing</span>
                         </div>
                         <h3 className="text-2xl font-black italic tracking-tight text-slate-900 dark:text-white leading-tight mb-8">"{selectedTicket.analysis?.summary}"</h3>
                         
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-10 border-t border-slate-100 dark:border-slate-800 pt-8">
                            <div className="space-y-4">
                               <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Target size={14} /> Criticality</h4>
                               <div className="flex items-center gap-3">
                                  <div className="flex-grow h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                     <div className={`h-full ${selectedTicket.analysis?.priorityScore > 75 ? 'bg-red-500' : 'bg-indiapost-red'} transition-all duration-1000`} style={{ width: `${selectedTicket.analysis?.priorityScore}%` }} />
                                  </div>
                                  <span className="text-xs font-black">{selectedTicket.analysis?.priorityScore}%</span>
                               </div>
                            </div>
                            <div className="space-y-4">
                               <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Activity size={14} /> Sentiment</h4>
                               <p className={`text-xs font-black uppercase ${selectedTicket.analysis?.sentiment === 'Angry' ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>{selectedTicket.analysis?.sentiment}</p>
                            </div>
                            <div className="space-y-4">
                               <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Shield size={14} /> Risk Audit</h4>
                               <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase">{selectedTicket.analysis?.intelligenceBriefing?.riskAssessment || 'Low'} Risk Level</p>
                            </div>
                         </div>
                      </div>

                      <div className="space-y-12">
                         <div className="flex gap-8 group">
                            <div className="w-14 h-14 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shrink-0 flex items-center justify-center font-black uppercase text-slate-400 shadow-sm transition-transform group-hover:scale-105">
                              {selectedTicket.userName.charAt(0)}
                            </div>
                            <div className="space-y-6 flex-grow">
                               <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 text-sm leading-relaxed text-slate-700 dark:text-slate-200 font-medium">
                                  {selectedTicket.description}
                               </div>
                               {selectedTicket.imageUrl && (
                                 <div className="relative group/img inline-block overflow-hidden rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800">
                                    <img src={selectedTicket.imageUrl} className="max-w-md transition-transform duration-700 group-hover/img:scale-105" alt="evidence" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                       <button className="bg-white text-black px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">Analyze Attachment</button>
                                    </div>
                                 </div>
                               )}
                            </div>
                         </div>

                         {selectedTicket.updates.map((u, i) => (
                            <div key={i} className={`flex gap-8 ${u.isInternal ? 'pl-20' : ''}`}>
                               {!u.isInternal && (
                                 <div className="w-14 h-14 bg-slate-900 rounded-2xl shrink-0 flex items-center justify-center font-black uppercase text-white shadow-xl shadow-slate-900/10">
                                   {u.author.charAt(0)}
                                 </div>
                               )}
                               <div className={`p-8 rounded-[2.5rem] border flex-grow shadow-sm ${u.isInternal ? 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/40 text-amber-900 dark:text-amber-200' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'}`}>
                                  <div className="flex justify-between items-center mb-4">
                                     <div className="flex items-center gap-3">
                                        {u.isInternal && <AlertTriangle size={14} className="text-amber-600" />}
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">{u.isInternal ? 'Department Internal Note' : u.author}</span>
                                     </div>
                                     <span className="text-[10px] font-bold opacity-30">{new Date(u.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                  </div>
                                  <p className="text-[15px] font-medium leading-relaxed">{u.message}</p>
                               </div>
                            </div>
                         ))}
                      </div>
                   </div>
                </div>

                <footer className="p-10 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shrink-0">
                   <div className="max-w-4xl mx-auto">
                      <div className="flex gap-8 mb-6">
                         <button className="text-[10px] font-black uppercase tracking-[0.3em] text-indiapost-red border-b-2 border-indiapost-red pb-2">Public Channel</button>
                         <button className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-slate-600 pb-2">Internal Notes</button>
                      </div>
                      <div className="relative bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-inner focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-900 transition-all overflow-hidden">
                        <textarea 
                          className="w-full p-10 bg-transparent outline-none min-h-[160px] text-base font-medium resize-none placeholder:text-slate-300"
                          placeholder="Type your response to the citizen..."
                          value={replyText} onChange={(e) => setReplyText(e.target.value)}
                        />
                        <div className="flex justify-between items-center p-6 border-t border-slate-100 dark:border-slate-800">
                           <div className="flex gap-6 text-slate-300">
                              <button className="hover:text-slate-900 transition-colors"><ImageIcon size={20} /></button>
                              <button className="hover:text-slate-900 transition-colors"><MessageCircle size={20} /></button>
                              <button className="hover:text-slate-900 transition-colors"><Hash size={20} /></button>
                           </div>
                           <div className="flex gap-3">
                              <button onClick={handlePolish} disabled={isPolishing} className="px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-indiapost-red transition-all flex items-center gap-3">
                                 {isPolishing ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />} AI Polish
                              </button>
                              <button onClick={() => handleAction(ComplaintStatus.ACKNOWLEDGED, replyText)} className="px-10 py-3 bg-indiapost-red text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-800 shadow-2xl shadow-red-500/30 transition-all flex items-center gap-3 active:scale-95">
                                 <Send size={16} /> Dispatch Response
                              </button>
                           </div>
                        </div>
                      </div>
                   </div>
                </footer>
              </>
            ) : (
              <div className="flex-grow flex flex-col items-center justify-center p-20 text-center space-y-8">
                 <div className="w-24 h-24 bg-slate-50 dark:bg-slate-900 rounded-[2rem] flex items-center justify-center text-slate-200">
                    <Mail size={48} />
                 </div>
                 <div className="space-y-2">
                    <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">Command Center</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Select an active grievance to initiate response protocol</p>
                 </div>
              </div>
            )}
          </main>

          {/* 4. STRATEGIC CONTEXT */}
          <aside className="w-[380px] bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 flex flex-col shrink-0 overflow-y-auto custom-scrollbar p-10 space-y-12 shadow-sm">
            {selectedTicket ? (
              <>
                 <section className="space-y-8">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em]">Citizen Intelligence</h4>
                    <div className="flex items-center gap-6">
                       <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-[1.5rem] flex items-center justify-center text-2xl font-black text-slate-400 uppercase border border-slate-50 dark:border-slate-800">
                         {selectedTicket.userName.charAt(0)}
                       </div>
                       <div>
                          <h3 className="text-base font-black text-slate-900 dark:text-white uppercase leading-none">{selectedTicket.userName}</h3>
                          <p className="text-[10px] font-bold text-slate-400 mt-2 flex items-center gap-2">
                             <UserCheck size={12} className="text-green-500" /> Identity Verified
                          </p>
                       </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="p-5 bg-[#F8FAFC] dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Category</p>
                          <p className="text-[11px] font-black text-indiapost-red uppercase">{selectedTicket.analysis?.category}</p>
                       </div>
                       <div className="p-5 bg-[#F8FAFC] dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Office</p>
                          <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase truncate">{selectedTicket.postOffice}</p>
                       </div>
                    </div>
                 </section>

                 <section className="space-y-8">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em]">Investigation Protocol</h4>
                    <div className="space-y-4">
                       {selectedTicket.analysis?.intelligenceBriefing?.investigationStrategy?.map((step, i) => (
                         <div key={i} className="flex gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-2xl transition-all cursor-pointer border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
                            <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center shrink-0">
                               <CheckCircle size={14} />
                            </div>
                            <p className="text-[13px] font-medium text-slate-600 dark:text-slate-300 leading-tight pt-0.5">{step}</p>
                         </div>
                       ))}
                    </div>
                 </section>

                 <section className="bg-slate-900 text-white p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                    <Target className="absolute -bottom-6 -right-6 text-white/5 group-hover:scale-110 transition-transform duration-700" size={140} />
                    <div className="relative z-10 space-y-8">
                       <h4 className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-between">
                          System Priority <Sparkles size={14} className="text-indiapost-red" />
                       </h4>
                       <div className="text-5xl font-black text-white tracking-tighter">
                          {selectedTicket.analysis?.priorityScore}%
                       </div>
                       <div className="space-y-2">
                          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                             <div className="h-full bg-indiapost-red shadow-[0_0_15px_rgba(209,33,40,0.5)] transition-all duration-1000" style={{ width: `${selectedTicket.analysis?.priorityScore}%` }} />
                          </div>
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Calculated Urgency Level</p>
                       </div>
                    </div>
                 </section>

                 <section className="p-8 bg-blue-50/50 dark:bg-blue-900/10 rounded-[2.5rem] border border-blue-100 dark:border-blue-900/40">
                    <h4 className="text-[10px] font-black uppercase text-blue-600 tracking-widest mb-4 flex items-center gap-3">
                       <Info size={14} /> Logistics Audit
                    </h4>
                    <p className="text-xs font-bold text-blue-800 dark:text-blue-300 leading-relaxed italic">
                       {selectedTicket.analysis?.intelligenceBriefing?.logisticsAudit || "Autonomous review suggests hub transit delay. Direct node check required."}
                    </p>
                 </section>

                 <div className="pt-10 text-center opacity-10">
                    <p className="text-[8px] font-black uppercase tracking-[0.5em]">Neural Grid Node India Post v4.0</p>
                 </div>
              </>
            ) : (
              <div className="p-20 text-center opacity-10 flex flex-col items-center gap-6">
                 <Shield size={64} />
                 <p className="text-xs font-black uppercase tracking-widest">Locked Area</p>
              </div>
            )}
          </aside>
        </>
      )}
    </div>
  );
};

export default AdminTickets;
