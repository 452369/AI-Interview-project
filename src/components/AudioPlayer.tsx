import { useEffect, useRef } from 'react';

interface AudioPlayerProps {
  base64Audio: string | null;
  onEnded?: () => void;
}

export function AudioPlayer({ base64Audio, onEnded }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (base64Audio && audioRef.current) {
      const audioUrl = `data:audio/mpeg;base64,${base64Audio}`;
      audioRef.current.src = audioUrl;
      audioRef.current.load();
      audioRef.current.play().catch(e => console.error("Audio playback error:", e));
    }
  }, [base64Audio]);

  return (
    <audio
      ref={audioRef}
      onEnded={onEnded}
      className="hidden"
    />
  );
}
