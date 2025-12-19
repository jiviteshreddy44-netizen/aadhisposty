
// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { Mic, MicOff, X, PhoneCall, Volume2, Loader2, Activity } from 'lucide-react';

const encode = (bytes: Uint8Array) => {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const decode = (base64: string) => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

// Fix: Implement manual audio decoding logic for raw PCM streams
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const LiveVoiceAssistant: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef(new Set<AudioBufferSourceNode>());
  const streamRef = useRef<MediaStream | null>(null);

  const stopSession = () => {
    if (sessionRef.current) {
      sessionRef.current.then((s: any) => {
        try { s.close(); } catch(e) {}
      });
    }
    
    streamRef.current?.getTracks().forEach(track => track.stop());
    audioContextRef.current?.close();
    outputAudioContextRef.current?.close();
    
    setIsActive(false);
    setIsConnecting(false);
    onClose();
  };

  const startSession = async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      // Fix: Use process.env.API_KEY directly when initializing the GoogleGenAI client instance
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const inCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = inCtx;
      outputAudioContextRef.current = outCtx;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setIsConnecting(false);
            
            const source = inCtx.createMediaStreamSource(stream);
            const scriptProcessor = inCtx.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                int16[i] = inputData[i] * 32768;
              }
              
              // CRITICAL: Solely rely on sessionPromise resolves and then call `session.sendRealtimeInput`
              sessionPromise.then(session => {
                session.sendRealtimeInput({
                  media: {
                    data: encode(new Uint8Array(int16.buffer)),
                    mimeType: 'audio/pcm;rate=16000'
                  }
                });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inCtx.destination);
          },
          onmessage: async (message) => {
            if (!message?.serverContent) return;
            
            const modelTurn = message.serverContent.modelTurn;
            if (modelTurn?.parts) {
              for (const part of modelTurn.parts) {
                if (part.inlineData?.data) {
                  const audioData = part.inlineData.data;
                  // Fix: Schedule audio chunks to start at the exact end of the previous chunk
                  nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outCtx.currentTime);
                  const buffer = await decodeAudioData(decode(audioData), outCtx, 24000, 1);
                  const source = outCtx.createBufferSource();
                  source.buffer = buffer;
                  source.connect(outCtx.destination);
                  source.start(nextStartTimeRef.current);
                  nextStartTimeRef.current += buffer.duration;
                  sourcesRef.current.add(source);
                  source.onended = () => sourcesRef.current.delete(source);
                }
              }
            }

            if (message.serverContent.interrupted) {
              sourcesRef.current.forEach(s => {
                try { s.stop(); } catch(e) {}
              });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onclose: () => stopSession(),
          onerror: (e) => {
            console.error("Native Audio Error:", e);
            setError("Connection disrupted. Please check your network.");
            setIsConnecting(false);
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          systemInstruction: 'You are Dak-Sarthi, the India Post AI voice interface. Speak with a professional yet helpful tone. Help users with grievances, tracking, and information. Keep responses concise for high latency stability.'
        }
      });

      sessionRef.current = sessionPromise;
    } catch (err) {
      setError("Failed to initialize session. Microphone permissions and HTTPS are required.");
      setIsConnecting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-3xl z-[300] flex items-center justify-center p-8">
      <div className="bg-white dark:bg-stone-950 w-full max-w-xl rounded-[4rem] p-16 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] text-center relative overflow-hidden border border-stone-200 dark:border-stone-800">
        <div className="absolute top-0 left-0 w-full h-2 bg-indiapost-red shadow-lg shadow-red-500/50"></div>
        <button onClick={stopSession} className="absolute top-10 right-10 p-4 bg-stone-100 dark:bg-stone-900 rounded-3xl text-stone-400 hover:text-indiapost-red transition-all active:scale-90">
          <X size={28} />
        </button>

        <div className="mb-12">
          <div className={`w-40 h-40 mx-auto rounded-[3rem] flex items-center justify-center mb-10 transition-all duration-700 ${isActive ? 'bg-indiapost-red text-white scale-110 shadow-[0_20px_50px_rgba(209,33,40,0.4)]' : 'bg-stone-100 dark:bg-stone-900 text-stone-300'}`}>
            {isActive ? (
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-1.5 bg-white rounded-full animate-[bounce_0.6s_infinite]" style={{ height: `${20 + Math.random() * 40}px`, animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
            ) : <PhoneCall size={64} className={isConnecting ? 'animate-pulse' : ''} />}
          </div>
          <h2 className="text-4xl font-black text-stone-900 dark:text-white uppercase tracking-tighter leading-none">Dak-Sarthi Live</h2>
          <p className="text-[11px] font-black text-indiapost-red uppercase tracking-[0.5em] mt-5">Multimodal Neural Connection</p>
        </div>

        <div className="space-y-8">
          {error && (
            <div className="p-6 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-3xl text-[10px] font-black uppercase text-red-500 tracking-widest leading-relaxed">
              {error}
            </div>
          )}

          <p className="text-base font-medium text-stone-500 leading-relaxed italic max-w-sm mx-auto">
            {isActive ? "Active Channel. Our AI Architect is processing your voice in real-time." : "Engage in a direct, low-latency audio conversation with our redressal specialist."}
          </p>

          {!isActive ? (
            <button 
              onClick={startSession} disabled={isConnecting}
              className="w-full bg-indiapost-red text-white py-8 rounded-[2rem] font-black uppercase text-sm tracking-[0.3em] shadow-2xl hover:bg-red-700 transition-all disabled:opacity-50 active:scale-[0.98] flex items-center justify-center gap-6"
            >
              {isConnecting ? <Loader2 className="animate-spin" size={24} /> : <Mic size={28} />}
              {isConnecting ? "Establishing Grid Connection..." : "Initiate Live Session"}
            </button>
          ) : (
            <button 
              onClick={stopSession}
              className="w-full bg-stone-900 text-white py-8 rounded-[2rem] font-black uppercase text-sm tracking-[0.3em] shadow-2xl hover:bg-stone-800 transition-all flex items-center justify-center gap-6 active:scale-[0.98]"
            >
              <MicOff size={28} /> Terminate Secure Channel
            </button>
          )}
          
          <div className="flex items-center justify-center gap-4 opacity-30 pt-4">
             <Activity size={14} className={isActive ? 'text-green-500 animate-pulse' : ''} />
             <span className="text-[9px] font-black uppercase tracking-widest">Grievance Node v2.5 Flash Native</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveVoiceAssistant;
