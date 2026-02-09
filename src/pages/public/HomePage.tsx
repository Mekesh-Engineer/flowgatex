import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '@/features/auth/hooks/useAuth';
import { motion, Variants, useInView, AnimatePresence } from 'framer-motion';
import { 
  Search, MapPin, Calendar, ArrowRight, Music, 
  Trophy, Cpu, Palette, Users, Globe, Ticket, 
  Play, Star, CheckCircle, Smartphone, ShieldCheck, 
  Filter, Zap, Sparkles, ChevronDown, ArrowUpRight,
  Heart, Bell, TrendingUp,
  Headphones,
  Mic2, PartyPopper, Rocket,
  Eye, BarChart3, 
  Globe2, Users2, QrCode, X, Maximize2, Minimize2,
  Volume2, Volume1, VolumeX, Pause, Quote, Camera,
  PictureInPicture2, Gauge, Subtitles, SkipBack, SkipForward, Loader2
} from 'lucide-react';

// --- Internal Imports ---
// Assuming these paths exist in your project structure
// import EventCard from '@/features/events/components/EventCard'; 
// import '@/styles/utilities/scrollbar.css';
// import '@/styles/utilities/animations.css';

// =============================================================================
// CANVAS ANIMATION COMPONENTS
// =============================================================================

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  hue: number;
}

const ParticleCanvas: React.FC<{ className?: string; particleCount?: number }> = ({ 
  className = '', 
  particleCount = 50 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize particles
    particlesRef.current = Array.from({ length: particleCount }, () => ({
      x: Math.random() * canvas.offsetWidth,
      y: Math.random() * canvas.offsetHeight,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.5 + 0.2,
      hue: Math.random() > 0.5 ? 195 : 85, // KEC Blue or Green
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      particlesRef.current.forEach((particle, i) => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.offsetWidth;
        if (particle.x > canvas.offsetWidth) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.offsetHeight;
        if (particle.y > canvas.offsetHeight) particle.y = 0;

        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${particle.hue}, 100%, 50%, ${particle.opacity})`;
        ctx.fill();

        // Draw connections
        particlesRef.current.slice(i + 1).forEach(other => {
          const dx = particle.x - other.x;
          const dy = particle.y - other.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 150) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = `hsla(195, 100%, 50%, ${0.1 * (1 - distance / 150)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [particleCount]);

  return (
    <canvas 
      ref={canvasRef} 
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ width: '100%', height: '100%' }}
    />
  );
};

const GridCanvas: React.FC<{ className?: string }> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const offsetRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      
      const gridSize = 60;
      offsetRef.current += 0.2;
      
      if (offsetRef.current >= gridSize) {
        offsetRef.current = 0;
      }

      ctx.strokeStyle = 'hsla(195, 100%, 50%, 0.05)';
      ctx.lineWidth = 1;

      // Vertical lines
      for (let x = -gridSize + offsetRef.current; x < canvas.offsetWidth + gridSize; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.offsetHeight);
        ctx.stroke();
      }

      // Horizontal lines
      for (let y = -gridSize + offsetRef.current; y < canvas.offsetHeight + gridSize; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.offsetWidth, y);
        ctx.stroke();
      }

      // Glowing intersections
      for (let x = -gridSize + offsetRef.current; x < canvas.offsetWidth + gridSize; x += gridSize) {
        for (let y = -gridSize + offsetRef.current; y < canvas.offsetHeight + gridSize; y += gridSize) {
          const pulseOpacity = 0.3 + Math.sin(Date.now() / 1000 + x + y) * 0.2;
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(195, 100%, 50%, ${pulseOpacity})`;
          ctx.fill();
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ width: '100%', height: '100%' }}
    />
  );
};

const WaveCanvas: React.FC<{ className?: string }> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let time = 0;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      time += 0.02;

      const waves = [
        { amplitude: 30, frequency: 0.02, speed: 1, opacity: 0.1, hue: 195 },
        { amplitude: 20, frequency: 0.03, speed: 1.5, opacity: 0.08, hue: 85 },
        { amplitude: 15, frequency: 0.025, speed: 0.8, opacity: 0.06, hue: 195 },
      ];

      waves.forEach(wave => {
        ctx.beginPath();
        ctx.moveTo(0, canvas.offsetHeight / 2);

        for (let x = 0; x <= canvas.offsetWidth; x += 5) {
          const y = canvas.offsetHeight / 2 + 
            Math.sin(x * wave.frequency + time * wave.speed) * wave.amplitude +
            Math.sin(x * wave.frequency * 0.5 + time * wave.speed * 0.7) * wave.amplitude * 0.5;
          ctx.lineTo(x, y);
        }

        ctx.strokeStyle = `hsla(${wave.hue}, 100%, 50%, ${wave.opacity})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ width: '100%', height: '100%' }}
    />
  );
};

// =============================================================================
// REUSABLE UI COMPONENTS
// =============================================================================

const GlowingBorder: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <div className={`relative group ${className}`}>
    <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00A3DB] to-[#A3D639] rounded-2xl blur opacity-0 group-hover:opacity-30 transition duration-500" />
    <div className="relative">{children}</div>
  </div>
);

