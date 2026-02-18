import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mail, Lock, User, MapPin, Calendar, ArrowRight, ArrowLeft,
    AlertCircle, Loader2, Sparkles, Eye, EyeOff, ShieldCheck,
    CheckCircle2, Sun, Moon, Activity, ChevronDown, RefreshCw, Music, Trophy
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { sendEmailVerification } from 'firebase/auth';
import confetti from 'canvas-confetti';

import { GridCanvas, ParticleCanvas } from '@/features/home/components/canvas/CanvasEffects';
import { FloatingElement } from '@/features/home/components/ui/SharedComponents';

import { registerWithEmail } from '@/features/auth/services/authService';
import { auth, firebaseEnabled } from '@/services/firebase';
import { logger } from '@/lib/logger';
import { UserRole } from '@/lib/constants';
import { useAuthStore, useThemeStore, type AuthUser } from '@/store/zustand/stores';
import { ROLE_DASHBOARDS } from '@/routes/routes.config';
import PromoPanel from '@/features/auth/components/PromoPanel';

// =============================================================================
// UTILS
// =============================================================================

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// =============================================================================
// CONFIG
// =============================================================================

const MAX_STEPS = 4;

// =============================================================================
// ZOD SCHEMAS
// =============================================================================

const step1Schema = z.object({
    firstName: z.string().min(2, 'First name is too short'),
    lastName: z.string().min(2, 'Last name is too short'),
    email: z.string().email('Invalid email address'),
});

const step2Schema = z.object({
    gender: z.enum(['male', 'female', 'non-binary', 'prefer-not-to-say'] as const, {
        errorMap: () => ({ message: 'Select gender' }),
    }),
    dob: z.string().refine(
        (val) => {
            const date = new Date(val);
            if (isNaN(date.getTime())) return false;
            const today = new Date();
            if (date >= today) return false;
            let age = today.getFullYear() - date.getFullYear();
            const m = today.getMonth() - date.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < date.getDate())) age--;
            return age >= 13;
        },
        'You must be at least 13 years old',
    ),
    location: z.string().min(3, 'City/Location is required'),
    role: z.enum(['attendee', 'organizer', 'admin', 'superadmin'] as const, {
        errorMap: () => ({ message: 'Select a role' }),
    }),
});

const registrationSchema = step1Schema.merge(step2Schema).merge(
    z.object({
        password: z
            .string()
            .min(8, 'Min 8 chars')
            .regex(/[A-Z]/, 'Needs uppercase')
            .regex(/[0-9]/, 'Needs number')
            .regex(/[^A-Za-z0-9]/, 'Needs special char'),
        confirmPassword: z.string(),
        terms: z.boolean().refine((val) => val === true, {
            message: 'You must agree to the terms',
        }),
    }),
).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

// =============================================================================
// ROLE MAPPING: Form values → UserRole enum
// =============================================================================

function toUserRole(role: string): UserRole {
    switch (role) {
        case 'superadmin':
            return UserRole.SUPER_ADMIN;
        case 'admin':
            return UserRole.ADMIN;
        case 'organizer':
            return UserRole.ORGANIZER;
        case 'attendee':
        default:
            return UserRole.USER;
    }
}

// =============================================================================
// HELPER: Scroll to first error in a container
// =============================================================================

function scrollToFirstError(containerRef: React.RefObject<HTMLDivElement | null>) {
    if (!containerRef.current) return;
    const firstError = containerRef.current.querySelector('[role="alert"]');
    if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const errorId = firstError.getAttribute('id');
        if (errorId) {
            const inputId = errorId.replace('-error', '');
            const input = containerRef.current.querySelector(`#${inputId}`) as HTMLElement | null;
            input?.focus();
        }
    }
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

const InputField = ({
    label,
    error,
    icon: Icon,
    type = 'text',
    className,
    registration,
    ...props
}: {
    label?: string;
    error?: { message?: string };
    icon?: React.ElementType;
    type?: string;
    className?: string;
    registration?: object;
    [key: string]: unknown;
}) => {
    const inputId = props.id as string | undefined;
    const errorId = inputId ? `${inputId}-error` : undefined;

    return (
        <div className={cn('space-y-1.5', className)}>
            {label && (
                <label
                    className="block text-xs font-semibold text-[var(--text-secondary)] ml-1"
                    htmlFor={inputId}
                >
                    {label}
                </label>
            )}
            <div className="relative group">
                {Icon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--color-primary)] transition-colors pointer-events-none">
                        <Icon size={18} aria-hidden="true" />
                    </div>
                )}
                <input
                    type={type}
                    className={cn(
                        'register-input login-primary-input w-full',
                        Icon && 'register-input--icon',
                        error && 'register-input--error',
                    )}
                    aria-invalid={!!error}
                    aria-describedby={error && errorId ? errorId : undefined}
                    {...registration}
                    {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
                />
            </div>
            {error && (
                <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    id={errorId}
                    className="text-red-400 text-xs flex items-center gap-1 pl-1"
                    role="alert"
                    aria-live="assertive"
                >
                    <AlertCircle size={12} aria-hidden="true" /> {error.message}
                </motion.p>
            )}
        </div>
    );
};

