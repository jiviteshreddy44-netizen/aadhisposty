
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, Loader2, Mic, MicOff, Volume2, ExternalLink, Waves } from 'lucide-react';
import { getQuickSupport, generateSpeech, decodeAudio, decodeAudioData } from '../services/geminiService';
import { Complaint, GroundingLink } from '../types';

interface Message {
  role: 'user' | 'bot';
  text: string;
  links?: GroundingLink[];
}

interface ChatProps {
  complaints?: Complaint[];
}

const ChatAssistant: React.FC<ChatProps> = ({ complaints = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', text: 'Namaste! I am Dak-Mitra. I can help you with general queries or status updates on your existing complaints.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, [messages]);

  const speakResponse = async (text: string) => {
    const audioBase64 = await generateSpeech(text);
    if (audioBase64) {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const ctx = audioContextRef.current;
      const buffer = await decodeAudioData(decodeAudio(audioBase64), ctx, 24000, 1);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start();
    }
  };

  const handleSend = async (e?: React.FormEvent, textOverride?: string) => {
    if (e) e.preventDefault();
    const userText = textOverride || input;
    if (!userText.trim() || isLoading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsLoading(true);

    const userHistory = complaints.map(c => `ID: ${c.id}, Status: ${c.status}, Desc: ${c.description.slice(0, 50)}`).join('\n');

    try {
      const response = await getQuickSupport(userText, userHistory);
      const botMsg = response.text || "I'm sorry, I couldn't process that.";
      setMessages(prev => [...prev, { role: 'bot', text: botMsg, links: response.links }]);
      speakResponse(botMsg);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'bot', text: "Technical issue. Please try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const startVoice = () => {
    setVoiceError(null);
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setVoiceError("Speech API not supported.");
      return;
    }

    if (isListening || isConnecting) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(e) {}
      }
      setIsListening(false);
      setIsConnecting(false);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      timeoutRef.current = window.setTimeout(() => {
        if (isConnecting && !isListening) {
          setIsConnecting(false);
          setVoiceError("Microphone connection timed out.");
          try { recognition.stop(); } catch(e) {}
        }
      }, 5000);

      recognition.onstart = () => {
        if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
        setIsListening(true);
        setIsConnecting(false);
        setVoiceError(null);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) handleSend(undefined, transcript);
      };

      recognition.onerror = (e: any) => {
        if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
        setIsListening(false);
        setIsConnecting(false);
        setVoiceError(`Error: ${e.error}`);
      };

      recognition.onend = () => {
        if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
        setIsListening(false);
        setIsConnecting(false);
      };

      setIsConnecting(true);
      recognition.start();
    } catch (e: any) {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      setVoiceError("Voice init failed.");
      setIsConnecting(false);
      setIsListening(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      {isOpen ? (
        <div className="bg-slate-900 w-80 sm:w-96 h-[550px] rounded-[2.5rem] shadow-2xl flex flex-col border border-slate-800 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-red-600 p-5 text-white flex justify-between items-center border-b border-red-500 shadow-lg">
            <div className="flex items-center gap-3">
              <Bot size={20} />
              <div>
                <p className="font-black text-sm uppercase tracking-tighter">Dak-Mitra</p>
                <p className="text-[10px] font-bold text-red-100/70 uppercase tracking-widest">Enterprise Support</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-black/20 p-2 rounded-xl"><X size={20} /></button>
          </div>

          <div ref={scrollRef} className="flex-grow overflow-y-auto p-5 space-y-6 bg-slate-950 custom-scrollbar">
            {messages.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-3xl text-sm leading-relaxed ${
                  m.role === 'user' ? 'bg-red-600 text-white rounded-tr-none' : 'bg-slate-900 border border-slate-800 text-slate-300 rounded-tl-none'
                }`}>
                  {m.text}
                </div>
                {m.links && m.links.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {m.links.map((link, idx) => (
                      <a 
                        key={idx} 
                        href={link.uri} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-[10px] font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
                      >
                        <ExternalLink size={10} /> {link.title}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isLoading && <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-4">Consulting Knowledge Graph...</div>}
            {voiceError && <div className="text-[9px] font-bold text-red-500 uppercase tracking-widest ml-4">{voiceError}</div>}
          </div>

          <form onSubmit={handleSend} className="p-5 border-t border-slate-800 bg-slate-900 flex gap-3">
            <button 
              type="button" 
              onClick={startVoice} 
              className={`p-3 rounded-2xl transition-all ${isListening ? 'bg-red-600 text-white scale-110 shadow-lg shadow-red-500/20' : isConnecting ? 'bg-slate-800 text-white animate-pulse' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              {isListening ? <Waves className="animate-pulse" size={20} /> : isConnecting ? <Loader2 className="animate-spin" size={20} /> : <Mic size={20} />}
            </button>
            <input type="text" placeholder="Type your inquiry..." className="flex-grow px-5 py-3 bg-slate-850 border border-slate-700 rounded-2xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-600 transition-all font-medium" value={input} onChange={(e) => setInput(e.target.value)} />
            <button type="submit" className="bg-red-600 text-white p-3 rounded-2xl hover:bg-red-700 transition active:scale-90"><Send size={20} /></button>
          </form>
        </div>
      ) : (
        <button onClick={() => setIsOpen(true)} className="bg-red-600 text-white w-16 h-16 rounded-[1.5rem] shadow-2xl flex items-center justify-center hover:scale-110 transition-all group relative border-2 border-red-500">
          <Bot size={32} />
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full border-4 border-slate-950"></span>
        </button>
      )}
    </div>
  );
};

export default ChatAssistant;
