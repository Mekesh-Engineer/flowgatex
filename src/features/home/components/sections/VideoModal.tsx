import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, Volume2, Volume1, VolumeX, SkipBack, SkipForward, Maximize2, Minimize2, PictureInPicture2, Subtitles, Gauge, Loader2 } from 'lucide-react';

const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

const formatTime = (seconds: number): string => {
    if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
};

export const VideoModal = ({ isOpen, onClose, videoSrc }: { isOpen: boolean; onClose: () => void; videoSrc: string }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const progressRef = useRef<HTMLDivElement>(null);
    const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
    const containerRef = useRef<HTMLDivElement>(null);

    // Core state
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState(1);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [buffered, setBuffered] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    // UI state
    const [showControls, setShowControls] = useState(true);
    const [showSpeedMenu, setShowSpeedMenu] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [showVolumeSlider, setShowVolumeSlider] = useState(false);
    const [isSeeking, setIsSeeking] = useState(false);
    const [hoverProgress, setHoverProgress] = useState<number | null>(null);
    const [captionsOn, setCaptionsOn] = useState(false);
    const [isPiP, setIsPiP] = useState(false);

    // --- Helpers ---
    const showControlsTemporarily = useCallback(() => {
        setShowControls(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = setTimeout(() => {
            if (!showSpeedMenu && !showVolumeSlider && !isSeeking) {
                setShowControls(false);
            }
        }, 3000);
    }, [showSpeedMenu, showVolumeSlider, isSeeking]);

    // --- Core Actions ---
    const togglePlay = useCallback(() => {
        if (!videoRef.current) return;
        if (isPlaying) { videoRef.current.pause(); } else { videoRef.current.play(); }
        setIsPlaying(!isPlaying);
        showControlsTemporarily();
    }, [isPlaying, showControlsTemporarily]);

    const toggleMute = useCallback(() => {
        if (!videoRef.current) return;
        videoRef.current.muted = !isMuted;
        setIsMuted(!isMuted);
    }, [isMuted]);

    const changeVolume = useCallback((newVol: number) => {
        if (!videoRef.current) return;
        const clamped = Math.max(0, Math.min(1, newVol));
        videoRef.current.volume = clamped;
        setVolume(clamped);
        if (clamped === 0) { videoRef.current.muted = true; setIsMuted(true); }
        else if (isMuted) { videoRef.current.muted = false; setIsMuted(false); }
    }, [isMuted]);

    const seekTo = useCallback((time: number) => {
        if (!videoRef.current) return;
        videoRef.current.currentTime = Math.max(0, Math.min(duration, time));
    }, [duration]);

    const skip = useCallback((delta: number) => {
        if (!videoRef.current) return;
        videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + delta));
    }, [duration]);

    const changeSpeed = useCallback((speed: number) => {
        if (!videoRef.current) return;
        videoRef.current.playbackRate = speed;
        setPlaybackSpeed(speed);
        setShowSpeedMenu(false);
    }, []);

    const toggleFullscreen = useCallback(() => {
        if (!containerRef.current) return;
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            containerRef.current.requestFullscreen();
        }
    }, []);

    const togglePiP = useCallback(async () => {
        if (!videoRef.current) return;
        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
                setIsPiP(false);
            } else if (document.pictureInPictureEnabled) {
                await videoRef.current.requestPictureInPicture();
                setIsPiP(true);
            }
        } catch { /* PiP not supported */ }
    }, []);

    const handleClose = useCallback(() => {
        setIsPlaying(false);
        if (videoRef.current) { videoRef.current.pause(); }
        setShowSpeedMenu(false);
        setShowVolumeSlider(false);
        onClose();
    }, [onClose]);

    // --- Progress bar interaction ---
    const handleProgressClick = (e: React.MouseEvent) => {
        if (!progressRef.current || !duration) return;
        const rect = progressRef.current.getBoundingClientRect();
        const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        seekTo(fraction * duration);
    };

    const handleProgressHover = (e: React.MouseEvent) => {
        if (!progressRef.current || !duration) return;
        const rect = progressRef.current.getBoundingClientRect();
        const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        setHoverProgress(fraction);
    };

    // --- Video event listeners ---
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const onTimeUpdate = () => setCurrentTime(video.currentTime);
        const onDurationChange = () => setDuration(video.duration);
        const onLoadedData = () => { setIsLoading(false); setDuration(video.duration); };
        const onWaiting = () => setIsLoading(true);
        const onCanPlay = () => setIsLoading(false);
        const onProgress = () => {
            if (video.buffered.length > 0) {
                setBuffered(video.buffered.end(video.buffered.length - 1));
            }
        };
        const onEnded = () => { setIsPlaying(false); setShowControls(true); };
        const onPlay = () => setIsPlaying(true);
        const onPause = () => setIsPlaying(false);
        const onLeavePiP = () => setIsPiP(false);
        const onEnterPiP = () => setIsPiP(true);

        video.addEventListener('timeupdate', onTimeUpdate);
        video.addEventListener('durationchange', onDurationChange);
        video.addEventListener('loadeddata', onLoadedData);
        video.addEventListener('waiting', onWaiting);
        video.addEventListener('canplay', onCanPlay);
        video.addEventListener('progress', onProgress);
        video.addEventListener('ended', onEnded);
        video.addEventListener('play', onPlay);
        video.addEventListener('pause', onPause);
        video.addEventListener('leavepictureinpicture', onLeavePiP);
        video.addEventListener('enterpictureinpicture', onEnterPiP);

        return () => {
            video.removeEventListener('timeupdate', onTimeUpdate);
            video.removeEventListener('durationchange', onDurationChange);
            video.removeEventListener('loadeddata', onLoadedData);
            video.removeEventListener('waiting', onWaiting);
            video.removeEventListener('canplay', onCanPlay);
            video.removeEventListener('progress', onProgress);
            video.removeEventListener('ended', onEnded);
            video.removeEventListener('play', onPlay);
            video.removeEventListener('pause', onPause);
            video.removeEventListener('leavepictureinpicture', onLeavePiP);
            video.removeEventListener('enterpictureinpicture', onEnterPiP);
        };
    }, []);

    // --- Open / Close lifecycle ---
    useEffect(() => {
        if (isOpen) {
            setIsLoading(true);
            setCurrentTime(0);
            setShowControls(true);
            setTimeout(() => { videoRef.current?.play(); }, 150);
            document.body.style.overflow = 'hidden';
        } else {
            setIsPlaying(false);
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    // --- Keyboard shortcuts ---
    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            switch (e.key) {
                case 'Escape': handleClose(); break;
                case ' ': case 'k': e.preventDefault(); togglePlay(); break;
                case 'ArrowLeft': e.preventDefault(); skip(-5); break;
                case 'ArrowRight': e.preventDefault(); skip(5); break;
                case 'j': skip(-10); break;
                case 'l': skip(10); break;
                case 'ArrowUp': e.preventDefault(); changeVolume(volume + 0.1); break;
                case 'ArrowDown': e.preventDefault(); changeVolume(volume - 0.1); break;
                case 'm': toggleMute(); break;
                case 'f': toggleFullscreen(); break;
                case 'p': togglePiP(); break;
                case 'c': setCaptionsOn(prev => !prev); break;
                case ',': if (!isPlaying && videoRef.current) videoRef.current.currentTime -= 1 / 30; break;
                case '.': if (!isPlaying && videoRef.current) videoRef.current.currentTime += 1 / 30; break;
                default: break;
            }
            showControlsTemporarily();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [isOpen, handleClose, togglePlay, skip, changeVolume, volume, toggleMute, toggleFullscreen, togglePiP, isPlaying, showControlsTemporarily]);

    if (!isOpen) return null;

    const progress = duration ? (currentTime / duration) * 100 : 0;
    const bufferedProgress = duration ? (buffered / duration) * 100 : 0;
    const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 md:p-8 bg-black/90 backdrop-blur-md"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Video player"
                >
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.25, delay: 0.1 }}
                        onClick={handleClose}
                        className="absolute top-3 right-3 sm:top-5 sm:right-5 z-[60] group"
                        aria-label="Close video player (Escape)"
                    >
                        <div className="relative flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/60 border border-white/15 backdrop-blur-sm hover:bg-white/15 hover:border-white/30 hover:scale-110 active:scale-95 transition-all duration-200 shadow-lg shadow-black/30">
                            <X size={22} className="text-white/90 group-hover:text-white transition-colors" />
                        </div>
                    </motion.button>

                    <motion.div
                        ref={containerRef}
                        initial={{ opacity: 0, scale: 0.92, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: 16 }}
                        transition={{ duration: 0.35, type: 'spring', damping: 28, stiffness: 300 }}
                        className="relative w-full max-w-[calc(100vw-1.5rem)] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl aspect-video rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl shadow-black/50 bg-black border border-white/10 group/player"
                        onMouseMove={showControlsTemporarily}
                        onMouseLeave={() => { if (isPlaying) setShowControls(false); }}
                    >
                        <video
                            ref={videoRef}
                            className="w-full h-full object-contain bg-black cursor-pointer"
                            src={videoSrc}
                            onClick={togglePlay}
                            controls={false}
                            playsInline
                            preload="metadata"
                            crossOrigin="anonymous"
                            aria-label="Case study video"
                        />

                        <AnimatePresence>
                            {!isPlaying && !isLoading && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 1.2 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
                                >
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/10 shadow-2xl">
                                        <Play size={32} className="text-white ml-1" fill="currentColor" />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <AnimatePresence>
                            {isLoading && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none z-20"
                                >
                                    <Loader2 size={40} className="text-white animate-spin" />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {captionsOn && (
                            <div className="absolute bottom-16 sm:bottom-20 left-1/2 -translate-x-1/2 z-10 px-4 py-2 bg-black/75 rounded-lg text-white text-sm sm:text-base font-medium max-w-[80%] text-center pointer-events-none">
                                <span className="opacity-70 italic">[Captions enabled — no subtitle track loaded]</span>
                            </div>
                        )}

                        <motion.div
                            initial={false}
                            animate={{ opacity: showControls ? 1 : 0 }}
                            transition={{ duration: 0.25 }}
                            className="absolute inset-x-0 bottom-0 z-30"
                            style={{ pointerEvents: showControls ? 'auto' : 'none' }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />

                            <div className="relative px-3 sm:px-4 pb-3 sm:pb-4 pt-10 flex flex-col gap-2">
                                <div
                                    ref={progressRef}
                                    className="group/progress relative w-full h-1.5 hover:h-2.5 bg-white/15 rounded-full cursor-pointer transition-all duration-200"
                                    onClick={handleProgressClick}
                                    onMouseMove={handleProgressHover}
                                    onMouseLeave={() => setHoverProgress(null)}
                                    onMouseDown={() => setIsSeeking(true)}
                                    onMouseUp={() => setIsSeeking(false)}
                                    role="slider"
                                    aria-label="Video progress"
                                    aria-valuenow={Math.round(progress)}
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                    tabIndex={0}
                                >
                                    <div className="absolute inset-y-0 left-0 bg-white/20 rounded-full transition-all" style={{ width: `${bufferedProgress}%` }} />
                                    <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#00A3DB] to-[#00C9FF] rounded-full transition-[width] duration-100" style={{ width: `${progress}%` }} />
                                    <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-lg shadow-black/30 border-2 border-[#00A3DB] opacity-0 group-hover/progress:opacity-100 transition-opacity duration-150 pointer-events-none" style={{ left: `calc(${progress}% - 7px)` }} />
                                    {hoverProgress !== null && duration > 0 && (
                                        <div className="absolute -top-9 px-2 py-1 rounded-md bg-black/85 text-white text-[11px] font-mono pointer-events-none whitespace-nowrap backdrop-blur-sm border border-white/10" style={{ left: `calc(${hoverProgress * 100}% - 20px)` }}>
                                            {formatTime(hoverProgress * duration)}
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-between gap-1 sm:gap-2">
                                    <div className="flex items-center gap-0.5 sm:gap-1.5">
                                        <button onClick={togglePlay} className="p-1.5 sm:p-2 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition-all" aria-label={isPlaying ? 'Pause (Space)' : 'Play (Space)'}>
                                            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
                                        </button>
                                        <button onClick={() => skip(-10)} className="p-1.5 sm:p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all hidden sm:flex" aria-label="Rewind 10 seconds (J)"><SkipBack size={18} /></button>
                                        <button onClick={() => skip(10)} className="p-1.5 sm:p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all hidden sm:flex" aria-label="Forward 10 seconds (L)"><SkipForward size={18} /></button>

                                        <div className="relative flex items-center" onMouseEnter={() => setShowVolumeSlider(true)} onMouseLeave={() => setShowVolumeSlider(false)}>
                                            <button onClick={toggleMute} className="p-1.5 sm:p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all" aria-label={isMuted ? 'Unmute (M)' : 'Mute (M)'}>
                                                <VolumeIcon size={18} />
                                            </button>
                                            <AnimatePresence>
                                                {showVolumeSlider && (
                                                    <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 80, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden hidden sm:flex items-center">
                                                        <input type="range" min={0} max={1} step={0.05} value={isMuted ? 0 : volume} onChange={(e) => changeVolume(parseFloat(e.target.value))} className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-[#00A3DB] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md" aria-label="Volume" />
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                        <span className="text-white/60 text-[11px] sm:text-xs font-mono ml-1 sm:ml-2 select-none">{formatTime(currentTime)} / {formatTime(duration)}</span>
                                    </div>

                                    <div className="flex items-center gap-0.5 sm:gap-1">
                                        <div className="relative">
                                            <button onClick={() => setShowSpeedMenu(prev => !prev)} className="p-1.5 sm:p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1" aria-label="Playback speed" aria-haspopup="true" aria-expanded={showSpeedMenu}>
                                                <Gauge size={16} /><span className="text-[10px] sm:text-[11px] font-bold">{playbackSpeed}x</span>
                                            </button>
                                            <AnimatePresence>
                                                {showSpeedMenu && (
                                                    <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.95 }} transition={{ duration: 0.15 }} className="absolute bottom-full right-0 mb-2 bg-black/90 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden shadow-xl shadow-black/40 min-w-[100px]">
                                                        {PLAYBACK_SPEEDS.map((speed) => (
                                                            <button key={speed} onClick={() => changeSpeed(speed)} className={`w-full px-4 py-2 text-left text-xs font-medium transition-colors ${playbackSpeed === speed ? 'text-[#00A3DB] bg-[#00A3DB]/10' : 'text-white/80 hover:text-white hover:bg-white/10'}`}>
                                                                {speed === 1 ? 'Normal' : `${speed}x`}
                                                            </button>
                                                        ))}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                        <button onClick={() => setCaptionsOn(prev => !prev)} className={`p-1.5 sm:p-2 rounded-lg transition-all hidden sm:flex ${captionsOn ? 'text-[#00A3DB] bg-[#00A3DB]/10' : 'text-white/70 hover:text-white hover:bg-white/10'}`} aria-label={captionsOn ? 'Disable captions (C)' : 'Enable captions (C)'}><Subtitles size={18} /></button>
                                        {document.pictureInPictureEnabled && (
                                            <button onClick={togglePiP} className={`p-1.5 sm:p-2 rounded-lg transition-all hidden sm:flex ${isPiP ? 'text-[#00A3DB] bg-[#00A3DB]/10' : 'text-white/70 hover:text-white hover:bg-white/10'}`} aria-label={isPiP ? 'Exit picture-in-picture (P)' : 'Picture-in-picture (P)'}><PictureInPicture2 size={18} /></button>
                                        )}
                                        <button onClick={toggleFullscreen} className="p-1.5 sm:p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all" aria-label="Toggle fullscreen (F)">{document.fullscreenElement ? <Minimize2 size={18} /> : <Maximize2 size={18} />}</button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div initial={false} animate={{ opacity: showControls ? 1 : 0 }} transition={{ duration: 0.25 }} className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/50 to-transparent pointer-events-none z-20" />
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.3, delay: 0.2 }} className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 text-white/40 text-[11px] sm:text-xs">
                        <span className="hidden md:inline">ESC close</span><span className="hidden md:inline">·</span><span className="hidden md:inline">Space play/pause</span><span className="hidden md:inline">·</span><span className="hidden md:inline">← → seek</span><span className="hidden md:inline">·</span><span className="hidden md:inline">↑ ↓ volume</span><span className="md:hidden">Tap outside to close</span>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};