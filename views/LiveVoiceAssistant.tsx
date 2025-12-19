// @ts-nocheck
import React, { useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";

const encode = (bytes: Uint8Array) => {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

export default function LiveVoiceAssistant({ onClose }) {
  const [active, setActive] = useState(false);
  const audioCtx = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const start = async () => {
    audioCtx.current = new AudioContext({ sampleRate: 16000 });
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;

    const source = audioCtx.current.createMediaStreamSource(stream);
    const processor = audioCtx.current.createScriptProcessor(4096, 1, 1);

    processor.onaudioprocess = async (e) => {
      if (!active) return;

      const input = e.inputBuffer.getChannelData(0);
      const int16 = new Int16Array(input.length);
      for (let i = 0; i < input.length; i++) {
        int16[i] = input[i] * 32768;
      }

      const res = await fetch("/api/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audio: encode(new Uint8Array(int16.buffer)),
        }),
      });

      const data = await res.json();

      if (data.audioChunks?.length) {
        const outCtx = new AudioContext({ sampleRate: 24000 });

        for (const chunk of data.audioChunks) {
          const bytes = Uint8Array.from(atob(chunk), c => c.charCodeAt(0));
          const buffer = outCtx.createBuffer(1, bytes.length / 2, 24000);
          const channel = buffer.getChannelData(0);
          const view = new Int16Array(bytes.buffer);

          for (let i = 0; i < view.length; i++) {
            channel[i] = view[i] / 32768;
          }

          const src = outCtx.createBufferSource();
          src.buffer = buffer;
          src.connect(outCtx.destination);
          src.start();
        }
      }
    };

    source.connect(processor);
    processor.connect(audioCtx.current.destination);
    setActive(true);
  };

  const stop = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    audioCtx.current?.close();
    setActive(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
      <button
        onClick={active ? stop : start}
        className="bg-red-600 text-white p-6 rounded-full"
      >
        {active ? <MicOff /> : <Mic />}
      </button>
    </div>
  );
}
