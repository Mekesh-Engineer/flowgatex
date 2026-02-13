import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, Sun, Moon, Activity, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { sendPasswordReset } from '@/features/auth/services/authService';
import { useThemeStore } from '@/store/zustand/stores';
import PromoPanel from '@/features/auth/components/PromoPanel';

//Regex for basic email validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordPage() {
  const { isDarkMode, toggleTheme } = useThemeStore();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);

  // Sync theme class
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email.trim()) {
        setError('Email address is required.');
        return;
    }
    if (!EMAIL_REGEX.test(email)) {
        setError('Please enter a valid email address.');
        return;
    }

    setLoading(true);
    try {
      await sendPasswordReset(email);
      setSuccess(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send reset email.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [email]);

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
           <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-center space-y-6"
              >
                <div className="flex justify-center">
                    <div className="h-16 w-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400">
                        <CheckCircle2 size={32} />
                    </div>
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">Check your email</h1>
                    <p className="text-[var(--text-secondary)] mt-2">
                        We've sent password reset instructions to <br/>
                        <span className="font-semibold text-[var(--text-primary)]">{email}</span>
                    </p>
                </div>
                
                <div className="pt-2">
                     <Link
                      to="/login"
                      className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 border border-transparent rounded-xl text-sm font-bold bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]/90 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)]"
                    >
                      <ArrowLeft size={18} />
                      Back to Sign In
                    </Link>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Heading */}
                <div className="text-center sm:text-left">
                    <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">
                    Forgot password?
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-2 text-sm sm:text-base">
                    Enter your email and we'll send you a link to reset your password.
                    </p>
                </div>

                {/* Error Banner */}
                <AnimatePresence>
                    {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
                        role="alert"
                    >
                        <AlertCircle className="size-5 shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </motion.div>
                    )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                    <div className="space-y-1.5">
                        <label htmlFor="reset-email" className="block text-sm font-semibold text-[var(--text-primary)]">
                            Email address
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--text-muted)]">
                                <Mail size={20} />
                            </div>
                            <input
                                id="reset-email"
                                type="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if(error) setError('');
                                }}
                                onBlur={() => setTouched(true)}
                                placeholder="name@example.com"
                                disabled={loading}
                                className={`w-full pl-11 pr-4 py-3 rounded-xl border bg-[var(--bg-base)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition-all text-sm font-medium shadow-sm outline-none disabled:opacity-60 login-primary-input ${touched && error ? 'border-red-500/60' : 'border-[var(--border-primary)]'}`}
                            />
                        </div>
                    </div>

                    <motion.button
                        type="submit"
                        disabled={loading}
                        whileHover={!loading ? { scale: 1.01, y: -2 } : {}}
                        whileTap={!loading ? { scale: 0.98 } : {}}
                        className={`w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl text-sm font-bold login-primary-btn focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] transition-all disabled:opacity-70 disabled:cursor-not-allowed ${loading ? 'login-btn-pulse' : ''}`}
                    >
                         <span className="relative z-10 flex items-center gap-2">
                            {loading ? (
                                <>
                                <Loader2 className="size-4 animate-spin" />
                                Sending...
                                </>
                            ) : (
                                'Send Reset Link'
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
           </AnimatePresence>

        </div>
      </div>
    </div>
  );
}
