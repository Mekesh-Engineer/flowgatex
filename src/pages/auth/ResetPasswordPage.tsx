import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle2, ShieldCheck, ArrowLeft, Sun, Moon, Activity, Loader2 } from 'lucide-react';
import { confirmPasswordReset } from 'firebase/auth';
import { auth, firebaseEnabled } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { useThemeStore } from '@/store/zustand/stores';
import PromoPanel from '@/features/auth/components/PromoPanel';

// =============================================================================
// TYPES
// =============================================================================

interface PasswordRequirement {
    label: string;
    test: (pw: string) => boolean;
}

const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
    { label: 'At least 8 characters', test: (pw) => pw.length >= 8 },
    { label: 'One uppercase letter', test: (pw) => /[A-Z]/.test(pw) },
    { label: 'One lowercase letter', test: (pw) => /[a-z]/.test(pw) },
    { label: 'One number', test: (pw) => /\d/.test(pw) },
    { label: 'One special character', test: (pw) => /[!@#$%^&*(),.?":{}|<>]/.test(pw) },
];

// =============================================================================
// COMPONENT
// =============================================================================

export default function ResetPasswordPage() {
    const { isDarkMode, toggleTheme } = useThemeStore();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token') || searchParams.get('oobCode');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');

    const allMet = PASSWORD_REQUIREMENTS.every((r) => r.test(password));
    const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
    const canSubmit = allMet && passwordsMatch && !isSubmitting;

    // Sync theme class
    useEffect(() => {
        const root = document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(isDarkMode ? 'dark' : 'light');
    }, [isDarkMode]);

    const getStrength = (): { label: string; percent: number; color: string } => {
        const met = PASSWORD_REQUIREMENTS.filter((r) => r.test(password)).length;
        if (met <= 1) return { label: 'Weak', percent: 20, color: 'bg-red-500' };
        if (met <= 2) return { label: 'Fair', percent: 40, color: 'bg-orange-500' };
        if (met <= 3) return { label: 'Good', percent: 60, color: 'bg-amber-500' };
        if (met <= 4) return { label: 'Strong', percent: 80, color: 'bg-emerald-500' };
        return { label: 'Excellent', percent: 100, color: 'bg-green-500' };
    };

    const strength = getStrength();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;
        setError('');
        setIsSubmitting(true);

        try {
            if (firebaseEnabled && auth && token) {
                await confirmPasswordReset(auth, token, password);
            } else {
                // Mock mode fallback
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }
            setIsSuccess(true);

            setTimeout(() => navigate('/login'), 3000);
        } catch (err: any) {
            const code = err?.code || '';
            if (code === 'auth/expired-action-code') {
                setError('This reset link has expired. Please request a new one.');
            } else if (code === 'auth/invalid-action-code') {
                setError('This reset link is invalid. It may have already been used.');
            } else if (code === 'auth/weak-password') {
                setError('Password is too weak. Please choose a stronger password.');
            } else {
                setError('Failed to reset password. The link may have expired. Please request a new one.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="h-screen w-full flex overflow-hidden bg-[var(--bg-base)] text-[var(--text-primary)] font-sans relative">
            {/* ============ FIXED: Brand Logo (top-left) ============ */}
            <Link to="/" className="login-brand-logo" aria-label="FlowGateX Home">
                <div className="logo-icon">
                    <Activity size={18} className="text-white" aria-hidden="true" />
                </div>
                <span className="logo-text hidden sm:inline">FlowGateX</span>
            </Link>

            {/* ============ FIXED: Theme Switcher (top-right) ============ */}
            <button
                type="button"
                onClick={toggleTheme}
                className="login-theme-toggle"
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
                            <Sun size={18} />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="moon"
                            initial={{ rotate: 90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: -90, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Moon size={18} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </button>

            {/* ============ LEFT SIDE — Video PromoPanel ============ */}
            <PromoPanel />

            {/* ============ RIGHT SIDE — FORM ============ */}
            <div className="w-full lg:w-1/2 bg-[var(--bg-surface)] h-full flex items-center justify-center px-6 py-8 sm:p-8 overflow-y-auto transition-colors duration-300 relative">
                 {/* Floating orbs */}
                <div className="login-orb login-orb-1" />
                <div className="login-orb login-orb-2" />

                <div className="w-full max-w-[420px] relative z-10 space-y-7">
                    
                    {/* Success State */}
                    {isSuccess ? (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center space-y-6"
                        >
                            <div className="flex justify-center">
                                <div className="h-16 w-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400">
                                    <CheckCircle2 size={32} />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-[var(--text-primary)]">Password Reset!</h1>
                                <p className="text-[var(--text-secondary)] mt-2">
                                    Your password has been successfully reset. Redirecting you to login...
                                </p>
                            </div>
                             <Link
                                to="/login"
                                className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 border border-transparent rounded-xl text-sm font-bold bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]/90 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)]"
                            >
                                Go to Login
                            </Link>
                        </motion.div>
                    ) : !token ? (
                        /* Invalid Token State */
                        <motion.div
                             initial={{ opacity: 0, y: 10 }}
                             animate={{ opacity: 1, y: 0 }}
                             className="text-center space-y-6"
                        >
                            <div className="flex justify-center">
                                <div className="h-16 w-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600 dark:text-red-400">
                                    <ShieldCheck size={32} />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-[var(--text-primary)]">Invalid Link</h1>
                                <p className="text-[var(--text-secondary)] mt-2">
                                     This password reset link is invalid or has expired. Please request a new one.
                                </p>
                            </div>
                            <Link
                                to="/forgot-password"
                                className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 border border-transparent rounded-xl text-sm font-bold bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]/90 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)]"
                            >
                                Request New Link
                            </Link>
                        </motion.div>
                    ) : (
                        /* Main Form */
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            <div className="text-center sm:text-left">
                                <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">
                                    Create New Password
                                </h1>
                                <p className="text-[var(--text-secondary)] mt-2 text-sm sm:text-base">
                                    Enter your new password below. Make it strong and memorable.
                                </p>
                            </div>

                             {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
                                    role="alert"
                                >
                                    <ShieldCheck className="size-5 shrink-0 mt-0.5" />
                                    <span>{error}</span>
                                </motion.div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-5">
                                 {/* New Password */}
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-semibold text-[var(--text-primary)]">
                                        New Password
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--text-muted)]">
                                            <Lock size={20} />
                                        </div>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full pl-11 pr-11 py-3 rounded-xl border bg-[var(--bg-base)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition-all text-sm font-medium shadow-sm outline-none login-primary-input border-[var(--border-primary)]"
                                            placeholder="Enter new password"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[var(--text-muted)] hover:text-[var(--color-primary)] transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                    
                                     {/* Strength Meter */}
                                    {password.length > 0 && (
                                        <div className="mt-2 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-[var(--text-secondary)]">Strength</span>
                                                <span className={cn('text-xs font-semibold', strength.percent <= 40 ? 'text-red-500' : strength.percent <= 60 ? 'text-orange-500' : 'text-green-500')}>
                                                    {strength.label}
                                                </span>
                                            </div>
                                            <div className="h-1.5 w-full bg-[var(--bg-base)] rounded-full overflow-hidden border border-[var(--border-primary)]">
                                                <div
                                                    className={cn('h-full rounded-full transition-all duration-500', strength.color)}
                                                    style={{ width: `${strength.percent}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Confirm Password */}
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-semibold text-[var(--text-primary)]">
                                        Confirm Password
                                    </label>
                                    <div className="relative">
                                         <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--text-muted)]">
                                            <Lock size={20} />
                                        </div>
                                        <input
                                            type={showConfirm ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className={cn(
                                                "w-full pl-11 pr-11 py-3 rounded-xl border bg-[var(--bg-base)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition-all text-sm font-medium shadow-sm outline-none login-primary-input",
                                                confirmPassword.length > 0 && !passwordsMatch ? 'border-red-500/60' : 'border-[var(--border-primary)]'
                                            )}
                                            placeholder="Confirm new password"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirm(!showConfirm)}
                                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[var(--text-muted)] hover:text-[var(--color-primary)] transition-colors"
                                        >
                                            {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                    {confirmPassword.length > 0 && !passwordsMatch && (
                                        <p className="text-xs text-red-400 mt-1">Passwords don't match</p>
                                    )}
                                </div>

                                {/* Requirements List */}
                                <div className="bg-[var(--bg-base)] border border-[var(--border-primary)] rounded-xl p-4 space-y-2">
                                    <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-2">
                                        Password Requirements
                                    </p>
                                    {PASSWORD_REQUIREMENTS.map((req, i) => {
                                        const met = req.test(password);
                                        return (
                                            <div key={i} className="flex items-center gap-2">
                                                <CheckCircle2
                                                    size={14}
                                                    className={cn(
                                                        'shrink-0 transition-colors',
                                                        met ? 'text-green-500' : 'text-[var(--text-disabled)]'
                                                    )}
                                                />
                                                <span
                                                    className={cn(
                                                        'text-xs transition-colors',
                                                        met ? 'text-green-500' : 'text-[var(--text-muted)]'
                                                    )}
                                                >
                                                    {req.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                                
                                <motion.button
                                    type="submit"
                                    disabled={!canSubmit || isSubmitting}
                                    whileHover={canSubmit ? { scale: 1.01, y: -2 } : {}}
                                    whileTap={canSubmit ? { scale: 0.98 } : {}}
                                    className={`w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl text-sm font-bold login-primary-btn focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] transition-all disabled:opacity-70 disabled:cursor-not-allowed ${isSubmitting ? 'login-btn-pulse' : ''}`}
                                >
                                    <span className="relative z-10 flex items-center gap-2">
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="size-4 animate-spin" />
                                                Resetting...
                                            </>
                                        ) : (
                                            'Reset Password'
                                        )}
                                    </span>
                                </motion.button>
                            </form>

                             {/* Back to Login */}
                            <div className="text-center">
                                <Link
                                    to="/login"
                                    className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                                >
                                    <ArrowLeft size={16} />
                                    Back to Sign In
                                </Link>
                            </div>

                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}
