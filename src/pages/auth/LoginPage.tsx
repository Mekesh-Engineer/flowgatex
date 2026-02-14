import React, { useState, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Smartphone, AlertCircle, Loader2, Sun, Moon, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useLogin } from '@/features/auth/hooks/useLogin';
import { useThemeStore } from '@/store/zustand/stores';
import PromoPanel from '@/features/auth/components/PromoPanel';
import RoleSelector from '@/features/auth/components/RoleSelector';
import type { SignupRole } from '@/features/auth/types/registration.types';

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

function validateForm(email: string, password: string): FormErrors {
  const errors: FormErrors = {};

  if (!email.trim()) {
    errors.email = 'Email address is required.';
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = 'Please enter a valid email address.';
  }

  if (!password) {
    errors.password = 'Password is required.';
  } else if (password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }

  return errors;
}

// =============================================================================
// CONFETTI HELPERS
// =============================================================================

function fireConfetti() {
  const duration = 2500;
  const end = Date.now() + duration;

  const colors = ['#00A3DB', '#33B8E5', '#007AA3', '#A3D639', '#ffffff'];

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

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
}

// =============================================================================
// LOGIN PAGE COMPONENT
// =============================================================================

export default function LoginPage() {
  // Theme
  const { isDarkMode, toggleTheme } = useThemeStore();

  // Auth hook — handles login, redirect, error mapping
  const { login, loginGoogle, isLoading: hookLoading, error: hookError } = useLogin();
  const navigate = useNavigate();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<SignupRole>('attendee');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem('flowgatex_remember') === 'true';
  });

  // UI state
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loginSuccess, setLoginSuccess] = useState(false);

  // Sync hook error into local error state
  useEffect(() => {
    if (hookError) {
      setErrors({ general: hookError });
    }
  }, [hookError]);

  // Sync theme class on <html>
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleBlur = useCallback((field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setErrors({});

      // Validate
      const validationErrors = validateForm(email, password);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        setTouched({ email: true, password: true });
        return;
      }

      // Persist remember-me preference
      if (rememberMe) {
        localStorage.setItem('flowgatex_remember', 'true');
      } else {
        localStorage.removeItem('flowgatex_remember');
      }

      // Fire confetti on success!
      setLoginSuccess(true);
      fireConfetti();

      // Delegate to useLogin hook (handles auth, error mapping, redirect)
      await login(email.trim(), password, selectedRole);
    },
    [email, password, selectedRole, rememberMe, login]
  );

  const handleGoogleLogin = useCallback(async () => {
    setSocialLoading('google');
    setErrors({});

    setLoginSuccess(true);
    fireConfetti();

    // Delegate to useLogin hook (handles auth, error mapping, redirect)
    await loginGoogle();
    setSocialLoading(null);
  }, [loginGoogle]);

  const handlePhoneLogin = useCallback(() => {
    navigate('/login/phone');
  }, [navigate]);

  // Inline field error (shown after blur)
  const fieldError = (field: 'email' | 'password') =>
    touched[field] && errors[field] ? (
      <p className="mt-1.5 flex items-center gap-1 text-xs text-red-400" role="alert">
        <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
        {errors[field]}
      </p>
    ) : null;

  const isDisabled = hookLoading || socialLoading !== null || loginSuccess;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="h-screen w-full flex overflow-hidden bg-[var(--bg-base)] text-[var(--text-primary)] font-sans relative">

      {/* ============ FIXED: Stream Logo (top-left) ============ */}
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

      {/* ============ RIGHT SIDE — LOGIN FORM ============ */}
      <div className="w-full lg:w-1/2 bg-[var(--bg-surface)] h-full flex flex-col px-6 py-8 sm:p-8 overflow-y-auto transition-colors duration-300 relative">

        {/* Animated floating orbs (lime-green + blue accents) */}
        <div className="login-orb login-orb-1" />
        <div className="login-orb login-orb-2" />

        <motion.div
          className="w-full max-w-[420px] my-auto mx-auto space-y-7 relative z-10"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >

          {/* Heading */}
          <div className="text-center sm:text-left">
            <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">
              Welcome back
            </h1>
            <p className="text-[var(--text-secondary)] mt-2 text-sm sm:text-base">
              Sign in to your account to continue
            </p>
          </div>


          {/* Success Floating Notification */}
          <AnimatePresence>
            {loginSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -50, x: '-50%' }}
                animate={{ opacity: 1, y: 0, x: '-50%' }}
                exit={{ opacity: 0, y: -20, x: '-50%' }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                role="status"
                aria-live="polite"
                style={{
                  // Positioning
                  position: 'fixed',
                  top: '24px',
                  left: '50%',
                  zIndex: 9999, // Ensures it floats above other content

                  // Layout
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',

                  // Sizing & Spacing
                  padding: '12px 24px',
                  borderRadius: '16px',
                  minWidth: '300px',

                  // Visuals (Glassmorphism & Colors)
                  backgroundColor: 'rgba(255, 255, 255, 0.95)', // Solid/Glass background for legibility
                  color: 'var(--color-primary)',
                  border: '1px solid var(--color-primary)',
                  boxShadow: '0 10px 30px -10px rgba(0,0,0,0.15)', // Floating shadow depth
                  backdropFilter: 'blur(12px)',

                  // Typography
                  fontSize: '14px',
                  fontWeight: 600,
                  whiteSpace: 'nowrap'
                }}
              >
                <Activity
                  style={{ width: '20px', height: '20px', flexShrink: 0 }}
                  aria-hidden="true"
                />
                <span>Login successful! Redirecting...</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* General error banner */}
          <AnimatePresence>
            {errors.general && !loginSuccess && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
                role="alert"
                aria-live="assertive"
              >
                <AlertCircle className="size-5 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{errors.general}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Login Form */}
          <form className="space-y-5" onSubmit={handleSubmit} noValidate>

            {/* Role Selector */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-[var(--text-primary)]">
                Login as
              </label>
              <RoleSelector
                value={selectedRole}
                onChange={setSelectedRole}
                disabled={isDisabled}
              />
            </div>

            {/* Email Field */}
            <div className="space-y-1.5">
              <label
                className="block text-sm font-semibold text-[var(--text-primary)]"
                htmlFor="login-email"
              >
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--text-muted)]">
                  <Mail size={20} aria-hidden="true" />
                </div>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  aria-required="true"
                  aria-invalid={touched.email && !!errors.email}
                  aria-describedby={errors.email ? 'login-email-error' : undefined}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  onBlur={() => handleBlur('email')}
                  placeholder="name@example.com"
                  disabled={isDisabled}
                  className={`w-full pl-11 pr-4 py-3 rounded-xl border bg-[var(--bg-base)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition-all text-sm font-medium shadow-sm outline-none disabled:opacity-60 login-primary-input ${touched.email && errors.email
                    ? 'border-red-500/60'
                    : 'border-[var(--border-primary)]'
                    }`}
                />
              </div>
              {fieldError('email')}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label
                className="block text-sm font-semibold text-[var(--text-primary)]"
                htmlFor="login-password"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--text-muted)]">
                  <Lock size={20} aria-hidden="true" />
                </div>
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  aria-required="true"
                  aria-invalid={touched.password && !!errors.password}
                  aria-describedby={errors.password ? 'login-password-error' : undefined}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  onBlur={() => handleBlur('password')}
                  placeholder="Enter your password"
                  disabled={isDisabled}
                  className={`w-full pl-11 pr-11 py-3 rounded-xl border bg-[var(--bg-base)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition-all text-sm font-medium shadow-sm outline-none disabled:opacity-60 login-primary-input ${touched.password && errors.password
                    ? 'border-red-500/60'
                    : 'border-[var(--border-primary)]'
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[var(--text-muted)] hover:text-[var(--color-primary)] transition-colors"
                >
                  {showPassword ? (
                    <EyeOff size={20} aria-hidden="true" />
                  ) : (
                    <Eye size={20} aria-hidden="true" />
                  )}
                </button>
              </div>
              {fieldError('password')}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="rememberMe"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  aria-label="Remember me on this device"
                  className="h-4 w-4 rounded border-[var(--border-primary)] cursor-pointer accent-[var(--color-primary)] login-checkbox"
                />
                <label
                  className="ml-2 block text-sm text-[var(--text-secondary)] cursor-pointer select-none"
                  htmlFor="remember-me"
                >
                  Remember me
                </label>
              </div>
              <Link
                to="/forgot-password"
                className="text-sm font-medium login-primary-link focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-1 rounded transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button — Primary Blue (matches Homepage CTA) */}
            <motion.button
              type="submit"
              disabled={isDisabled}
              aria-busy={hookLoading}
              whileHover={!isDisabled ? { scale: 1.01, y: -2 } : {}}
              whileTap={!isDisabled ? { scale: 0.98 } : {}}
              className={`w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl text-sm font-bold login-primary-btn focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] transition-all disabled:opacity-70 disabled:cursor-not-allowed ${hookLoading ? 'login-btn-pulse' : ''
                }`}
            >
              <span className="relative z-10 flex items-center gap-2">
                {hookLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    Signing in...
                  </>
                ) : loginSuccess ? (
                  <>
                    <Activity className="size-4" aria-hidden="true" />
                    Success!
                  </>
                ) : (
                  'Sign in'
                )}
              </span>
            </motion.button>
          </form>

          {/* Divider */}
          <div className="relative" aria-hidden="true">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border-primary)]" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-[var(--bg-surface)] text-[var(--text-muted)] font-medium">
                Or continue with
              </span>
            </div>
          </div>

          {/* Social Login Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <motion.button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isDisabled}
              aria-label="Sign in with Google"
              whileHover={!isDisabled ? { scale: 1.02 } : {}}
              whileTap={!isDisabled ? { scale: 0.98 } : {}}
              className="login-social-btn flex items-center justify-center w-full px-4 py-2.5 border border-[var(--border-primary)] rounded-xl bg-[var(--bg-base)] text-sm font-medium text-[var(--text-primary)] hover:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-colors gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {socialLoading === 'google' ? (
                <Loader2 className="size-5 animate-spin" aria-hidden="true" />
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              )}
              Google
            </motion.button>
            <motion.button
              type="button"
              onClick={handlePhoneLogin}
              disabled={isDisabled}
              aria-label="Sign in with phone number"
              whileHover={!isDisabled ? { scale: 1.02 } : {}}
              whileTap={!isDisabled ? { scale: 0.98 } : {}}
              className="login-social-btn flex items-center justify-center w-full px-4 py-2.5 border border-[var(--border-primary)] rounded-xl bg-[var(--bg-base)] text-sm font-medium text-[var(--text-primary)] hover:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-colors gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Smartphone size={20} aria-hidden="true" />
              Phone
            </motion.button>
          </div>

          {/* Sign-up Link */}
          <p className="text-center text-sm text-[var(--text-secondary)]">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-bold login-primary-link focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-1 rounded transition-all"
            >
              Sign up
            </Link>
          </p>

        </motion.div>
      </div>
    </div>
  );
}

