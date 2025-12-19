
import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { 
  LogOut, Sun, Moon, Search, UserCircle, Bell, Mic, Mail
} from 'lucide-react';

import { User, Complaint, Notification, ComplaintStatus } from './types';
import Login from './views/Login';
import Dashboard from './views/Dashboard';
import SubmitComplaint from './views/SubmitComplaint';
import TrackStatus from './views/TrackStatus';
import ComplaintMenu from './views/ComplaintMenu';
import AdminTickets from './views/AdminTickets';
import ChatAssistant from './views/ChatAssistant';
import LiveVoiceAssistant from './views/LiveVoiceAssistant';

// --- ROBUST BRAND ASSETS (SVG) ---

export const IndiaPostLogo = ({ className = "h-12" }: { className?: string }) => (
  <svg viewBox="0 0 300 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 20L80 50L20 80V20Z" fill="#d12128" />
    <path d="M40 20L100 50L40 80V20Z" fill="#d12128" opacity="0.6" />
    <text x="115" y="65" fill="currentColor" className="font-serif italic font-black text-4xl">India Post</text>
  </svg>
);

export const StateEmblem = ({ className = "h-16" }: { className?: string }) => (
  <svg viewBox="0 0 100 120" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 10C55 10 60 15 60 25C60 35 55 40 50 40C45 40 40 35 40 25C40 15 45 10 50 10Z" />
    <path d="M30 45H70L65 75C65 85 55 90 50 90C45 90 35 85 35 75L30 45Z" />
    <rect x="20" y="95" width="60" height="5" rx="2" />
    <text x="50" y="115" textAnchor="middle" fontSize="10" fontWeight="900">सत्यमेव जयते</text>
  </svg>
);

// --- TRANSLATIONS ---

