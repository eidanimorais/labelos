import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Copy, Check } from 'lucide-react';

interface ModernAudioPlayerProps {
    src: string;
}

export function ModernAudioPlayer({ src }: ModernAudioPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [copied, setCopied] = useState(false);

    const audioRef = useRef<HTMLAudioElement>(null);
    const progressBarRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const setAudioData = () => {
            setDuration(audio.duration);
            setCurrentTime(audio.currentTime);
        };

        const setAudioTime = () => setCurrentTime(audio.currentTime);

        // Initial load
        audio.addEventListener('loadedmetadata', setAudioData);
        audio.addEventListener('timeupdate', setAudioTime);
        audio.addEventListener('ended', () => setIsPlaying(false));

        return () => {
            audio.removeEventListener('loadedmetadata', setAudioData);
            audio.removeEventListener('timeupdate', setAudioTime);
        };
    }, []);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = Number(e.target.value);
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    const toggleMute = () => {
        if (audioRef.current) {
            audioRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(src);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const formatTime = (time: number) => {
        if (isNaN(time)) return "0:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="w-full bg-white dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-xl shadow-purple-500/5">
            <audio ref={audioRef} src={src} preload="metadata" />

            <div className="flex flex-col gap-3">
                {/* Controls Row */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={togglePlay}
                        className="w-12 h-12 flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg shadow-purple-500/30 transition-all transform hover:scale-105 active:scale-95"
                    >
                        {isPlaying ? (
                            <Pause className="h-6 w-6 fill-current" />
                        ) : (
                            <Play className="h-6 w-6 fill-current ml-1" />
                        )}
                    </button>

                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between mb-1 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                            <span>{formatTime(currentTime)}</span>
                            <span>{formatTime(duration)}</span>
                        </div>

                        <div className="relative group flex items-center h-4">
                            <input
                                ref={progressBarRef}
                                type="range"
                                value={currentTime}
                                max={duration || 0}
                                onChange={handleProgressChange}
                                className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full appearance-none cursor-pointer accent-purple-600 group-hover:h-2 transition-all"
                                style={{
                                    background: `linear-gradient(to right, #8B5CF6 0%, #8B5CF6 ${(currentTime / duration) * 100}%, #E5E7EB ${(currentTime / duration) * 100}%, #E5E7EB 100%)`
                                }}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={toggleMute}
                            className="p-2 text-gray-400 hover:text-purple-600 transition-colors"
                            title={isMuted ? "Unmute" : "Mute"}
                        >
                            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                        </button>
                        <button
                            onClick={handleCopy}
                            className={`p-2 transition-colors ${copied ? 'text-green-500' : 'text-gray-400 hover:text-purple-600'}`}
                            title="Copiar link da master"
                        >
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