const AnimatedCounter: React.FC<{ 
  end: number; 
  suffix?: string; 
  duration?: number 
}> = ({ end, suffix = '', duration = 2000 }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    
    let startTime: number;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [inView, end, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
};

const FloatingElement: React.FC<{ 
  children: React.ReactNode; 
  delay?: number;
  duration?: number;
  className?: string;
}> = ({ children, delay = 0, duration = 3, className = '' }) => (
  <motion.div
    className={className}
    animate={{
      y: [0, -10, 0],
      rotate: [-1, 1, -1],
    }}
    transition={{
      duration,
      repeat: Infinity,
      delay,
      ease: "easeInOut"
    }}
  >
    {children}
  </motion.div>
);

const PulsingDot: React.FC<{ color?: string; size?: string }> = ({ 
  color = 'bg-[#00A3DB]', 
  size = 'size-2' 
}) => (
  <span className="relative flex">
    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-75`} />
    <span className={`relative inline-flex rounded-full ${size} ${color}`} />
  </span>
);

// =============================================================================
// ENHANCED VIDEO MODAL
// =============================================================================

const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

const formatTime = (seconds: number): string => {
  if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const VideoModal = ({ isOpen, onClose, videoSrc }: { isOpen: boolean; onClose: () => void; videoSrc: string }) => {
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
      // Don't handle if user is typing in an input
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
          {/* Close Button */}
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

          {/* Player Container — responsive sizing with fixed 16:9 aspect ratio */}
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
            {/* Video Element */}
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

            {/* Center Play/Pause Indicator (brief flash) */}
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

            {/* Loading Spinner */}
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

            {/* Captions Placeholder */}
            {captionsOn && (
              <div className="absolute bottom-16 sm:bottom-20 left-1/2 -translate-x-1/2 z-10 px-4 py-2 bg-black/75 rounded-lg text-white text-sm sm:text-base font-medium max-w-[80%] text-center pointer-events-none">
                <span className="opacity-70 italic">[Captions enabled — no subtitle track loaded]</span>
              </div>
            )}

            {/* Controls Overlay */}
            <motion.div
              initial={false}
              animate={{ opacity: showControls ? 1 : 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-x-0 bottom-0 z-30"
              style={{ pointerEvents: showControls ? 'auto' : 'none' }}
            >
              {/* Gradient background */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />

              <div className="relative px-3 sm:px-4 pb-3 sm:pb-4 pt-10 flex flex-col gap-2">
                {/* Progress Bar */}
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
                  {/* Buffered */}
                  <div
                    className="absolute inset-y-0 left-0 bg-white/20 rounded-full transition-all"
                    style={{ width: `${bufferedProgress}%` }}
                  />
                  {/* Played */}
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#00A3DB] to-[#00C9FF] rounded-full transition-[width] duration-100"
                    style={{ width: `${progress}%` }}
                  />
                  {/* Scrub Head */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-lg shadow-black/30 border-2 border-[#00A3DB] opacity-0 group-hover/progress:opacity-100 transition-opacity duration-150 pointer-events-none"
                    style={{ left: `calc(${progress}% - 7px)` }}
                  />
                  {/* Hover Time Tooltip */}
                  {hoverProgress !== null && duration > 0 && (
                    <div
                      className="absolute -top-9 px-2 py-1 rounded-md bg-black/85 text-white text-[11px] font-mono pointer-events-none whitespace-nowrap backdrop-blur-sm border border-white/10"
                      style={{ left: `calc(${hoverProgress * 100}% - 20px)` }}
                    >
                      {formatTime(hoverProgress * duration)}
                    </div>
                  )}
                </div>

                {/* Bottom Controls Row */}
                <div className="flex items-center justify-between gap-1 sm:gap-2">
                  {/* Left Controls */}
                  <div className="flex items-center gap-0.5 sm:gap-1.5">
                    {/* Play / Pause */}
                    <button
                      onClick={togglePlay}
                      className="p-1.5 sm:p-2 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition-all"
                      aria-label={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
                    >
                      {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
                    </button>

                    {/* Skip Back */}
                    <button
                      onClick={() => skip(-10)}
                      className="p-1.5 sm:p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all hidden sm:flex"
                      aria-label="Rewind 10 seconds (J)"
                    >
                      <SkipBack size={18} />
                    </button>

                    {/* Skip Forward */}
                    <button
                      onClick={() => skip(10)}
                      className="p-1.5 sm:p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all hidden sm:flex"
                      aria-label="Forward 10 seconds (L)"
                    >
                      <SkipForward size={18} />
                    </button>

                    {/* Volume */}
                    <div
                      className="relative flex items-center"
                      onMouseEnter={() => setShowVolumeSlider(true)}
                      onMouseLeave={() => setShowVolumeSlider(false)}
                    >
                      <button
                        onClick={toggleMute}
                        className="p-1.5 sm:p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all"
                        aria-label={isMuted ? 'Unmute (M)' : 'Mute (M)'}
                      >
                        <VolumeIcon size={18} />
                      </button>
                      <AnimatePresence>
                        {showVolumeSlider && (
                          <motion.div
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 80, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="overflow-hidden hidden sm:flex items-center"
                          >
                            <input
                              type="range"
                              min={0}
                              max={1}
                              step={0.05}
                              value={isMuted ? 0 : volume}
                              onChange={(e) => changeVolume(parseFloat(e.target.value))}
                              className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-[#00A3DB] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md"
                              aria-label="Volume"
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Time Display */}
                    <span className="text-white/60 text-[11px] sm:text-xs font-mono ml-1 sm:ml-2 select-none">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>

                  {/* Right Controls */}
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    {/* Playback Speed */}
                    <div className="relative">
                      <button
                        onClick={() => setShowSpeedMenu(prev => !prev)}
                        className="p-1.5 sm:p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1"
                        aria-label="Playback speed"
                        aria-haspopup="true"
                        aria-expanded={showSpeedMenu}
                      >
                        <Gauge size={16} />
                        <span className="text-[10px] sm:text-[11px] font-bold">{playbackSpeed}x</span>
                      </button>
                      <AnimatePresence>
                        {showSpeedMenu && (
                          <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute bottom-full right-0 mb-2 bg-black/90 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden shadow-xl shadow-black/40 min-w-[100px]"
                          >
                            {PLAYBACK_SPEEDS.map((speed) => (
                              <button
                                key={speed}
                                onClick={() => changeSpeed(speed)}
                                className={`w-full px-4 py-2 text-left text-xs font-medium transition-colors ${
                                  playbackSpeed === speed
                                    ? 'text-[#00A3DB] bg-[#00A3DB]/10'
                                    : 'text-white/80 hover:text-white hover:bg-white/10'
                                }`}
                              >
                                {speed === 1 ? 'Normal' : `${speed}x`}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Captions Toggle */}
                    <button
                      onClick={() => setCaptionsOn(prev => !prev)}
                      className={`p-1.5 sm:p-2 rounded-lg transition-all hidden sm:flex ${
                        captionsOn ? 'text-[#00A3DB] bg-[#00A3DB]/10' : 'text-white/70 hover:text-white hover:bg-white/10'
                      }`}
                      aria-label={captionsOn ? 'Disable captions (C)' : 'Enable captions (C)'}
                    >
                      <Subtitles size={18} />
                    </button>

                    {/* Picture-in-Picture */}
                    {document.pictureInPictureEnabled && (
                      <button
                        onClick={togglePiP}
                        className={`p-1.5 sm:p-2 rounded-lg transition-all hidden sm:flex ${
                          isPiP ? 'text-[#00A3DB] bg-[#00A3DB]/10' : 'text-white/70 hover:text-white hover:bg-white/10'
                        }`}
                        aria-label={isPiP ? 'Exit picture-in-picture (P)' : 'Picture-in-picture (P)'}
                      >
                        <PictureInPicture2 size={18} />
                      </button>
                    )}

                    {/* Fullscreen */}
                    <button
                      onClick={toggleFullscreen}
                      className="p-1.5 sm:p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all"
                      aria-label="Toggle fullscreen (F)"
                    >
                      {document.fullscreenElement ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Top gradient for close button visibility */}
            <motion.div
              initial={false}
              animate={{ opacity: showControls ? 1 : 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/50 to-transparent pointer-events-none z-20"
            />
          </motion.div>

          {/* Keyboard Shortcuts Hint */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 text-white/40 text-[11px] sm:text-xs"
          >
            <span className="hidden md:inline">ESC close</span>
            <span className="hidden md:inline">·</span>
            <span className="hidden md:inline">Space play/pause</span>
            <span className="hidden md:inline">·</span>
            <span className="hidden md:inline">← → seek</span>
            <span className="hidden md:inline">·</span>
            <span className="hidden md:inline">↑ ↓ volume</span>
            <span className="md:hidden">Tap outside to close</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// =============================================================================
// MOCK DATA
// =============================================================================

const TRENDING_EVENTS = [
  {
    id: 't1',
    title: 'Electronic Dreams Tour',
    category: 'music',
    image: 'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?q=80&w=2070',
    date: 'Mar 15, 2026',
    venue: 'Neon Stadium',
    price: 6500,
    trending: '+45%',
    likes: 2340
  },
  {
    id: 't2',
    title: 'AI & Robotics Expo',
    category: 'technology',
    image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=2070',
    date: 'Mar 22, 2026',
    venue: 'Tech Pavilion',
    price: 12000,
    trending: '+32%',
    likes: 1890
  },
  {
    id: 't3',
    title: 'Urban Street Art Festival',
    category: 'arts',
    image: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?q=80&w=2070',
    date: 'Apr 5, 2026',
    venue: 'Downtown District',
    price: 2500,
    trending: '+28%',
    likes: 1560
  },
  {
    id: 't4',
    title: 'Gaming Championship Finals',
    category: 'gaming',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070',
    date: 'Apr 12, 2026',
    venue: 'E-Sports Arena',
    price: 4500,
    trending: '+67%',
    likes: 4210
  }
];

const FEATURES_GRID = [
  {
    title: "Smart Access Control",
    description: "Lightning-fast entry with IoT-enabled QR scanners and NFC support. Eliminate queues and fraud with real-time validation.",
    icon: Smartphone,
    color: "var(--color-primary)",
    gradient: "from-[var(--color-primary)] to-[#60a5fa]"
  },
  {
    title: "Real-Time Analytics",
    description: "Track attendance, revenue, and engagement live. visual dashboards give you the insights needed to optimize on the fly.",
    icon: BarChart3,
    color: "var(--color-secondary)",
    gradient: "from-[var(--color-secondary)] to-[#bef264]"
  },
  {
    title: "Bank-Grade Security",
    description: "Encrypted payments and data protection. We ensure every transaction and ticket is secure against counterfeiting.",
    icon: ShieldCheck,
    color: "var(--color-warning)",
    gradient: "from-[var(--color-warning)] to-[#fbbf24]"
  },
  {
    title: "Global Scalability",
    description: "Host events anywhere. Our platform supports multi-currency payments, timezones, and localized ticketing formats.",
    icon: Globe2,
    color: "#8b5cf6",
    gradient: "from-[#8b5cf6] to-[#a78bfa]"
  },
  {
    title: "Community Building",
    description: "Turn attendees into fans. Integrated social features allow users to follow organizers, share events, and build networks.",
    icon: Users2,
    color: "#ec4899",
    gradient: "from-[#ec4899] to-[#f472b6]"
  },
  {
    title: "Instant Deployments",
    description: "Launch your event page in minutes. Our intuitive tools let you customize branding and ticketing tiers without coding.",
    icon: Zap,
    color: "#06b6d4",
    gradient: "from-[#06b6d4] to-[#67e8f9]"
  }
];

const TRIP_STEPS = [
  {
    title: "Discover",
    description: "Browse thousands of events or search by category, location, and date to find your vibe.",
    icon: Search,
    bg: "bg-[#00A3DB]/10",
    border: "border-[#00A3DB]/20",
    color: "text-[#00A3DB]"
  },
  {
    title: "Book Securely",
    description: "Select your tickets and pay instantly with our encrypted, fraud-proof payment gateway.",
    icon: Ticket,
    bg: "bg-[#A3D639]/10",
    border: "border-[#A3D639]/20",
    color: "text-[#A3D639]"
  },
  {
    title: "Get Tickets",
    description: "Receive your unique QR code instantly via email and in your personal dashboard.",
    icon: QrCode,
    bg: "bg-[#f59e0b]/10",
    border: "border-[#f59e0b]/20",
    color: "text-[#f59e0b]"
  },
  {
    title: "Enjoy Event",
    description: "Scan your QR code at the venue for seamless entry and enjoy the experience!",
    icon: PartyPopper,
    bg: "bg-[#8b5cf6]/10",
    border: "border-[#8b5cf6]/20",
    color: "text-[#8b5cf6]"
  }
];

export interface ReviewData {
  id: number;
  title: string;
  description: string;
  rating: number;
  reviewerName: string;
  reviewerContext: string;
  imageSrc: string;
  avatar: string;
}

const REVIEWS: ReviewData[] = [
  {
    id: 1,
    title: 'Seamless entry with QR codes!',
    description: 'The IoT-powered access control made entering the venue a breeze. No more waiting in long queues. Highly recommended for all event organizers looking to modernize!',
    rating: 5,
    reviewerName: 'Sarah Chen',
    reviewerContext: 'Tech Summit 2025',
    imageSrc: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
  },
  {
    id: 2,
    title: 'Best event management platform',
    description: 'As an organizer, FlowGateX gave me real-time insights into crowd flow and ticket sales. The analytics dashboard is incredibly powerful and easy to use.',
    rating: 5,
    reviewerName: 'Michael Rodriguez',
    reviewerContext: 'Summer Music Fest',
    imageSrc: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=800&q=80',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
  },
  {
    id: 3,
    title: 'Revolutionary crowd monitoring',
    description: 'The heatmaps and capacity alerts helped us manage safety protocols effectively. FlowGateX is a game-changer for large-scale arena events.',
    rating: 4,
    reviewerName: 'Emily Watson',
    reviewerContext: 'Arena Plus Manager',
    imageSrc: 'https://images.unsplash.com/photo-1478147427282-58a87a120781?auto=format&fit=crop&w=800&q=80',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80',
  },
  {
    id: 4,
    title: 'Smooth payment integration',
    description: 'Setting up Razorpay and Stripe was incredibly easy. Our attendees loved the multiple payment options available at checkout. Zero transaction failures.',
    rating: 5,
    reviewerName: 'David Kim',
    reviewerContext: 'Global FinTech Conf',
    imageSrc: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&q=80',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
  },
];

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6 } }
};

const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6 } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

const TrendingCard = ({ event, variants }: { event: typeof TRENDING_EVENTS[0], variants: Variants }) => {
  const [isLiked, setIsLiked] = useState(false);

  return (
    <motion.div
      variants={variants}
      whileHover={{ y: -8 }}
      className="group relative flex flex-col h-full rounded-2xl overflow-hidden bg-[var(--bg-card)] border border-[var(--border-primary)] hover:border-[var(--color-primary)] transition-all duration-300 shadow-lg hover:shadow-[var(--shadow-lg)]"
    >
      <div className="relative h-48 overflow-hidden shrink-0">
        <img 
          src={event.image} 
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] via-transparent to-transparent" />
        
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ef4444] text-white text-xs font-bold shadow-md z-10">
          <TrendingUp size={12} />
          {event.trending}
        </div>

        <button 
          onClick={(e) => {
            e.preventDefault();
            setIsLiked(!isLiked);
          }}
          className="absolute top-3 right-3 p-2 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-[#ef4444] transition-all transform hover:scale-110 active:scale-95 z-10 group/like"
          aria-label="Like event"
        >
          <Heart 
            size={18} 
            className={`transition-colors duration-300 ${isLiked ? 'fill-current text-[#ef4444]' : 'text-white'}`} 
          />
        </button>
      </div>

      <div className="p-5 flex flex-col flex-grow">
        <div className="flex items-center justify-between mb-3">
          <span className="px-2.5 py-0.5 rounded-full bg-[var(--color-primary-faint)] text-[var(--color-primary)] text-xs font-bold capitalize tracking-wide border border-[var(--color-primary)]/10">
            {event.category}
          </span>
          <span className="text-[var(--text-muted)] text-xs flex items-center gap-1 font-medium">
            <Heart size={12} className={isLiked ? "text-[#ef4444] fill-[#ef4444]" : "text-[#ef4444]"} />
            {(isLiked ? event.likes + 1 : event.likes).toLocaleString()}
          </span>
        </div>

        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2 group-hover:text-[var(--color-primary)] transition-colors line-clamp-1" title={event.title}>
          {event.title}
        </h3>

        <div className="space-y-2 mb-6">
          <p className="text-sm text-[var(--text-muted)] flex items-center gap-2">
            <Calendar size={14} className="text-[var(--color-primary)] shrink-0" />
            <span className="truncate">{event.date}</span>
          </p>
          <p className="text-sm text-[var(--text-muted)] flex items-center gap-2">
            <MapPin size={14} className="text-[var(--color-secondary)] shrink-0" />
            <span className="truncate">{event.venue}</span>
          </p>
        </div>

        <div className="mt-auto pt-4 border-t border-[var(--border-primary)] flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Starting from</span>
            <span className="text-xl font-bold text-[var(--text-primary)]">
              {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(event.price)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Link 
              to={`/events/${event.id}`}
              className="relative overflow-hidden flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-cyan-500 via-cyan-600 to-indigo-600 hover:from-cyan-600 hover:via-indigo-600 hover:to-indigo-700 shadow-md hover:shadow-lg hover:shadow-cyan-500/30 transform hover:-translate-y-0.5 hover:scale-[1.02] transition-all duration-300 ease-out"
            >
              <Eye size={16} className="relative z-20" />
              <span className="relative z-20">Details</span>
              <div className="absolute inset-0 opacity-0 hover:opacity-100 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full hover:translate-x-full transition-all duration-700 ease-in-out" />
            </Link>

            <Link 
              to={`/booking/${event.id}`}
              className="relative overflow-hidden flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-lime-500 via-green-500 to-emerald-600 hover:from-lime-600 hover:via-green-600 hover:to-emerald-700 shadow-md hover:shadow-lg hover:shadow-lime-500/30 transform hover:-translate-y-0.5 hover:scale-[1.02] transition-all duration-300 ease-out"
            >
               <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-10" />
               <span className="relative z-20 flex items-center gap-2">
                 Book <Ticket size={16} />
               </span>
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const ReviewCard = ({ data }: { data: ReviewData }) => {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="group relative w-full min-w-[360px] max-w-[400px] flex-shrink-0 pt-3 pl-3 md:min-w-[400px]"
    >
      <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-primary)] border border-[var(--border-primary)] transform translate-x-2 translate-y-2 transition-transform duration-300 ease-out group-hover:translate-x-4 group-hover:translate-y-4 group-hover:rotate-1 opacity-50" />

      <div className="relative h-full flex flex-col justify-between rounded-[2rem] bg-[var(--bg-card)] p-6 shadow-xl shadow-black/5 border border-[var(--border-primary)] transition-all duration-300 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-primary)] opacity-80" />

        <div className="relative z-10 flex flex-col h-full">
          <div className="flex justify-between items-start mb-4">
            <Quote className="text-5xl text-[var(--color-primary)]/20 transform -translate-x-1 -translate-y-1 fill-current" size={40} />
            <div className="flex gap-1 bg-[var(--bg-secondary)]/50 px-3 py-1.5 rounded-full border border-[var(--border-primary)]">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  size={14}
                  className={i < data.rating ? "text-[#f59e0b] fill-[#f59e0b]" : "text-[var(--text-muted)]"} 
                />
              ))}
            </div>
          </div>
           
          <div className="mb-6 flex-grow">
            <h3 className="mb-2 text-lg font-bold leading-tight text-[var(--text-primary)] line-clamp-2 group-hover:text-[var(--color-primary)] transition-colors">
              &ldquo;{data.title}&rdquo;
            </h3>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)] line-clamp-3">
              {data.description}
            </p>
          </div>

          <div className="mt-auto space-y-5">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--bg-secondary)]/30 border border-[var(--border-primary)]/50">
              <div className="relative w-10 h-10 rounded-full p-[2px] bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] shadow-sm">
                <div className="relative w-full h-full rounded-full overflow-hidden bg-[var(--bg-card)]">
                  <img 
                    src={data.avatar} 
                    alt={data.reviewerName} 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-bold text-sm text-[var(--text-primary)] truncate">{data.reviewerName}</p>
                  <CheckCircle className="text-[var(--color-success)]" size={14} />
                </div>
                <p className="text-xs text-[var(--text-muted)] truncate">{data.reviewerContext}</p>
              </div>
            </div>

            <div className="relative h-36 w-full overflow-hidden rounded-2xl group-hover:shadow-md transition-all border border-[var(--border-primary)]/50">
              <img
                src={data.imageSrc}
                alt={`Experience at ${data.reviewerContext}`}
                className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                <span className="text-[10px] font-medium text-white/90 bg-white/10 backdrop-blur-md px-2 py-1 rounded-md border border-white/10">
                  Verified Visit
                </span>
                <Camera className="text-white/80" size={16} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// =============================================================================
// SECTION COMPONENTS
// =============================================================================

const HeroSection = () => {
  const { isAuthenticated } = useAuth();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    setMousePosition({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  }, []);

  return (
    <section 
      ref={heroRef}
      onMouseMove={handleMouseMove}
      className="relative min-h-screen flex flex-col justify-center pt-28 pb-12 px-4 overflow-hidden bg-[var(--bg-primary)] transition-colors duration-300"
    >
      <GridCanvas className="opacity-50" />
      <ParticleCanvas particleCount={60} />

      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          poster="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=2070"
          className="w-full h-full object-cover opacity-30 mix-blend-overlay dark:opacity-20 dark:mix-blend-screen transition-all duration-700"
          aria-hidden="true"
        >
          {/* Ensure this path is correct in your public folder */}
          <source src="src/assets/video/Hero_homepage.mp4" type="video/mp4" />
        </video>

        <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-primary)]/95 via-[var(--bg-primary)]/80 to-[var(--bg-primary)]" />
        
        <motion.div 
          className="absolute w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none"
          style={{
            background: 'radial-gradient(circle, hsla(var(--hue-primary), 100%, 50%, 0.15) 0%, transparent 70%)',
            left: `${mousePosition.x * 100 - 30}%`,
            top: `${mousePosition.y * 100 - 30}%`,
          }}
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div 
          className="absolute w-[400px] h-[400px] rounded-full blur-[100px] pointer-events-none"
          style={{
            background: 'radial-gradient(circle, hsla(var(--hue-secondary), 75%, 50%, 0.1) 0%, transparent 70%)',
            right: `${(1 - mousePosition.x) * 100 - 20}%`,
            bottom: `${(1 - mousePosition.y) * 100 - 20}%`,
          }}
          animate={{
            scale: [1.1, 1, 1.1],
          }}
          transition={{ duration: 5, repeat: Infinity }}
        />
      </div>

      <FloatingElement className="absolute top-20 left-10 z-10 hidden lg:block" delay={0}>
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-primary)] shadow-lg">
          <Music className="text-[var(--color-primary)]" size={24} />
        </div>
      </FloatingElement>
      <FloatingElement className="absolute top-40 right-20 z-10 hidden lg:block" delay={0.5}>
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-primary)] shadow-lg">
          <Trophy className="text-[var(--color-secondary)]" size={24} />
        </div>
      </FloatingElement>
      <FloatingElement className="absolute bottom-40 left-20 z-10 hidden lg:block" delay={1}>
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-primary)] shadow-lg">
          <Cpu className="text-[var(--color-warning)]" size={24} />
        </div>
      </FloatingElement>

      <div className="relative z-10 w-full max-w-6xl mx-auto text-center flex flex-col items-center gap-8">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="space-y-6 max-w-4xl"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-3 py-2 px-5 rounded-full bg-[var(--bg-card)] border border-[var(--border-primary)] shadow-lg"
          >
            <PulsingDot color="bg-[var(--color-primary)]" />
            <span className="text-xs font-bold tracking-widest text-[var(--text-secondary)] uppercase">
              Live Events Happening Now
            </span>
            <span className="text-xs font-bold text-[var(--color-primary)]">2,450+</span>
          </motion.div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-[var(--text-primary)] leading-[1.05] tracking-tight">
            Discover{' '}
            <span className="relative inline-block">
              <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-primary)]">
                Amazing
              </span>
              <motion.span 
                className="absolute -inset-1 bg-gradient-to-r from-[var(--color-primary)]/20 to-[var(--color-secondary)]/20 blur-lg rounded-lg"
                animate={{ opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </span>
            {' '}Events
          </h1>

          <p className="text-[var(--text-secondary)] text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed">
            Find and book tickets for the best events happening near you. From underground concerts to tech workshops, 
            <span className="text-[var(--color-primary)] font-medium"> we have it all</span>.
          </p>

          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center pt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Link 
              to={isAuthenticated ? "/dashboard" : "/events"} 
              className="group relative px-10 py-4 rounded-xl text-base font-bold text-white overflow-hidden shadow-2xl shadow-[var(--shadow-primary)] transition-all transform hover:-translate-y-1"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-focus)] group-hover:from-[var(--color-primary-focus)] group-hover:to-[var(--color-primary)] transition-all duration-300" />
              <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="absolute inset-0 bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-primary)] bg-[length:200%_100%] animate-shimmer" />
              </span>
              <span className="relative flex items-center gap-2">
                {isAuthenticated ? "Go to Dashboard" : "Explore Events"}
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
            <Link 
              to="/auth/register" 
              className="group px-10 py-4 rounded-xl text-base font-bold text-[var(--text-primary)] border-2 border-[var(--border-primary)] hover:border-[var(--color-primary)] bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] transition-all flex items-center justify-center gap-2"
            >
              <Sparkles size={18} className="text-[var(--color-secondary)]" />
              Become an Organizer
            </Link>
          </motion.div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="w-full max-w-4xl mt-8"
        >
          <GlowingBorder>
            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-3 shadow-2xl">
              <form className="flex flex-col md:flex-row gap-2">
                <div className="flex-1 relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--color-primary)] transition-colors">
                    <Search size={20} />
                  </div>
                  <input
                    className="w-full bg-transparent border-none text-[var(--text-primary)] placeholder-[var(--text-muted)] pl-12 pr-4 py-3.5 focus:ring-0 text-base rounded-xl hover:bg-[var(--bg-hover)] transition-colors h-full outline-none"
                    placeholder="Search events, artists, venues..."
                    type="text"
                    aria-label="Search events"
                  />
                </div>
                <div className="hidden md:block w-px bg-[var(--border-primary)] my-2" />
                <div className="flex-1 relative group md:max-w-[200px]">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--color-primary)] transition-colors">
                    <Filter size={20} />
                  </div>
                  <select 
                    className="w-full bg-transparent border-none text-[var(--text-primary)] text-base pl-12 pr-10 py-3.5 focus:ring-0 rounded-xl hover:bg-[var(--bg-hover)] transition-colors h-full appearance-none cursor-pointer outline-none"
                    aria-label="Select category"
                  >
                    <option className="bg-[var(--bg-card)]">All Categories</option>
                    <option className="bg-[var(--bg-card)]">Music</option>
                    <option className="bg-[var(--bg-card)]">Technology</option>
                    <option className="bg-[var(--bg-card)]">Arts</option>
                    <option className="bg-[var(--bg-card)]">Sports</option>
                    <option className="bg-[var(--bg-card)]">Gaming</option>
                  </select>
                </div>
                <div className="hidden md:block w-px bg-[var(--border-primary)] my-2" />
                <div className="flex-1 relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--color-primary)] transition-colors">
                    <MapPin size={20} />
                  </div>
                  <input
                    className="w-full bg-transparent border-none text-[var(--text-primary)] placeholder-[var(--text-muted)] pl-12 pr-4 py-3.5 focus:ring-0 text-base rounded-xl hover:bg-[var(--bg-hover)] transition-colors h-full outline-none"
                    placeholder="City or Zip"
                    type="text"
                    aria-label="Location"
                  />
                </div>
                <button
                  className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-focus)] hover:from-[var(--color-primary-focus)] hover:to-[var(--color-primary)] text-white font-bold py-3.5 px-8 rounded-xl shadow-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
                  type="button"
                  aria-label="Search"
                >
                  <span className="hidden sm:inline">Search</span>
                  <ArrowRight size={20} />
                </button>
              </form>
            </div>
          </GlowingBorder>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-wrap justify-center gap-4 mt-4"
        >
          {[
            { label: 'Events Today', value: '340+', icon: Calendar },
            { label: 'Cities', value: '120+', icon: Globe },
            { label: 'Artists', value: '5K+', icon: Mic2 },
          ].map((stat, idx) => (
            <div 
              key={idx}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--bg-card)] border border-[var(--border-primary)] text-sm"
            >
              <stat.icon size={14} className="text-[var(--color-primary)]" />
              <span className="text-[var(--text-muted)]">{stat.label}:</span>
              <span className="text-[var(--text-primary)] font-bold">{stat.value}</span>
            </div>
          ))}
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="flex flex-col items-center gap-2 text-[var(--text-muted)]"
          >
            <span className="text-xs uppercase tracking-widest">Scroll to explore</span>
            <ChevronDown size={20} />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

const StatsSection = () => {
  return (
    <section className="py-16 bg-[var(--bg-secondary)] border-y border-[var(--border-primary)] relative overflow-hidden transition-colors duration-300">
      <WaveCanvas className="opacity-30" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { 
              label: "Total Events", 
              value: 50, 
              suffix: "k+", 
              icon: Calendar, 
              style: { 
                color: 'var(--color-primary)', 
                bg: 'hsla(var(--hue-primary), 100%, 43%, 0.1)',
                borderColor: 'hsla(var(--hue-primary), 100%, 43%, 0.3)'
              } 
            },
            { 
              label: "Active Users", 
              value: 10, 
              suffix: "k+", 
              icon: Users, 
              style: { 
                color: 'var(--color-secondary)', 
                bg: 'hsla(var(--hue-secondary), 75%, 45%, 0.1)',
                borderColor: 'hsla(var(--hue-secondary), 75%, 45%, 0.3)'
              } 
            },
            { 
              label: "Tickets Sold", 
              value: 2, 
              suffix: "M+", 
              icon: Ticket, 
              style: { 
                color: 'var(--color-warning)', 
                bg: 'var(--status-warning-light)',
                borderColor: 'var(--color-warning)'
              } 
            },
            { 
              label: "Cities Covered", 
              value: 120, 
              suffix: "+", 
              icon: Globe, 
              style: { 
                color: 'var(--color-success)', 
                bg: 'var(--status-success-light)',
                borderColor: 'var(--color-success)'
              } 
            },
          ].map((stat, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="text-center group p-6 rounded-2xl bg-[var(--bg-card)]/50 border border-[var(--border-primary)] hover:border-transparent transition-all duration-300 relative"
              style={{
                boxShadow: `0 0 0 0 transparent`
              }}
            >
              <div 
                className="absolute inset-0 rounded-2xl border border-transparent group-hover:border-current opacity-30 transition-colors duration-300 pointer-events-none"
                style={{ color: stat.style.color }}
              />

              <div 
                className="inline-flex items-center justify-center p-4 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300"
                style={{ 
                  color: stat.style.color,
                  backgroundColor: stat.style.bg 
                }}
              >
                <stat.icon size={28} />
              </div>
              
              <h3 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-2">
                <AnimatedCounter end={stat.value} suffix={stat.suffix} />
              </h3>
              
              <p className="text-[var(--text-muted)] text-sm font-medium uppercase tracking-wider">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const TrendingSection = () => {
  return (
    <section className="py-24 bg-[var(--bg-primary)] relative overflow-hidden transition-colors duration-300">
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, var(--text-muted) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#ef4444]/10 border border-[#ef4444]/20 mb-4">
              <TrendingUp className="text-[#ef4444]" size={14} />
              <span className="text-xs font-bold uppercase tracking-widest text-[#ef4444]">Trending Now</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-[var(--text-primary)] mb-4">
              Hot Events <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)]">This Week</span>
            </h2>
            <p className="text-[var(--text-secondary)] text-lg max-w-xl">
              Don't miss out on the most popular events everyone's talking about.
            </p>
          </div>
          <Link 
            to="/events?sort=trending" 
            className="group flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--bg-card)] border border-[var(--border-primary)] hover:border-[var(--color-primary)] text-[var(--text-primary)] font-medium transition-all hover:shadow-md"
          >
            View All Trending
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {TRENDING_EVENTS.map((event) => (
            <TrendingCard key={event.id} event={event} variants={fadeInUp} />
          ))}
        </motion.div>
      </div>
    </section>
  );
};

const FeaturesGridSection = () => {
  return (
    <section className="py-24 bg-[var(--bg-secondary)] relative overflow-hidden transition-colors duration-300">
      <GridCanvas className="opacity-20 text-[var(--text-muted)]" />
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[var(--color-primary)]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-center mb-16 max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-secondary)]/10 border border-[var(--color-secondary)]/20 mb-6 backdrop-blur-sm">
            <Cpu className="text-[var(--color-secondary)]" size={14} />
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-secondary)]">
              Powered by Innovation
            </span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-black text-[var(--text-primary)] mb-6 tracking-tight">
            Next-Gen <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)]">Event Technology</span>
          </h2>
          
          <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
            Experience the future of event management. We combine IoT hardware with cloud software to deliver seamless experiences for organizers and attendees alike.
          </p>
        </motion.div>

        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {FEATURES_GRID.map((feature, idx) => (
            <motion.div
              key={idx}
              variants={fadeInUp}
              className="group relative h-full"
            >
              <div className="relative h-full p-8 rounded-[2rem] bg-[var(--bg-card)] border border-[var(--border-primary)] hover:border-[var(--border-hover)] transition-all duration-300 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1">
                
                <div 
                  className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} 
                />

                <div className="flex justify-between items-start mb-6">
                  <div 
                    className="relative z-10 w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300"
                    style={{ background: `linear-gradient(135deg, ${feature.color}, transparent)` }}
                  >
                    <div className="absolute inset-0 rounded-2xl opacity-80" style={{ backgroundColor: feature.color }} />
                    <feature.icon size={26} className="relative z-20" />
                  </div>
                  
                  <span className="text-[var(--text-muted)]/20 text-4xl font-black select-none group-hover:text-[var(--text-muted)]/40 transition-colors">
                    0{idx + 1}
                  </span>
                </div>

                <div className="relative z-10">
                  <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3 group-hover:text-[var(--color-primary)] transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-[var(--text-secondary)] leading-relaxed text-sm">
                    {feature.description}
                  </p>
                </div>

                <div className="mt-6 pt-6 border-t border-[var(--border-primary)]/50 flex items-center text-[var(--color-primary)] opacity-0 transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                  <span className="text-sm font-bold mr-2">Learn more</span>
                  <ArrowRight size={16} />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

const CollectionsSection = () => {
  return (
    <div className="w-full py-24 bg-[var(--bg-primary)] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--color-primary)]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[var(--color-secondary)]/5 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="px-4 md:px-10 lg:px-40 flex justify-center relative z-10">
        <div className="max-w-[1200px] w-full flex flex-col">
          
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="flex flex-col md:flex-row items-end justify-between mb-12 gap-6"
          >
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 mb-4">
                <Sparkles className="text-[var(--color-primary)]" size={14} />
                <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-primary)]">Curated Collections</span>
              </div>
              <h3 className="text-3xl md:text-5xl font-bold text-[var(--text-primary)]">
                Explore <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)]">Dimensions</span>
              </h3>
            </div>
            <Link to="/events" className="group flex items-center gap-2 text-[var(--text-primary)] font-bold hover:text-[var(--color-primary)] transition-colors">
              View all collections
              <ArrowRight className="transition-transform group-hover:translate-x-1" size={20} />
            </Link>
          </motion.div>
          
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-4 h-auto md:h-[600px]"
          >
            
            <motion.div variants={fadeInLeft} className="md:col-span-2 md:row-span-2">
              <Link to="/events?cat=music" className="group relative rounded-[2rem] overflow-hidden border border-[var(--border-primary)] hover:border-[var(--color-primary)] transition-all block h-full min-h-[300px]">
                <img 
                  alt="Concert Crowd" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-60 group-hover:opacity-80"
                  src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2070&auto=format&fit=crop" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] via-transparent to-transparent opacity-90" />
                
                <div className="absolute bottom-0 left-0 p-8 w-full">
                  <div className="w-16 h-16 rounded-2xl bg-[#00A3DB]/20 backdrop-blur-md flex items-center justify-center mb-4 group-hover:bg-[#00A3DB] transition-colors duration-300">
                    <Music className="text-[#00A3DB] group-hover:text-white" size={32} />
                  </div>
                  <h4 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Music & Nightlife</h4>
                  <p className="text-[var(--text-secondary)] text-sm max-w-sm opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                    Experience the beat. From underground raves to sold-out stadium tours and intimate jazz nights.
                  </p>
                </div>
              </Link>
            </motion.div>

            <motion.div variants={fadeInRight} className="md:col-span-2 md:row-span-1">
              <Link to="/events?cat=sports" className="group relative rounded-[2rem] overflow-hidden border border-[var(--border-primary)] hover:border-[#A3D639] transition-all block h-full min-h-[200px]">
                <img 
                  alt="Stadium Atmosphere" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-60 group-hover:opacity-80"
                  src="https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=2070&auto=format&fit=crop" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] via-transparent to-transparent opacity-90" />
                
                <div className="absolute bottom-0 left-0 p-6 flex items-end justify-between w-full">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#A3D639]/20 backdrop-blur-md flex items-center justify-center group-hover:bg-[#A3D639] transition-colors duration-300">
                      <Trophy className="text-[#A3D639] group-hover:text-white" size={24} />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-[var(--text-primary)]">Sports League</h4>
                      <p className="text-xs text-[var(--text-secondary)]">Live Matches & E-Sports</p>
                    </div>
                  </div>
                  <ArrowUpRight className="text-[#A3D639] opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300" size={24} />
                </div>
              </Link>
            </motion.div>

            <motion.div variants={fadeInUp} className="md:col-span-1 md:row-span-1">
              <Link to="/events?cat=arts" className="group relative rounded-[2rem] overflow-hidden border border-[var(--border-primary)] hover:border-[#f59e0b] transition-all block h-full min-h-[150px] bg-[var(--bg-card)]">
                 <img 
                  alt="Art Gallery" 
                  className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-40 transition-opacity duration-500"
                  src="https://images.unsplash.com/photo-1547891654-e66ed7ebb968?q=80&w=2070&auto=format&fit=crop" 
                />
                
                <div className="absolute inset-0 flex items-center justify-center">
                  <Palette className="text-5xl text-[var(--text-muted)]/20 group-hover:text-[#f59e0b] group-hover:scale-110 transition-all duration-300" />
                </div>
                
                <div className="absolute bottom-0 left-0 p-5 w-full">
                  <div className="flex justify-between items-end w-full">
                    <div>
                        <h4 className="text-lg font-bold text-[var(--text-primary)]">Creative Arts</h4>
                        <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Exhibitions</p>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>

            <motion.div variants={fadeInUp} className="md:col-span-1 md:row-span-1">
              <Link to="/events?cat=technology" className="group relative rounded-[2rem] overflow-hidden border border-[var(--border-primary)] hover:border-[#8b5cf6] transition-all block h-full min-h-[150px] bg-[var(--bg-card)]">
                 <img 
                  alt="Tech Conference" 
                  className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-40 transition-opacity duration-500"
                  src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=2070&auto=format&fit=crop" 
                />

                <div className="absolute inset-0 flex items-center justify-center">
                  <Cpu className="text-5xl text-[var(--text-muted)]/20 group-hover:text-[#8b5cf6] group-hover:scale-110 transition-all duration-300" />
                </div>
                
                <div className="absolute bottom-0 left-0 p-5 w-full">
                  <div className="flex justify-between items-end w-full">
                     <div>
                        <h4 className="text-lg font-bold text-[var(--text-primary)]">Tech & Future</h4>
                        <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Workshops</p>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>

          </motion.div>
        </div>
      </div>
    </div>
  );
};

const HowItWorksSection = () => {
  return (
    <section className="relative mx-auto max-w-7xl px-6 py-24 md:px-12 overflow-visible">
      <div className="absolute top-0 right-0 -z-20 h-96 w-96 rounded-full bg-[var(--color-primary)]/10 opacity-50 blur-[100px]" />
      <div className="absolute bottom-0 left-0 -z-20 h-96 w-96 rounded-full bg-[var(--color-secondary)]/10 opacity-50 blur-[100px]" />

      <motion.div 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeInUp}
        className="flex justify-center mb-24"
      >
        <div className="text-center max-w-3xl relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--border-primary)] bg-[var(--bg-card)] mb-6 shadow-sm">
            <CheckCircle className="text-[var(--color-primary)]" size={16} />
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">How It Works</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-6 drop-shadow-sm">
            Plan Your Perfect{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)]">
              Event Experience
            </span>
          </h2>
          <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
            From discovery to entry, FlowGateX makes attending events seamless, secure, and enjoyable through our simple process.
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 relative">
        
        {TRIP_STEPS.map((step, index) => (
          <div key={index} className="relative">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className="group relative flex flex-col items-center text-center h-full"
            >
              <div className="relative z-10 flex h-full w-full flex-col items-center rounded-3xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-8 shadow-xl transition-all duration-300 hover:-translate-y-3 hover:shadow-2xl hover:border-[var(--color-primary)]/30">
                
                <div className={`absolute -top-5 ${step.bg} ${step.border} border-2 text-[var(--text-primary)] font-mono text-base font-bold w-12 h-12 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.1)] z-20 group-hover:scale-110 transition-all duration-300`}>
                  0{index + 1}
                </div>

                <div className={`mt-4 mb-6 flex h-20 w-20 items-center justify-center rounded-2xl ${step.bg} shadow-inner transition-all duration-500 group-hover:rotate-6 group-hover:scale-110 ring-1 ring-inset ring-white/10`}>
                  <step.icon className={`${step.color} drop-shadow-md`} size={32} />
                </div>

                <h3 className="mb-3 text-xl font-bold text-[var(--text-primary)]">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                  {step.description}
                </p>
              </div>
            </motion.div>

            {/* CURVED ARROW LOGIC */}
            {index !== TRIP_STEPS.length - 1 && (
              <div className="hidden lg:block absolute top-1/2 -right-[50px] w-[100px] h-[60px] z-0 -translate-y-1/2 pointer-events-none">
                <svg
                  className="w-full h-full drop-shadow-[0_0_8px_rgba(0,163,219,0.5)] dark:drop-shadow-[0_0_10px_rgba(0,163,219,0.8)]"
                  viewBox="0 0 100 60"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M10 20 C 30 5, 70 5, 90 20"
                    stroke="url(#arrow-gradient)"
                    strokeWidth="3"
                    strokeDasharray="6 6"
                    strokeLinecap="round"
                    className="opacity-70"
                  >
                    <animate 
                      attributeName="stroke-dashoffset" 
                      from="24" 
                      to="0" 
                      dur="1.5s" 
                      repeatCount="indefinite" 
                    />
                  </path>
                  
                  <path
                    d="M85 15 L 90 20 L 85 25"
                    stroke="var(--color-primary)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  
                  <defs>
                    <linearGradient id="arrow-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="var(--text-muted)" stopOpacity="0.3" />
                      <stop offset="50%" stopColor="var(--color-primary)" stopOpacity="1" />
                      <stop offset="100%" stopColor="var(--color-secondary)" stopOpacity="1" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            )}
            
            {/* Mobile/Tablet Connector (Vertical) */}
            {index !== TRIP_STEPS.length - 1 && (
              <div className="lg:hidden absolute left-1/2 bottom-[-32px] w-0.5 h-8 bg-gradient-to-b from-[var(--border-primary)] to-transparent -translate-x-1/2" />
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

const CaseStudySection = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="w-full bg-[var(--bg-primary)] py-24 relative overflow-hidden transition-colors duration-300">
      
      <VideoModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        // Using a sample video URL (replace with actual asset)
        videoSrc="src/assets/video/watch_story_homepage.mp4" 
      />

      <div className="absolute inset-0 bg-[var(--bg-secondary)] skew-y-2 transform origin-top-left scale-110 -z-10" />

      <div className="px-4 md:px-10 lg:px-40 flex justify-center relative z-10">
        <div className="max-w-[1200px] w-full grid lg:grid-cols-2 gap-16 items-center">
          
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInLeft}
            className="flex flex-col gap-6"
          >
            <div className="flex items-center gap-3">
              <PulsingDot color="bg-[var(--color-primary)]" />
              <span className="text-[var(--color-primary)] font-bold uppercase tracking-widest text-sm">Creators in Motion</span>
            </div>
            
            <h2 className="text-4xl lg:text-5xl font-bold text-[var(--text-primary)] leading-tight">
              Empowering the voices that{' '}
              <span className="relative inline-block text-[var(--color-primary)]">
                move the world.
                <svg className="absolute w-full h-3 -bottom-1 left-0 text-[var(--color-secondary)] opacity-80" viewBox="0 0 100 10" preserveAspectRatio="none">
                  <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="4" fill="none" />
                </svg>
              </span>
            </h2>
            
            <p className="text-[var(--text-secondary)] text-lg leading-relaxed">
              See how Global Sound Collective scaled their festivals from 5,000 to 50,000 attendees using FlowGateX's enterprise tools.
            </p>

            <div className="flex gap-8 pt-4 border-l-4 border-[var(--color-primary)] pl-6 my-4">
              <div className="flex flex-col">
                <span className="text-4xl font-bold text-[var(--text-primary)]">
                  <AnimatedCounter end={400} suffix="%" />
                </span>
                <span className="text-[var(--text-muted)] text-sm font-medium">Revenue Growth</span>
              </div>
              <div className="w-px h-16 bg-[var(--border-primary)]" />
              <div className="flex flex-col">
                <span className="text-4xl font-bold text-[var(--text-primary)]">
                  <AnimatedCounter end={30} suffix="s" />
                </span>
                <span className="text-[var(--text-muted)] text-sm font-medium">Avg. Check-in</span>
              </div>
              <div className="w-px h-16 bg-[var(--border-primary)]" />
              <div className="flex flex-col">
                <span className="text-4xl font-bold text-[var(--text-primary)]">
                  <AnimatedCounter end={99} suffix="%" />
                </span>
                <span className="text-[var(--text-muted)] text-sm font-medium">Satisfaction</span>
              </div>
            </div>

            <Link 
              to="/case-studies" 
              className="mt-6 w-fit group relative px-8 py-4 rounded-tl-2xl rounded-br-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:-translate-y-1 transition-all duration-300 overflow-hidden flex items-center gap-3"
            >
              <span className="relative z-10">Read the full case study</span>
              <ArrowRight size={20} className="relative z-10 group-hover:translate-x-1 transition-transform" />
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </Link>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInRight}
            className="relative rounded-[2rem] overflow-hidden shadow-2xl shadow-black/20 border border-[var(--border-primary)] group cursor-pointer aspect-video"
            onClick={() => setIsModalOpen(true)}
          >
            <img 
              alt="Video Thumbnail"
              className="w-full h-full object-cover opacity-90 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700"
              src="https://images.unsplash.com/photo-1459749411177-287ce3288789?q=80&w=2069" 
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-300" />
            
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="relative"
              >
                <div className="absolute inset-0 rounded-full bg-[var(--color-primary)]/40 animate-ping" style={{ animationDuration: '2s' }} />
                
                <div className="relative size-24 rounded-full bg-black/30 backdrop-blur-sm border border-white/40 flex items-center justify-center group-hover:bg-black/50 transition-colors">
                  <div className="size-16 rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[#007AA3] text-white flex items-center justify-center shadow-lg shadow-[var(--color-primary)]/30 pl-1">
                    <Play size={28} fill="currentColor" />
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="absolute bottom-6 left-6 z-10">
              <p className="text-white font-bold text-xl drop-shadow-md">Global Sound Collective</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <p className="text-gray-200 text-sm font-medium">Scaling Enterprise Events</p>
              </div>
            </div>

            <div className="absolute bottom-6 right-6 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-white text-xs font-bold uppercase tracking-wider z-10">
              3:45 • Watch Story
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

const ReviewSection = () => {
  return (
    <section className="relative mx-auto max-w-7xl px-6 py-20 md:px-12 overflow-hidden">
      <div className="absolute top-0 right-0 -z-10 h-[500px] w-[500px] rounded-full bg-[var(--color-primary)] opacity-5 blur-[100px]" />
      <div className="absolute bottom-0 left-0 -z-10 h-[500px] w-[500px] rounded-full bg-[var(--color-secondary)] opacity-5 blur-[100px]" />

      <motion.div 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeInUp}
        className="mb-14 flex flex-col md:flex-row md:items-end justify-between gap-6"
      >
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-card)] border border-[var(--border-primary)] mb-4 w-fit shadow-sm">
            <Star className="text-[var(--color-warning)] fill-[var(--color-warning)]" size={14} />
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Testimonials</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-4 leading-tight">
            Trusted by the <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)]">Best</span>
          </h2>
          <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
            Discover why thousands of event organizers and attendees trust FlowGateX for their most important moments.
          </p>
        </div>
        
        <Link
          to="/reviews"
          className="group flex items-center gap-2 px-6 py-3 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all backdrop-blur-sm shadow-sm hover:shadow-md"
        >
          <span>See All Reviews</span>
          <ArrowRight className="group-hover:translate-x-1 transition-transform" size={18} />
        </Link>
      </motion.div>

      <motion.div 
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="no-scrollbar flex gap-8 overflow-x-auto pb-12 pt-4 -mx-6 px-6 snap-x snap-mandatory scroll-smooth"
      >
        {REVIEWS.map((review) => (
          <div key={review.id} className="snap-center">
            <ReviewCard data={review} />
          </div>
        ))}
      </motion.div>
    </section>
  );
};

const NewsletterSection = () => {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubscribed(true);
      setTimeout(() => setIsSubscribed(false), 3000);
      setEmail('');
    }
  };

  return (
    <section className="py-20 bg-[var(--bg-secondary)] relative overflow-hidden">
      <ParticleCanvas particleCount={30} className="opacity-30" />

      <div className="max-w-4xl mx-auto px-4 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00A3DB]/10 border border-[#00A3DB]/20 mb-6">
            <Bell className="text-[#00A3DB]" size={14} />
            <span className="text-xs font-bold uppercase tracking-widest text-[#00A3DB]">Stay Updated</span>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-4">
            Never Miss an Event
          </h2>
          <p className="text-[var(--text-secondary)] text-lg mb-8 max-w-xl mx-auto">
            Subscribe to our newsletter and get personalized event recommendations delivered to your inbox.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
            <div className="flex-1 relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-6 py-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-primary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[#00A3DB] focus:ring-2 focus:ring-[#00A3DB]/20 outline-none transition-all"
                aria-label="Email address"
              />
            </div>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-[#00A3DB] to-[#007AA3] text-white font-bold shadow-lg shadow-[#00A3DB]/25 hover:shadow-xl transition-all flex items-center justify-center gap-2"
            >
              {isSubscribed ? (
                <>
                  <CheckCircle size={18} />
                  Subscribed!
                </>
              ) : (
                <>
                  Subscribe
                  <ArrowRight size={18} />
                </>
              )}
            </motion.button>
          </form>

          <p className="text-xs text-[var(--text-muted)] mt-4">
            No spam, unsubscribe anytime. Read our{' '}
            <Link to="/privacy" className="text-[#00A3DB] hover:underline">Privacy Policy</Link>
          </p>
        </motion.div>
      </div>
    </section>
  );
};

const CTASection = () => {
  return (
    <section className="py-24 relative overflow-hidden bg-[var(--bg-primary)]">
      <div className="absolute inset-0">
        <GridCanvas className="opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#00A3DB]/10 via-transparent to-[#A3D639]/10" />
      </div>

      <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <motion.div
            animate={{ 
              y: [0, -10, 0],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ duration: 3, repeat: Infinity }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#00A3DB] to-[#A3D639] mb-8 shadow-2xl shadow-[#00A3DB]/30"
          >
            <Zap size={40} className="text-white" />
          </motion.div>

          <h2 className="text-4xl md:text-6xl font-black text-[var(--text-primary)] mb-6">
            Ready to Host Your{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00A3DB] to-[#A3D639]">
              Event?
            </span>
          </h2>
          <p className="text-xl text-[var(--text-secondary)] mb-10 max-w-2xl mx-auto">
            Join thousands of organizers who use FlowGateX to manage, promote, and sell out their events. Start your journey today.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              to="/events/create" 
              className="group relative px-12 py-5 rounded-xl text-lg font-bold text-white overflow-hidden shadow-2xl shadow-[#00A3DB]/30 transition-all transform hover:-translate-y-1"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-[#00A3DB] to-[#A3D639]" />
              <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="absolute inset-0 bg-gradient-to-r from-[#A3D639] to-[#00A3DB]" />
              </span>
              <span className="relative flex items-center justify-center gap-2">
                <Rocket size={20} />
                Create an Event Now
              </span>
            </Link>
            <Link 
              to="/contact" 
              className="px-12 py-5 rounded-xl text-lg font-bold text-[var(--text-primary)] border-2 border-[var(--border-primary)] hover:border-[#00A3DB] bg-[var(--bg-card)] transition-all flex items-center justify-center gap-2"
            >
              <Headphones size={20} className="text-[#00A3DB]" />
              Contact Sales
            </Link>
          </div>

        </motion.div>
      </div>
    </section>
  );
};

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default function HomePage() {
  return (
    <div className="bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans min-h-screen selection:bg-[#00A3DB] selection:text-white">
      {/* Add custom styles for animations */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .animate-shimmer {
          animation: shimmer 3s linear infinite;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>

      {/* Page Sections */}
      <HeroSection />
      <StatsSection />
      <TrendingSection />
      <FeaturesGridSection />
      <CollectionsSection />
      <HowItWorksSection />
      <CaseStudySection />
      <ReviewSection />
      <NewsletterSection />
      <CTASection />
    </div>
  );
}