const translations = {
  en: {
    brand_name: "India Post",
    nav_home: "Home",
    nav_submit: "Register Complaint",
    nav_track: "Track Complaint",
    nav_records: "My Complaints",
    nav_queue: "Task Queue",
    nav_insights: "Statistics",
    helpline: "Customer Care",
    citizen_portal: "CITIZEN SECTION",
    admin_portal: "STAFF LOGIN",
    login_title: "India Post Help Portal",
    login_subtitle: "AI-Based Complaint Analysis & Automated Response System",
    login_staff: "Department Staff",
    login_citizen: "Citizen Login",
    login_verify: "OTP Verification",
    login_officer: "Officer Login",
    login_phone: "Mobile Number",
    login_otp: "OTP Code",
    login_name: "Full Name",
    login_email: "Email ID",
    login_btn_send: "Get OTP",
    login_btn_verify: "Submit",
    login_btn_account: "Create Profile",
    login_back: "Back",
    welcome: "Welcome",
    smart_redressal: "Grievance Redressal System",
    active_cases: "Pending Requests",
    reg: "File a Complaint",
    reg_sub: "Late delivery, missing items, or counter issues.",
    track: "Track Status",
    track_sub: "Check the current status of your request.",
    hub: "My History",
    hub_sub: "View your previous complaints and their answers.",
    resources: "Helpful Links",
    resources_sub: "Important India Post services at your fingertips.",
    speed: "Express Mail",
    find: "Branch Finder",
    proceed: "Click to proceed",
    open: "Check Now",
    view: "Open List",
    submit_title: "New Complaint",
    submit_desc: "Describe the Problem",
    submit_branch: "Post Office Branch",
    submit_date: "Date of Incident",
    submit_evidence: "Photo / Receipt (Optional)",
    submit_btn: "Submit Complaint",
    submit_placeholder_desc: "Please explain your problem in simple words. If you have a tracking number, please mention it here.",
    submit_placeholder_branch: "Post office name or Pincode",
    submit_triage: "Processing your request...",
    submit_confirmed: "Complaint submitted successfully!",
    track_title: "Track Your Request",
    track_placeholder: "Enter Ref Number (e.g. PGC-12345)",
    track_search: "Search",
    track_ref: "REF NUMBER",
    track_timeline_reported: "Reported",
    track_timeline_processing: "In Review",
    track_timeline_resolved: "Resolved",
    track_timeline_closed: "Closed",
    track_logs: "History of Action",
    records_title: "Your Complaints",
    records_empty: "No records found",
    records_empty_sub: "You have not filed any complaints yet.",
    records_total: "Total Records",
    records_locate: "Track",
    footer_text: "India Post - Grievance Redressal Portal",
    footer_subtext: "Official website for handling citizen issues. Ministry of Communications, Government of India.",
    privacy: "Privacy Policy",
    terms: "Terms of Use",
    charter: "Citizen Charter",
    branch_dir: "Directory"
  },
  hi: {
    brand_name: "भारतीय डाक",
    nav_home: "मुख्य पृष्ठ",
    nav_submit: "शिकायत दर्ज करें",
    nav_track: "स्थिति जानें",
    nav_records: "मेरी शिकायतें",
    nav_queue: "कार्य सूची",
    nav_insights: "आंकड़े",
    helpline: "कस्टमर केयर",
    citizen_portal: "नागरिक अनुभाग",
    admin_portal: "कर्मचारी लॉगिन",
    login_title: "भारतीय डाक हेल्प पोर्टल",
    login_subtitle: "एआई-आधारित शिकायत विश्लेषण और स्वचालित प्रतिक्रिया प्रणाली",
    login_staff: "विभाग कर्मचारी",
    login_citizen: "नागरिक लॉगिन",
    login_verify: "ओटीपी सत्यापन",
    login_officer: "अधिकारी लॉगिन",
    login_phone: "मोबाइल नंबर",
    login_otp: "ओटीपी कोड",
    login_name: "पूरा नाम",
    login_email: "ईमेल आईडी",
    login_btn_send: "ओटीपी प्राप्त करें",
    login_btn_verify: "जमा करें",
    login_btn_account: "प्रोफ़ाइल बनाएं",
    login_back: "पीछे",
    welcome: "स्वागत है",
    smart_redressal: "शिकायत निवारण प्रणाली",
    active_cases: "लंबित अनुरोध",
    reg: "शिकायत दर्ज करें",
    reg_sub: "देरी से वितरण, खोया सामान, या काउंटर समस्या।",
    track: "स्थिति जांचें",
    track_sub: "अपने अनुरोध की वर्तमान स्थिति देखें।",
    hub: "मेरा इतिहास",
    hub_sub: "अपनी पिछली शिकायतों और उनके उत्तर देखें।",
    resources: "सहायक लिंक",
    resources_sub: "भारतीय डाक की महत्वपूर्ण सेवाएं आपके हाथ में।",
    speed: "एक्सप्रेस मेल",
    find: "शाखा खोजें",
    proceed: "आगे बढ़ें",
    open: "अभी जांचें",
    view: "सूची खोलें",
    submit_title: "नई शिकायत",
    submit_desc: "समस्या का विवरण",
    submit_branch: "डाकघर शाखा",
    submit_date: "घटना की तारीख",
    submit_evidence: "फोटो / रसीद (वैकल्फिक)",
    submit_btn: "शिकायत जमा करें",
    submit_placeholder_desc: "कृपया अपनी समस्या सरल शब्दों में बताएं। ट्रैकिंग नंबर यहाँ लिखें।",
    submit_placeholder_branch: "डाकघर का नाम या पिनकोड",
    submit_triage: "अनुरोध प्रोसेस हो रहा है...",
    submit_confirmed: "शिकायत सफलतापूर्वक दर्ज की गई!",
    track_title: "अपना अनुरोध ट्रैक करें",
    track_placeholder: "रेफरेंस नंबर लिखें (जैसे PGC-12345)",
    track_search: "खोजें",
    track_ref: "रेफरेंस नंबर",
    track_timeline_reported: "दर्ज की गई",
    track_timeline_processing: "समीक्षा में",
    track_timeline_resolved: "सुलझ गई",
    track_timeline_closed: "बंद",
    track_logs: "कार्रवाई का इतिहास",
    records_title: "आपकी शिकायतें",
    records_empty: "कोई रिकॉर्ड नहीं मिला",
    records_empty_sub: "आपने अभी तक कोई शिकायत दर्ज नहीं की है।",
    records_total: "कुल रिकॉर्ड",
    records_locate: "ट्रैक",
    footer_text: "भारतीय डाक - शिकायत निवारण पोर्टल",
    footer_subtext: "नागरिकों की समस्याओं के समाधान के लिए आधिकारिक वेबसाइट। संचार मंत्रालय, भारत सरकार।",
    privacy: "गोपनीयता नीति",
    terms: "उपयोग की शर्तें",
    charter: "नागरिक चार्टर",
    branch_dir: "निर्देशिका"
  }
};

type Language = 'en' | 'hi';
export const LangContext = createContext<{ lang: Language, setLang: (l: Language) => void, t: any }>({
  lang: 'en',
  setLang: () => {},
  t: translations.en
});