const SelectField = ({
    label,
    error,
    options,
    registration,
    ...props
}: {
    label?: string;
    error?: { message?: string };
    options: { value: string; label: string }[];
    registration?: object;
    [key: string]: unknown;
}) => {
    const selectId = props.id as string | undefined;
    const errorId = selectId ? `${selectId}-error` : undefined;

    return (
        <div className="space-y-1.5">
            {label && (
                <label
                    className="block text-xs font-semibold text-[var(--text-secondary)] ml-1"
                    htmlFor={selectId}
                >
                    {label}
                </label>
            )}
            <div className="relative">
                <select
                    className={cn(
                        'register-input register-input--select w-full appearance-none',
                        error && 'register-input--error',
                        'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-1',
                    )}
                    aria-invalid={!!error}
                    aria-describedby={error && errorId ? errorId : undefined}
                    {...registration}
                    {...(props as React.SelectHTMLAttributes<HTMLSelectElement>)}
                >
                    <option value="" disabled>
                        Select {label}
                    </option>
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-muted)]">
                    <ChevronDown size={16} aria-hidden="true" />
                </div>
            </div>
            {error && (
                <p
                    id={errorId}
                    className="text-red-400 text-xs pl-1"
                    role="alert"
                    aria-live="assertive"
                >
                    {error.message}
                </p>
            )}
        </div>
    );
};

const PasswordStrengthMeter = ({ password }: { password: string }) => {
    const checks = [
        { re: /.{8,}/, label: '8+ Chars' },
        { re: /[A-Z]/, label: 'Uppercase' },
        { re: /[0-9]/, label: 'Number' },
        { re: /[^A-Za-z0-9]/, label: 'Special' },
    ];
    const strength = checks.filter((c) => c.re.test(password)).length;

    const strengthClass =
        strength === 0
            ? ''
            : strength === 1
                ? 'register-pw-very-weak'
                : strength === 2
                    ? 'register-pw-weak'
                    : strength === 3
                        ? 'register-pw-strong'
                        : 'register-pw-very-strong';

    const strengthLabel =
        strength === 0
            ? 'Enter Password'
            : strength <= 2
                ? 'Weak'
                : strength === 3
                    ? 'Good'
                    : 'Strong';

    return (
        <div className="space-y-2 mt-2" aria-label="Password strength indicator">
            <div className="register-pw-bar flex gap-1 h-1">
                {[1, 2, 3, 4].map((level) => (
                    <div
                        key={level}
                        className={cn(
                            'register-pw-bar-seg flex-1 rounded-full transition-all duration-300',
                            'bg-[var(--border-primary)]',
                            strength >= level && strengthClass,
                        )}
                    />
                ))}
            </div>
            <p
                className={cn(
                    'text-xs font-medium transition-colors text-right',
                    strength === 0 ? 'text-[var(--text-muted)]' : strengthClass,
                )}
                aria-live="polite"
            >
                {strengthLabel}
            </p>
        </div>
    );
};

function ReviewRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
    return (
        <div className="flex items-center gap-3 text-sm">
            <Icon size={14} className="shrink-0" style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
            <span className="text-[var(--text-muted)] w-24 shrink-0">{label}</span>
            <span className="text-[var(--text-primary)] font-medium truncate">{value}</span>
        </div>
    );
}

function fireConfetti() {
    const duration = 2500;
    const end = Date.now() + duration;
    const colors = ['#00A3DB', '#33B8E5', '#A3D639', '#ffffff'];
    (function frame() {
        confetti({
            particleCount: 4,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.7 },
            colors,
        });
        confetti({
            particleCount: 4,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.7 },
            colors,
        });
        if (Date.now() < end) requestAnimationFrame(frame);
    })();
}

// =============================================================================
// FIREBASE ERROR MESSAGES
// =============================================================================

