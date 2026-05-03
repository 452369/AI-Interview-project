import { useEffect, useRef, useState } from 'react';
import { VideoOff } from 'lucide-react';

export function CameraView() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    
    async function setupCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("无法访问摄像头");
      }
    }

    setupCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  if (error) {
    return (
      <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-500 flex-col gap-2">
        <VideoOff size={24} className="opacity-50" />
        <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">{error}</span>
      </div>
    );
  }

  return (
    <video 
      ref={videoRef} 
      autoPlay 
      playsInline 
      muted 
      className="w-full h-full object-cover transform -scale-x-100"
    />
  );
}