const OfficialHeader = ({ 
  user, 
  onLogout, 
  isDark, 
  toggleTheme,
  notifications,
  markAllRead,
  onOpenLive
}: { 
  user: User | null, 
  onLogout: () => void, 
  isDark: boolean, 
  toggleTheme: () => void,
  notifications: Notification[],
  markAllRead: () => void,
  onOpenLive: () => void
}) => {
  const { lang, setLang, t } = useContext(LangContext);
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <header className="w-full flex flex-col bg-white dark:bg-black transition-colors border-b border-slate-200 dark:border-slate-800 relative z-[100]">
      <div className="bg-slate-50 dark:bg-slate-900 py-1.5 px-4 md:px-12 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-[10px] md:text-xs">
          <div className="flex items-center gap-3 font-bold text-slate-700 dark:text-slate-300">
             <span>भारत सरकार</span>
             <span className="text-slate-300">|</span>
             <span>GOVERNMENT OF INDIA</span>
          </div>
          <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400">
            <button onClick={onOpenLive} className="flex items-center gap-1.5 hover:text-indiapost-red font-black uppercase tracking-tighter">
              <Mic size={12} /> Live Voice
            </button>
            <div className="h-3 w-px bg-slate-200 dark:bg-slate-800"></div>
            <button onClick={() => setLang(lang === 'en' ? 'hi' : 'en')} className="hover:text-indiapost-red font-bold transition-colors">
               {lang === 'en' ? 'हिन्दी' : 'English'}
            </button>
            <div className="h-3 w-px bg-slate-200 dark:bg-slate-800"></div>
            <button onClick={toggleTheme} className="hover:text-indiapost-red transition-colors">
               {isDark ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            <div className="h-3 w-px bg-slate-200 dark:bg-slate-800"></div>
            <div className="relative">
               <button onClick={() => setShowNotifications(!showNotifications)} className="hover:text-indiapost-red transition-colors relative">
                 <Bell size={14} />
                 {unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-indiapost-red text-white text-[7px] w-3 h-3 rounded-full flex items-center justify-center font-bold animate-pulse">{unreadCount}</span>}
               </button>
               {showNotifications && (
                 <div className="absolute right-0 mt-4 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 animate-in fade-in slide-in-from-top-2">
                   <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                     <p className="text-[10px] font-black uppercase tracking-widest text-indiapost-red">Notifications</p>
                     <button onClick={markAllRead} className="text-[8px] font-bold text-slate-400 uppercase hover:text-indiapost-red">Clear All</button>
                   </div>
                   <div className="max-h-64 overflow-y-auto space-y-3 custom-scrollbar">
                     {notifications.length === 0 ? (
                       <p className="text-center py-6 text-[10px] text-slate-400 font-bold uppercase">No New Alerts</p>
                     ) : notifications.map(n => (
                       <div key={n.id} className={`p-3 rounded-xl border-l-4 ${n.isRead ? 'border-transparent bg-slate-50 dark:bg-slate-800' : 'border-indiapost-red bg-red-50 dark:bg-red-900/10'}`}>
                         <p className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase">{n.title}</p>
                         <p className="text-[9px] text-slate-500 font-medium leading-tight mt-1">{n.message}</p>
                       </div>
                     ))}
                   </div>
                 </div>
               )}
            </div>
            <div className="h-3 w-px bg-slate-200 dark:bg-slate-800"></div>
            <Link to="/login" className="hover:text-indiapost-red flex items-center gap-1 font-bold transition-colors">
               <UserCircle size={14} /> <span>{user ? user.name : 'Login'}</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="py-8 px-4 md:px-12">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6 shrink-0">
            <StateEmblem className="h-16 text-slate-900 dark:text-slate-100" />
            <div className="h-16 w-px bg-slate-200 dark:border-slate-800 hidden md:block"></div>
            <div className="flex flex-col">
              <IndiaPostLogo className="h-10 text-slate-900 dark:text-white" />
              <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">MINISTRY OF COMMUNICATIONS • GOVT OF INDIA</p>
            </div>
          </div>
          <div className="flex-grow max-w-lg w-full">
            <div className="relative group">
              <input 
                type="text" 
                placeholder="Search Consignment or Article..." 
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-3.5 px-6 outline-none focus:border-indiapost-red transition-all font-medium text-slate-600 dark:text-slate-300 rounded-2xl"
              />
              <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indiapost-red transition-colors" size={20} />
            </div>
          </div>
        </div>
      </div>

      <nav className="bg-white/80 dark:bg-black/80 backdrop-blur-md border-t border-slate-100 dark:border-slate-900">
        <div className="max-w-7xl mx-auto px-4 md:px-12 flex flex-col md:flex-row items-center justify-between">
          <ul className="flex flex-wrap gap-1 text-[11px] font-black uppercase tracking-tight w-full md:w-auto">
            {user?.role === 'user' ? (
              <>
                <li><Link to="/" className="block py-4 px-5 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors border-b-2 border-transparent hover:border-indiapost-red">{t.nav_home}</Link></li>
                <li><Link to="/submit" className="block py-4 px-5 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors border-b-2 border-transparent hover:border-indiapost-red">{t.nav_submit}</Link></li>
                <li><Link to="/track" className="block py-4 px-5 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors border-b-2 border-transparent hover:border-indiapost-red">{t.nav_track}</Link></li>
                <li><Link to="/menu" className="block py-4 px-5 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors border-b-2 border-transparent hover:border-indiapost-red">{t.nav_records}</Link></li>
              </>
            ) : user ? (
              <>
                <li><Link to="/" className="block py-4 px-5 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors border-b-2 border-transparent hover:border-indiapost-red">Command Center</Link></li>
              </>
            ) : (
              <li><Link to="/login" className="block py-4 px-5 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors border-b-2 border-transparent hover:border-indiapost-red">CITIZEN PORTAL</Link></li>
            )}
          </ul>
          {user && (
            <div className="flex items-center gap-4 py-4 md:py-0 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 pl-4">
              <div className="text-right">
                <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase leading-tight">{user.name}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase">{user.role}</p>
              </div>
              <button onClick={onLogout} className="text-slate-400 hover:text-indiapost-red p-2 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl transition-all">
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [lang, setLang] = useState<Language>('en');
  const [isLiveOpen, setIsLiveOpen] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedComplaints = localStorage.getItem('complaints');
    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedComplaints) setComplaints(JSON.parse(savedComplaints));
  }, []);

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const handleUpdateComplaints = (updated: Complaint[]) => {
    setComplaints(updated);
    localStorage.setItem('complaints', JSON.stringify(updated));
  };

  const handleUpdateFeedback = (id: string, rating: number, comment: string) => {
    const updated = complaints.map(c => c.id === id ? { ...c, feedback: { rating, comment, timestamp: new Date().toISOString() } } : c);
    handleUpdateComplaints(updated);
  };

  const addComplaint = (newComplaint: Complaint) => {
    const updated = [newComplaint, ...complaints];
    handleUpdateComplaints(updated);
  };

  const markNotificationsRead = () => {
    const updated = notifications.map(n => ({ ...n, isRead: true }));
    setNotifications(updated);
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const t = translations[lang];

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      <Router>
        <div className="min-h-screen flex flex-col bg-white dark:bg-black transition-colors">
          <OfficialHeader 
            user={user} onLogout={handleLogout} isDark={isDarkMode} toggleTheme={toggleTheme} 
            notifications={notifications} markAllRead={markNotificationsRead} onOpenLive={() => setIsLiveOpen(true)}
          />

          <main className="flex-grow max-w-7xl mx-auto w-full py-12 px-4">
            <Routes>
              <Route path="/login" element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} />
              <Route path="/" element={user ? (user.role === 'user' ? <Dashboard user={user} complaints={complaints} /> : <AdminTickets complaints={complaints} user={user} onUpdate={handleUpdateComplaints} />) : <Navigate to="/login" />} />
              <Route path="/submit" element={user?.role === 'user' ? <SubmitComplaint user={user} onSubmit={addComplaint} existingComplaints={complaints} /> : <Navigate to="/login" />} />
              <Route path="/track" element={user?.role === 'user' ? <TrackStatus complaints={complaints} /> : <Navigate to="/login" />} />
              <Route path="/menu" element={user?.role === 'user' ? <ComplaintMenu complaints={complaints} onUpdateFeedback={handleUpdateFeedback} /> : <Navigate to="/login" />} />
            </Routes>
          </main>

          {user?.role === 'user' && <ChatAssistant complaints={complaints} />}
          {isLiveOpen && <LiveVoiceAssistant onClose={() => setIsLiveOpen(false)} />}
        </div>
      </Router>
    </LangContext.Provider>
  );
};

export default App;