const FIREBASE_ERROR_MAP: Record<string, string> = {
    'auth/email-already-in-use':
        'An account with this email already exists. Try signing in instead.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/weak-password':
        'Password is too weak. Please use at least 8 characters.',
    'auth/network-request-failed':
        'Network error. Please check your internet connection.',
    'auth/too-many-requests':
        'Too many requests. Please wait a moment and try again.',
    'auth/operation-not-allowed':
        'Email/password sign-up is not enabled in Firebase Console.',
    'firebase/not-configured':
        'Firebase is not configured. Please set up your .env.local with valid Firebase credentials.',
};

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default function RegisterPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const setUser = useAuthStore((s) => s.setUser);
    const { isDarkMode, toggleTheme } = useThemeStore();

    const [step, setStep] = useState(1);
    const [direction, setDirection] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [registrationComplete, setRegistrationComplete] = useState(false);
    const [registeredEmail, setRegisteredEmail] = useState('');
    const [registeredRole, setRegisteredRole] = useState('');
    const [formError, setFormError] = useState<string | null>(null);
    const [resendLoading, setResendLoading] = useState(false);
    const [resendSuccess, setResendSuccess] = useState(false);

    const formContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const root = document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(isDarkMode ? 'dark' : 'light');
    }, [isDarkMode]);

    const {
        register,
        handleSubmit,
        control,
        trigger,
        watch,
        setValue,
        formState: { errors },
    } = useForm<RegistrationFormData>({
        resolver: zodResolver(registrationSchema),
        mode: 'onChange',
        defaultValues: {
            firstName: '',
            lastName: '',
            email: '',
            gender: undefined,
            dob: '',
            location: '',
            role: undefined,
            password: '',
            confirmPassword: '',
            terms: false,
        },
    });

    useEffect(() => {
        if (location.state && (location.state as { email?: string }).email) {
            setValue('email', (location.state as { email: string }).email);
        }
        const roleParam = searchParams.get('role');
        if (roleParam === 'organizer' || roleParam === 'attendee') {
            setValue('role', roleParam);
        }
    }, [location.state, setValue, searchParams]);

    const passwordValue = useWatch({ control, name: 'password' });
    const emailValue = useWatch({ control, name: 'email' });

    useEffect(() => {
        const errorKeys = Object.keys(errors);
        if (errorKeys.length > 0) {
            const timer = setTimeout(() => scrollToFirstError(formContainerRef), 100);
            return () => clearTimeout(timer);
        }
        return undefined;
    }, [errors]);

    const nextStep = useCallback(async () => {
        setFormError(null);
        let isValid = false;
        if (step === 1)
            isValid = await trigger(['firstName', 'lastName', 'email']);
        if (step === 2)
            isValid = await trigger(['gender', 'dob', 'location', 'role']);
        if (step === 3)
            isValid = await trigger(['password', 'confirmPassword', 'terms']);

        if (isValid) {
            setDirection(1);
            setStep((s) => s + 1);
        } else {
            setTimeout(() => scrollToFirstError(formContainerRef), 100);
        }
    }, [step, trigger]);

    const prevStep = useCallback(() => {
        setFormError(null);
        setDirection(-1);
        setStep((s) => s - 1);
    }, []);

    const goToStep = useCallback(
        (targetStep: number) => {
            if (targetStep < step) {
                setFormError(null);
                setDirection(targetStep < step ? -1 : 1);
                setStep(targetStep);
            }
        },
        [step],
    );

    // =========================================================================
    // SUBMIT — delegates to authService.registerWithEmail
    // =========================================================================

    const onSubmit = useCallback(
        async (data: RegistrationFormData) => {
            setIsLoading(true);
            setFormError(null);
            try {
                const displayName = `${data.firstName.trim()} ${data.lastName.trim()}`;
                const userRole = toUserRole(data.role);

                // Delegate registration to authService (handles Firebase Auth +
                // Firestore document creation + email verification)
                const firebaseUser = await registerWithEmail({
                    email: data.email.trim(),
                    password: data.password,
                    displayName,
                    firstName: data.firstName.trim(),
                    lastName: data.lastName.trim(),
                    role: userRole,
                    dob: data.dob || undefined,
                    gender: data.gender || undefined,
                    location: data.location || undefined,
                    terms: data.terms,
                    consents: {
                        terms: data.terms,
                        marketing: false,
                        whatsapp: false,
                        liveLocation: false,
                    },
                });

                logger.log('✅ Registration successful:', firebaseUser.uid);

                // Update local auth store
                const authUser: AuthUser = {
                    uid: firebaseUser.uid,
                    email: data.email.trim(),
                    displayName,
                    firstName: data.firstName.trim(),
                    lastName: data.lastName.trim(),
                    photoURL: null,
                    phoneNumber: null,
                    role: userRole,
                    emailVerified: false,
                    dob: data.dob || null,
                    gender: data.gender || null,
                    consents: {
                        terms: data.terms,
                        marketing: false,
                        whatsapp: false,
                        liveLocation: false,
                    },
                };
                setUser(authUser);

                setRegisteredEmail(data.email.trim());
                setRegisteredRole(data.role);
                setRegistrationComplete(true);

                fireConfetti();
            } catch (error: unknown) {
                const err = error as { code?: string; message?: string };
                logger.error('❌ Registration failed:', err);

                setFormError(
                    FIREBASE_ERROR_MAP[err.code || ''] ||
                    err.message ||
                    'Registration failed. Please try again.',
                );
            } finally {
                setIsLoading(false);
            }
        },
        [setUser],
    );

    const handleResendVerification = useCallback(async () => {
        if (!auth?.currentUser) return;
        setResendLoading(true);
        setResendSuccess(false);
        try {
            await sendEmailVerification(auth.currentUser, {
                url: `${window.location.origin}/login?verified=true`,
                handleCodeInApp: false,
            });
            setResendSuccess(true);
            logger.log('📧 Verification email re-sent');
        } catch (err) {
            logger.error('❌ Failed to resend verification email:', err);
        } finally {
            setResendLoading(false);
        }
    }, []);

    const goToDashboard = useCallback(() => {
        const userRole = toUserRole(registeredRole);
        const dashboardPath = ROLE_DASHBOARDS[userRole] || '/dashboard';
        navigate(dashboardPath);
    }, [registeredRole, navigate]);

    const variants = {
        enter: (dir: number) => ({ x: dir > 0 ? 50 : -50, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (dir: number) => ({ x: dir > 0 ? -50 : 50, opacity: 0 }),
    };

    const formValues = watch();

    return (
        <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[var(--bg-base)] text-[var(--text-primary)] font-sans relative">
            {/* Brand Logo */}
            <Link
                to="/"
                className="login-brand-logo fixed top-4 left-4 z-50 pointer-events-auto"
                aria-label="FlowGateX Home"
            >
                <div className="logo-icon">
                    <Activity size={18} className="text-white" aria-hidden="true" />
                </div>
                <span className="logo-text">FlowGateX</span>
            </Link>

            {/* Theme Switcher */}
            <button
                type="button"
                onClick={toggleTheme}
                className="login-theme-toggle fixed top-4 right-4 z-50 pointer-events-auto"
                aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
                <AnimatePresence mode="wait" initial={false}>
                    {isDarkMode ? (
                        <motion.div
                            key="sun"
                            initial={{ rotate: -90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: 90, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Sun size={20} />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="moon"
                            initial={{ rotate: 90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: -90, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Moon size={20} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </button>

            {/* ============ LEFT SIDE — REGISTRATION FORM ============ */}
            <div
                ref={formContainerRef}
                className="w-full lg:w-1/2 bg-[var(--bg-surface)] min-h-screen flex flex-col px-6 pt-20 pb-6 sm:px-10 sm:pt-20 sm:pb-8 overflow-y-auto transition-colors duration-300 relative"
            >
                {/* Background Effects */}
                <GridCanvas className="opacity-20 pointer-events-none absolute inset-0 sm:opacity-30 z-0" />
                <ParticleCanvas particleCount={30} className="pointer-events-none absolute inset-0 z-0" />

                {/* Floating Decor */}
                <FloatingElement className="absolute top-32 left-8 hidden xl:block opacity-50 pointer-events-none z-0" delay={0.5}>
                    <Music className="text-[var(--color-primary)] opacity-40 rotate-12" size={32} />
                </FloatingElement>

                <FloatingElement className="absolute bottom-20 right-10 hidden xl:block opacity-50 pointer-events-none z-0" delay={1.2}>
                    <Trophy className="text-[var(--color-secondary)] opacity-40 -rotate-6" size={28} />
                </FloatingElement>

                {/* Floating orbs */}
                <div className="login-orb login-orb-1 pointer-events-none" aria-hidden="true" />
                <div className="login-orb login-orb-2 pointer-events-none" aria-hidden="true" />

                <motion.div
                    className="w-full max-w-[440px] my-auto mx-auto space-y-5 relative z-10"
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                    {/* Firebase warning */}
                    {!firebaseEnabled && !registrationComplete && (
                        <div
                            className="flex items-start gap-2.5 rounded-xl border border-orange-500/30 bg-orange-500/10 px-4 py-3 text-sm text-orange-400"
                            role="alert"
                        >
                            <AlertCircle className="size-5 shrink-0 mt-0.5" aria-hidden="true" />
                            <span>
                                Firebase is not configured. Registration requires valid Firebase
                                credentials in <code className="font-mono">.env.local</code>.
                            </span>
                        </div>
                    )}

                    {/* Welcome Header */}
                    <div className="text-center mb-6">
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)]">
                            Welcome to FlowGateX
                        </h1>
                        <p className="text-[var(--text-secondary)] mt-2">
                            Join the future of event management
                        </p>
                    </div>

                    {/* Progress Bar */}
                    {!registrationComplete && (
                        <div className="register-step-progress" aria-label={`Step ${step} of ${MAX_STEPS}`}>
                            <div className="flex justify-between mb-2">
                                <span className="text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>
                                    Step {step} of {MAX_STEPS}
                                </span>
                                <span className="text-sm text-[var(--text-muted)]">
                                    {Math.round((step / MAX_STEPS) * 100)}%
                                </span>
                            </div>
                            <div className="register-step-bar">
                                <motion.div
                                    className="register-step-bar-fill"
                                    initial={{ width: 0 }}
                                    animate={{
                                        width: `${(step / MAX_STEPS) * 100}%`,
                                    }}
                                    transition={{ duration: 0.5, ease: 'circOut' }}
                                />
                            </div>
                            <ol className="register-step-list" aria-label="Registration steps">
                                {[
                                    { num: 1, label: 'Identity' },
                                    { num: 2, label: 'Profile' },
                                    { num: 3, label: 'Security' },
                                    { num: 4, label: 'Review' },
                                ].map(({ num, label }) => {
                                    const isCompleted = step > num;
                                    const isCurrent = step === num;

                                    return (
                                        <li
                                            key={num}
                                            className={cn(
                                                'register-step-item',
                                                isCurrent && 'register-step-item--active',
                                                isCompleted && 'register-step-item--done',
                                            )}
                                        >
                                            {isCompleted ? (
                                                <button
                                                    type="button"
                                                    onClick={() => goToStep(num)}
                                                    className="register-step-dot cursor-pointer hover:ring-2 hover:ring-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] rounded-full transition-all"
                                                    aria-label={`Go back to step ${num}: ${label}`}
                                                    title={`Go back to ${label}`}
                                                >
                                                    <CheckCircle2 size={12} aria-hidden="true" />
                                                </button>
                                            ) : (
                                                <span
                                                    className="register-step-dot"
                                                    aria-current={isCurrent ? 'step' : undefined}
                                                >
                                                    {num}
                                                </span>
                                            )}
                                            <span className="register-step-label hidden sm:inline">{label}</span>
                                        </li>
                                    );
                                })}
                            </ol>
                        </div>
                    )}

                    {/* Global form error */}
                    <AnimatePresence>
                        {formError && !registrationComplete && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
                                role="alert"
                                aria-live="assertive"
                            >
                                <AlertCircle className="size-5 shrink-0 mt-0.5" aria-hidden="true" />
                                <span>{formError}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* SUCCESS SCREEN */}
                    {registrationComplete ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                            className="flex flex-col items-center justify-center text-center space-y-6 py-8"
                            role="status"
                            aria-live="polite"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{
                                    type: 'spring',
                                    stiffness: 300,
                                    damping: 20,
                                    delay: 0.2,
                                }}
                                className="register-confirmation-icon"
                            >
                                <CheckCircle2 size={48} />
                            </motion.div>

                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                                    Welcome to FlowGateX!
                                </h2>
                                <p className="text-[var(--text-secondary)] text-sm max-w-sm">
                                    Your{' '}
                                    <span className="font-semibold capitalize" style={{ color: 'var(--color-primary)' }}>
                                        {registeredRole === 'attendee' ? 'attendee' : registeredRole}
                                    </span>{' '}
                                    account has been created successfully. A verification email
                                    has been sent to{' '}
                                    <span className="font-semibold text-[var(--text-primary)]">
                                        {registeredEmail}
                                    </span>
                                    .
                                </p>
                            </div>

                            <div className="register-confirmation-card max-w-sm">
                                <Mail
                                    size={18}
                                    className="shrink-0 mt-0.5"
                                    style={{ color: 'var(--color-primary)' }}
                                    aria-hidden="true"
                                />
                                <div className="flex-1 space-y-2">
                                    <p className="text-sm text-[var(--text-secondary)]">
                                        Please check your inbox and click the verification link to
                                        unlock all features. You can start exploring your dashboard
                                        now.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={handleResendVerification}
                                        disabled={resendLoading || resendSuccess}
                                        className={cn(
                                            'inline-flex items-center gap-1.5 text-xs font-medium transition-colors',
                                            'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-1 rounded px-1 py-0.5',
                                            resendSuccess
                                                ? 'text-green-400 cursor-default'
                                                : 'text-[var(--color-primary)] hover:underline cursor-pointer',
                                            resendLoading && 'opacity-60 cursor-not-allowed',
                                        )}
                                        aria-label="Resend verification email"
                                    >
                                        {resendLoading ? (
                                            <>
                                                <Loader2 size={12} className="animate-spin" aria-hidden="true" />
                                                Sending…
                                            </>
                                        ) : resendSuccess ? (
                                            <>
                                                <CheckCircle2 size={12} aria-hidden="true" />
                                                Email sent!
                                            </>
                                        ) : (
                                            <>
                                                <RefreshCw size={12} aria-hidden="true" />
                                                Resend verification email
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <motion.button
                                type="button"
                                onClick={goToDashboard}
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                className="register-confirmation-cta w-full max-w-xs justify-center"
                            >
                                Continue to Dashboard
                                <ArrowRight size={18} aria-hidden="true" />
                            </motion.button>

                            <p className="text-[var(--text-muted)] text-xs">
                                Or{' '}
                                <Link
                                    to="/login"
                                    state={{ email: registeredEmail }}
                                    className="login-primary-link font-medium focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-1 rounded"
                                >
                                    go to login
                                </Link>
                            </p>
                        </motion.div>
                    ) : (
                        /* REGISTRATION FORM */
                        <>
                            <form onSubmit={handleSubmit(onSubmit)} noValidate>
                                <AnimatePresence mode="wait" custom={direction}>
                                    <motion.div
                                        key={step}
                                        custom={direction}
                                        variants={variants}
                                        initial="enter"
                                        animate="center"
                                        exit="exit"
                                        transition={{ duration: 0.3 }}
                                        layout
                                    >
                                        {/* STEP 1: IDENTITY */}
                                        {step === 1 && (
                                            <div className="space-y-5">
                                                <div className="mb-3">
                                                    <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-1">
                                                        Let&apos;s start with basics
                                                    </h2>
                                                    <p className="text-[var(--text-secondary)]">
                                                        Tell us who you are to get started.
                                                    </p>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <InputField
                                                        label="First Name"
                                                        icon={User}
                                                        id="reg-firstName"
                                                        registration={register('firstName')}
                                                        error={errors.firstName}
                                                        placeholder="John"
                                                        autoFocus
                                                        aria-required="true"
                                                    />
                                                    <InputField
                                                        label="Last Name"
                                                        icon={User}
                                                        id="reg-lastName"
                                                        registration={register('lastName')}
                                                        error={errors.lastName}
                                                        placeholder="Doe"
                                                        aria-required="true"
                                                    />
                                                </div>
                                                <InputField
                                                    label="Email Address"
                                                    icon={Mail}
                                                    type="email"
                                                    id="reg-email"
                                                    registration={register('email')}
                                                    error={errors.email}
                                                    placeholder="john@example.com"
                                                    autoComplete="email"
                                                    aria-required="true"
                                                />
                                            </div>
                                        )}

                                        {/* STEP 2: PROFILE */}
                                        {step === 2 && (
                                            <div className="space-y-5">
                                                <div className="mb-3">
                                                    <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-1">
                                                        Profile Details
                                                    </h2>
                                                    <p className="text-[var(--text-secondary)]">
                                                        Customize your platform experience.
                                                    </p>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <SelectField
                                                        label="Gender"
                                                        id="reg-gender"
                                                        options={[
                                                            { value: 'male', label: 'Male' },
                                                            { value: 'female', label: 'Female' },
                                                            { value: 'non-binary', label: 'Non-binary' },
                                                            { value: 'prefer-not-to-say', label: 'Prefer not to say' },
                                                        ]}
                                                        registration={register('gender')}
                                                        error={errors.gender}
                                                    />
                                                    <InputField
                                                        label="Date of Birth"
                                                        icon={Calendar}
                                                        type="date"
                                                        id="reg-dob"
                                                        registration={register('dob')}
                                                        error={errors.dob}
                                                        aria-required="true"
                                                    />
                                                </div>
                                                <InputField
                                                    label="Location"
                                                    icon={MapPin}
                                                    id="reg-location"
                                                    registration={register('location')}
                                                    error={errors.location}
                                                    placeholder="City, Country"
                                                    aria-required="true"
                                                />
                                                <SelectField
                                                    label="I am a..."
                                                    id="reg-role"
                                                    options={[
                                                        { value: 'attendee', label: 'Attendee' },
                                                        { value: 'organizer', label: 'Event Organizer' },
                                                        { value: 'admin', label: 'Administrator' },
                                                        { value: 'superadmin', label: 'Super Admin' },
                                                    ]}
                                                    registration={register('role')}
                                                    error={errors.role}
                                                />
                                            </div>
                                        )}

                                        {/* STEP 3: SECURITY */}
                                        {step === 3 && (
                                            <div className="space-y-5">
                                                <div className="mb-3">
                                                    <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-1">
                                                        Secure Account
                                                    </h2>
                                                    <p className="text-[var(--text-secondary)]">
                                                        Create a strong password to protect your data.
                                                    </p>
                                                </div>
                                                <div>
                                                    <div className="relative">
                                                        <InputField
                                                            label="Password"
                                                            icon={Lock}
                                                            id="reg-password"
                                                            type={showPass ? 'text' : 'password'}
                                                            registration={register('password')}
                                                            error={errors.password}
                                                            placeholder="••••••••"
                                                            autoComplete="new-password"
                                                            aria-required="true"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowPass(!showPass)}
                                                            className={cn(
                                                                'absolute right-4 text-[var(--text-muted)] hover:text-[var(--color-primary)] transition-colors',
                                                                'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] rounded',
                                                                'top-[calc(1.5rem+14px)]',
                                                            )}
                                                            style={{
                                                                marginTop: '0.125rem',
                                                            }}
                                                            aria-label={
                                                                showPass ? 'Hide password' : 'Show password'
                                                            }
                                                        >
                                                            {showPass ? (
                                                                <EyeOff size={18} aria-hidden="true" />
                                                            ) : (
                                                                <Eye size={18} aria-hidden="true" />
                                                            )}
                                                        </button>
                                                    </div>
                                                    <PasswordStrengthMeter
                                                        password={passwordValue || ''}
                                                    />
                                                </div>

                                                <InputField
                                                    label="Confirm Password"
                                                    icon={Lock}
                                                    id="reg-confirmPassword"
                                                    type="password"
                                                    registration={register('confirmPassword')}
                                                    error={errors.confirmPassword}
                                                    placeholder="••••••••"
                                                    autoComplete="new-password"
                                                    aria-required="true"
                                                />

                                                <div className="flex items-start gap-3 pt-2">
                                                    <div className="relative flex items-center pt-0.5">
                                                        <input
                                                            type="checkbox"
                                                            id="terms"
                                                            {...register('terms')}
                                                            className="h-4 w-4 rounded border-[var(--border-primary)] cursor-pointer accent-[var(--color-primary)] login-checkbox focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-1"
                                                            aria-required="true"
                                                        />
                                                    </div>
                                                    <label
                                                        htmlFor="terms"
                                                        className="text-sm text-[var(--text-secondary)] select-none cursor-pointer"
                                                    >
                                                        I agree to the{' '}
                                                        <Link
                                                            to="/terms"
                                                            className="login-primary-link font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-1 rounded"
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            Terms of Service
                                                        </Link>{' '}
                                                        and{' '}
                                                        <Link
                                                            to="/privacy"
                                                            className="login-primary-link font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-1 rounded"
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            Privacy Policy
                                                        </Link>
                                                    </label>
                                                </div>
                                                {errors.terms && (
                                                    <p className="text-red-400 text-xs pl-7" role="alert" aria-live="assertive">
                                                        {errors.terms.message}
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {/* STEP 4: REVIEW */}
                                        {step === 4 && (
                                            <div className="space-y-5">
                                                <div className="mb-3 text-center">
                                                    <div className="register-confirmation-icon mx-auto mb-3" style={{ width: '4rem', height: '4rem' }}>
                                                        <ShieldCheck size={32} />
                                                    </div>
                                                    <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-1">
                                                        Review &amp; Create Account
                                                    </h2>
                                                    <p className="text-[var(--text-secondary)] text-sm">
                                                        Confirm your details below and create your account.
                                                    </p>
                                                </div>

                                                <div className="register-review-section">
                                                    <div className="space-y-3">
                                                        <ReviewRow
                                                            icon={User}
                                                            label="Name"
                                                            value={`${formValues.firstName} ${formValues.lastName}`}
                                                        />
                                                        <ReviewRow
                                                            icon={Mail}
                                                            label="Email"
                                                            value={formValues.email}
                                                        />
                                                        <ReviewRow
                                                            icon={Calendar}
                                                            label="Date of Birth"
                                                            value={
                                                                formValues.dob
                                                                    ? new Date(formValues.dob).toLocaleDateString(
                                                                        'en-IN',
                                                                        {
                                                                            day: '2-digit',
                                                                            month: 'short',
                                                                            year: 'numeric',
                                                                        },
                                                                    )
                                                                    : '—'
                                                            }
                                                        />
                                                        <ReviewRow
                                                            icon={MapPin}
                                                            label="Location"
                                                            value={formValues.location || '—'}
                                                        />
                                                        <ReviewRow
                                                            icon={User}
                                                            label="Gender"
                                                            value={
                                                                formValues.gender
                                                                    ? formValues.gender.charAt(0).toUpperCase() +
                                                                    formValues.gender.slice(1)
                                                                    : '—'
                                                            }
                                                        />
                                                        <ReviewRow
                                                            icon={Sparkles}
                                                            label="Role"
                                                            value={
                                                                formValues.role === 'organizer'
                                                                    ? 'Event Organizer'
                                                                    : 'Attendee'
                                                            }
                                                        />
                                                    </div>
                                                </div>

                                                <p className="text-[var(--text-muted)] text-xs text-center">
                                                    By clicking below you agree to our Terms and will
                                                    receive a verification email.
                                                </p>
                                            </div>
                                        )}
                                    </motion.div>
                                </AnimatePresence>

                                {/* ACTION BUTTONS */}
                                <div className="mt-4 flex gap-3 pt-4 border-t border-[var(--border-primary)]">
                                    {step > 1 && (
                                        <motion.button
                                            type="button"
                                            onClick={prevStep}
                                            disabled={isLoading}
                                            whileHover={!isLoading ? { scale: 1.02 } : {}}
                                            whileTap={!isLoading ? { scale: 0.98 } : {}}
                                            className="login-social-btn flex items-center justify-center gap-2 px-6 py-3 border border-[var(--border-primary)] rounded-xl bg-[var(--bg-base)] text-sm font-medium text-[var(--text-primary)] hover:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                            aria-label="Go to previous step"
                                        >
                                            <ArrowLeft size={18} aria-hidden="true" /> Back
                                        </motion.button>
                                    )}

                                    <motion.button
                                        type={step === MAX_STEPS ? 'submit' : 'button'}
                                        onClick={step === MAX_STEPS ? undefined : nextStep}
                                        disabled={isLoading || !firebaseEnabled}
                                        aria-busy={isLoading}
                                        whileHover={!(isLoading || !firebaseEnabled) ? { scale: 1.01, y: -2 } : {}}
                                        whileTap={!(isLoading || !firebaseEnabled) ? { scale: 0.98 } : {}}
                                        className={cn(
                                            'flex-1 flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl text-sm font-bold login-primary-btn',
                                            'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] transition-all',
                                            'disabled:opacity-70 disabled:cursor-not-allowed',
                                            isLoading && 'login-btn-pulse',
                                        )}
                                    >
                                        <span className="relative z-10 flex items-center gap-2">
                                            {isLoading ? (
                                                <>
                                                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                                                    Creating Account...
                                                </>
                                            ) : step === MAX_STEPS ? (
                                                <>
                                                    Create Account <Sparkles size={18} aria-hidden="true" />
                                                </>
                                            ) : (
                                                <>
                                                    Continue <ArrowRight size={18} aria-hidden="true" />
                                                </>
                                            )}
                                        </span>
                                    </motion.button>
                                </div>
                            </form>

                            <p className="text-center mt-4 text-sm text-[var(--text-secondary)]">
                                Already have an account?{' '}
                                <Link
                                    to="/login"
                                    state={{ email: emailValue }}
                                    className="font-bold login-primary-link focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-1 rounded transition-all"
                                >
                                    Sign in
                                </Link>
                            </p>
                        </>
                    )}
                </motion.div>
            </div>

            {/* ============ RIGHT SIDE — VIDEO PROMO PANEL ============ */}
            <PromoPanel />

            {/* ============ MOBILE BRANDING ============ */}
            <div className="lg:hidden w-full py-6 px-6 bg-[var(--bg-base)] border-t border-[var(--border-primary)]">
                <div className="flex items-center justify-center gap-3 text-center">
                    <div
                        className="flex items-center justify-center w-8 h-8 rounded-lg"
                        style={{ background: 'var(--color-primary)' }}
                    >
                        <Activity size={16} className="text-white" aria-hidden="true" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-[var(--text-primary)]">FlowGateX</p>
                        <p className="text-xs text-[var(--text-muted)]">
                            Smart Event Access Management
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}