import React, { useRef, useEffect } from 'react';

// --- Types ---
interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    opacity: number;
    hue: number;
}

// --- Particle Canvas ---
export const ParticleCanvas: React.FC<{ className?: string; particleCount?: number }> = ({
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

// --- Grid Canvas ---
export const GridCanvas: React.FC<{ className?: string }> = ({ className = '' }) => {
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

// --- Wave Canvas ---
export const WaveCanvas: React.FC<{ className?: string }> = ({ className = '' }) => {
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