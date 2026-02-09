// =============================================================================
// REGISTER PAGE — 4-step progressive signup: Identity → Security → Verify → Review
// =============================================================================

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Building2,
  Briefcase,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Loader2,
  Sun,
  Moon,
  Activity,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useThemeStore } from '@/store/zustand/stores';
import PromoPanel from '@/features/auth/components/PromoPanel';

import RoleSelector from '@/features/auth/components/RoleSelector';
import StepProgress from '@/features/auth/components/StepProgress';
import PasswordMeter from '@/features/auth/components/PasswordMeter';
import { isPasswordValid } from '@/features/auth/utils/passwordValidation';
import SocialButtons from '@/features/auth/components/SocialButtons';
import ConfirmationScreen from '@/features/auth/components/ConfirmationScreen';
import DateOfBirthPicker from '@/features/auth/components/DateOfBirthPicker';
import { validateDob } from '@/features/auth/utils/dobValidation';
import MobileInput from '@/features/auth/components/MobileInput';
import { validateMobile, toE164 } from '@/features/auth/utils/mobileValidation';
import GenderSelect from '@/features/auth/components/GenderSelect';
import ReviewScreen from '@/features/auth/components/ReviewScreen';

import type { SignupRole, Gender } from '@/features/auth/types/registration.types';
import {
  ERROR_MESSAGE_MAP,
  type RegistrationErrorCode,
} from '@/features/auth/types/registration.types';
import {
  createUser,
  validateAuthCode,
  signUpWithGoogle,
  signUpWithPhone,
} from '@/features/auth/services/registrationService';
import {
  trackRoleSelected,
  trackStepAdvanced,
  trackSignupSuccess,
  trackSignupFailure,
  trackSocialClick,
  trackAuthCodeValidated,
} from '@/features/auth/hooks/useSignupAnalytics';

// =============================================================================
// TYPES & VALIDATION
// =============================================================================

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FormData {
  // Step 1 — Identity
  firstName: string;
  lastName: string;
  email: string;
  dob: string;
  // Step 2 — Security & Contact
  mobile: string;
  countryCode: string;
  password: string;
  confirmPassword: string;
  gender: Gender | '';
  termsAccepted: boolean;
  liveLocationConsent: boolean;
  marketingConsent: boolean;
  whatsappConsent: boolean;
  // Step 3 — Verify (role-specific)
  organization: string;
  department: string;
  authorizationCode: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  dob?: string;
  mobile?: string;
  password?: string;
  confirmPassword?: string;
  organization?: string;
  authorizationCode?: string;
  termsAccepted?: string;
  general?: string;
}

const INITIAL_FORM: FormData = {
  firstName: '',
  lastName: '',
  email: '',
  dob: '',
  mobile: '',
  countryCode: '+91',
  password: '',
  confirmPassword: '',
  gender: '',
  termsAccepted: false,
  liveLocationConsent: false,
  marketingConsent: false,
  whatsappConsent: false,
  organization: '',
  department: '',
  authorizationCode: '',
};

function validateStep1(data: FormData): FormErrors {
  const errors: FormErrors = {};
  if (!data.firstName.trim()) errors.firstName = 'First name is required.';
  if (!data.lastName.trim()) errors.lastName = 'Last name is required.';
  if (!data.email.trim()) {
    errors.email = 'Email address is required.';
  } else if (!EMAIL_REGEX.test(data.email)) {
    errors.email = 'Please enter a valid email address.';
  }
  const dobErr = validateDob(data.dob);
  if (dobErr) errors.dob = dobErr;
  return errors;
}

function validateStep2(data: FormData): FormErrors {
  const errors: FormErrors = {};
  if (!data.password) {
    errors.password = 'Password is required.';
  } else if (!isPasswordValid(data.password)) {
    errors.password = 'Password does not meet all requirements.';
  }
  if (!data.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password.';
  } else if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }
  const mobileErr = validateMobile(data.countryCode, data.mobile);
  if (mobileErr) errors.mobile = mobileErr;
  if (!data.termsAccepted) {
    errors.termsAccepted = 'You must accept the Terms of Service.';
  }
  return errors;
}

function validateStep3(data: FormData, role: SignupRole): FormErrors {
  const errors: FormErrors = {};
  if ((role === 'organizer' || role === 'admin') && !data.authorizationCode.trim()) {
    errors.authorizationCode = 'Authorization code is required for this role.';
  }
  if (role === 'organizer' && !data.organization.trim()) {
    errors.organization = 'Organization name is required.';
  }
  return errors;
}

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 60 : -60,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -60 : 60,
    opacity: 0,
  }),
};

// =============================================================================
// REGISTER PAGE
// =============================================================================

export default function RegisterPage() {
  const { isDarkMode, toggleTheme } = useThemeStore();

  // Multi-step state
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);

  // Role
  const [role, setRole] = useState<SignupRole>('attendee');

  // Form fields
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Email verification happens after account creation via Firebase link
  // No separate OTP flow needed

  // Auth code state
  const [authCodeValidated, setAuthCodeValidated] = useState(false);

  // Completed (step 4 submitted)
  const [completed, setCompleted] = useState(false);

  // Sync theme class
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Reset auth code validation when code changes
  useEffect(() => {
    setAuthCodeValidated(false);
  }, [formData.authorizationCode]);

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  const needsAuthCode = role === 'organizer' || role === 'admin';
  const hasMobile = formData.mobile.replace(/\D/g, '').length >= 6;

  const handleField = useCallback(
    (field: keyof FormData, value: string | boolean) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (errors[field as keyof FormErrors]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    [errors],
  );

  const handleBlur = useCallback((field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const fieldError = (field: keyof FormErrors) =>
    touched[field] && errors[field] ? (
      <p className="mt-1.5 flex items-center gap-1 text-xs text-red-400" role="alert">
        <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
        {errors[field]}
      </p>
    ) : null;

  const isDisabled = loading || submitting;

  const stepHeading = useMemo(() => {
    switch (step) {
      case 1:
        return {
          title: 'Create your account',
          subtitle: 'Tell us who you are.',
        };
      case 2:
        return {
          title: 'Contact & Security',
          subtitle: 'Set up your password and contact info.',
        };
      case 3:
        return {
          title: 'Verify your identity',
          subtitle: 'Confirm your email and complete setup.',
        };
      case 4:
        return {
          title: 'Review & Submit',
          subtitle: 'Double-check your details before signing up.',
        };
      default:
        return { title: '', subtitle: '' };
    }
  }, [step]);

  // ---------------------------------------------------------------------------
  // Role change handler
  // ---------------------------------------------------------------------------

  const handleRoleChange = useCallback((newRole: SignupRole) => {
    setRole(newRole);
    setAuthCodeValidated(false);
    trackRoleSelected(newRole);
  }, []);

  // ---------------------------------------------------------------------------
  // Step navigation
  // ---------------------------------------------------------------------------

  const goToStep = useCallback(
    (target: number) => {
      setDirection(target > step ? 1 : -1);
      setStep(target);
    },
    [step],
  );

  const goBack = useCallback(() => {
    if (step > 1) goToStep(step - 1);
  }, [step, goToStep]);

  // ---------------------------------------------------------------------------
  // Step 1 → Step 2 (validate identity fields)
  // ---------------------------------------------------------------------------

  const handleStep1Next = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const validationErrors = validateStep1(formData);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        const touchAll: Record<string, boolean> = {};
        for (const key of Object.keys(validationErrors)) touchAll[key] = true;
        setTouched((prev) => ({ ...prev, ...touchAll }));
        return;
      }
      setErrors({});
      goToStep(2);
      trackStepAdvanced(2, role);
    },
    [formData, role, goToStep],
  );

  // ---------------------------------------------------------------------------
  // Step 2 → Step 3 (validate security fields)
  // ---------------------------------------------------------------------------
  // Note: Email verification happens AFTER account creation (Firebase link)

  const handleStep2Next = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const validationErrors = validateStep2(formData);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        const touchAll: Record<string, boolean> = {};
        for (const key of Object.keys(validationErrors)) touchAll[key] = true;
        setTouched((prev) => ({ ...prev, ...touchAll }));
        return;
      }

      setErrors({});
      // Proceed directly to Step 3 (role-specific fields)
      // Email verification link is sent AFTER account creation
      goToStep(3);
      trackStepAdvanced(3, role);
    },
    [formData, role, goToStep],
  );

  // Note: Email/Phone OTP handlers removed - verification happens via Firebase link after account creation

  const handleValidateAuthCode = useCallback(async () => {
    if (!formData.authorizationCode.trim()) return;
    setLoading(true);
    try {
      await validateAuthCode({
        code: formData.authorizationCode.trim(),
        role,
      });
      setAuthCodeValidated(true);
      trackAuthCodeValidated(role, true);
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      const errCode = error.code as RegistrationErrorCode | undefined;
      setErrors({
        authorizationCode:
          errCode && ERROR_MESSAGE_MAP[errCode]
            ? ERROR_MESSAGE_MAP[errCode]
            : error.message || 'Invalid code.',
      });
      setTouched((prev) => ({ ...prev, authorizationCode: true }));
      trackAuthCodeValidated(role, false);
    } finally {
      setLoading(false);
    }
  }, [formData.authorizationCode, role]);

  // Step 3 "Next" — validate role-specific fields, go to review
  // Note: Email verification happens AFTER account creation via link
  const handleStep3Next = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Validate role-specific fields
      const validationErrors = validateStep3(formData, role);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        const touchAll: Record<string, boolean> = {};
        for (const key of Object.keys(validationErrors)) touchAll[key] = true;
        setTouched((prev) => ({ ...prev, ...touchAll }));
        return;
      }

      // Validate auth code if needed (for organizer/admin roles)
      if (needsAuthCode && !authCodeValidated) {
        await handleValidateAuthCode();
        if (!authCodeValidated) return;
      }

      setErrors({});
      goToStep(4);
      trackStepAdvanced(4, role);
    },
    [
      formData,
      role,
      needsAuthCode,
      authCodeValidated,
      handleValidateAuthCode,
      goToStep,
    ],
  );

  // ---------------------------------------------------------------------------
  // Step 4 — Final submit
  // ---------------------------------------------------------------------------

  const handleFinalSubmit = useCallback(async () => {
    setSubmitting(true);
    try {
      await createUser({
        role,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        dob: formData.dob,
        password: formData.password,
        mobile: hasMobile
          ? toE164(formData.countryCode, formData.mobile)
          : undefined,
        gender: formData.gender || undefined,
        liveLocationConsent: formData.liveLocationConsent,
        organization: formData.organization.trim() || undefined,
        department: formData.department || undefined,
        authorizationCode: formData.authorizationCode.trim() || undefined,
        consents: {
          terms: formData.termsAccepted,
          marketing: formData.marketingConsent,
          whatsapp: formData.whatsappConsent,
        },
      });

      trackSignupSuccess(role, 'email');
      setCompleted(true);
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      const code = error.code as RegistrationErrorCode | undefined;
      setErrors({
        general:
          code && ERROR_MESSAGE_MAP[code]
            ? ERROR_MESSAGE_MAP[code]
            : error.message || 'Registration failed.',
      });
      trackSignupFailure(role, code ?? 'UNKNOWN');
    } finally {
      setSubmitting(false);
    }
  }, [formData, role, hasMobile]);

  // ---------------------------------------------------------------------------
  // Social auth handlers (Step 1 only)
  // ---------------------------------------------------------------------------

  const handleSocialClick = useCallback(
    async (provider: 'google' | 'phone') => {
      trackSocialClick(provider);
      try {
        if (provider === 'google') await signUpWithGoogle();
        if (provider === 'phone')
          await signUpWithPhone(formData.mobile || '+1000000000');
      } catch (err: unknown) {
        const error = err as { message?: string };
        setErrors({
          general:
            error.message || `${provider} sign-up is not available yet.`,
        });
      }
    },
    [formData.mobile],
  );

  // ---------------------------------------------------------------------------
  // Edit from Review (go back to a specific step)
  // ---------------------------------------------------------------------------

  const handleEditStep = useCallback(
    (targetStep: number) => {
      goToStep(targetStep);
    },
    [goToStep],
  );

  // ---------------------------------------------------------------------------
  // Live location consent handler
  // ---------------------------------------------------------------------------

  const handleLocationConsent = useCallback(
    (checked: boolean) => {
      if (checked && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          () => handleField('liveLocationConsent', true),
          () => handleField('liveLocationConsent', false),
        );
      } else {
        handleField('liveLocationConsent', checked);
      }
    },
    [handleField],
  );

  // ---------------------------------------------------------------------------
  // Can advance from step 3?
  // ---------------------------------------------------------------------------
  // Email verification happens after account creation, so we don't block on it
  const step3CanAdvance = !needsAuthCode || authCodeValidated;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

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
        aria-label={
          isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'
        }
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

      {/* ============ RIGHT SIDE — REGISTER FORM ============ */}
      <div className="w-full lg:w-1/2 bg-[var(--bg-surface)] h-full flex items-center justify-center px-6 py-8 sm:p-8 overflow-y-auto transition-colors duration-300 relative">
        {/* Floating orbs */}
        <div className="login-orb login-orb-1" />
        <div className="login-orb login-orb-2" />

        <div className="w-full max-w-[460px] relative z-10">
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            {/* ================================================================
                STEP 1 — Identity: Role + Name + Email + DOB
                ================================================================ */}
            {step === 1 && !completed && (
              <motion.div
                key="step-1"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="space-y-5"
              >
                <StepProgress currentStep={1} />

                {/* Heading */}
                <div className="text-center sm:text-left">
                  <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">
                    {stepHeading.title}
                  </h1>
                  <p className="text-[var(--text-secondary)] mt-1.5 text-sm sm:text-base">
                    {stepHeading.subtitle}
                  </p>
                </div>

                {/* General error */}
                <AnimatePresence>
                  {errors.general && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
                      role="alert"
                      aria-live="assertive"
                    >
                      <AlertCircle
                        className="size-5 shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <span>{errors.general}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Role Selector */}
                <RoleSelector
                  value={role}
                  onChange={handleRoleChange}
                  disabled={isDisabled}
                />

                <form
                  className="space-y-4"
                  onSubmit={handleStep1Next}
                  noValidate
                >
                  {/* Name Row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label
                        className="block text-sm font-semibold text-[var(--text-primary)]"
                        htmlFor="reg-first-name"
                      >
                        First Name{' '}
                        <span className="text-[var(--color-error)]">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--text-muted)]">
                          <User size={18} aria-hidden="true" />
                        </div>
                        <input
                          id="reg-first-name"
                          name="firstName"
                          type="text"
                          autoComplete="given-name"
                          required
                          aria-required="true"
                          aria-invalid={
                            touched.firstName && !!errors.firstName
                          }
                          value={formData.firstName}
                          onChange={(e) =>
                            handleField('firstName', e.target.value)
                          }
                          onBlur={() => handleBlur('firstName')}
                          placeholder="Jane"
                          disabled={isDisabled}
                          className={`register-input register-input--icon ${
                            touched.firstName && errors.firstName
                              ? 'register-input--error'
                              : ''
                          }`}
                        />
                      </div>
                      {fieldError('firstName')}
                    </div>

                    <div className="space-y-1.5">
                      <label
                        className="block text-sm font-semibold text-[var(--text-primary)]"
                        htmlFor="reg-last-name"
                      >
                        Last Name{' '}
                        <span className="text-[var(--color-error)]">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--text-muted)]">
                          <User size={18} aria-hidden="true" />
                        </div>
                        <input
                          id="reg-last-name"
                          name="lastName"
                          type="text"
                          autoComplete="family-name"
                          required
                          aria-required="true"
                          aria-invalid={touched.lastName && !!errors.lastName}
                          value={formData.lastName}
                          onChange={(e) =>
                            handleField('lastName', e.target.value)
                          }
                          onBlur={() => handleBlur('lastName')}
                          placeholder="Doe"
                          disabled={isDisabled}
                          className={`register-input register-input--icon ${
                            touched.lastName && errors.lastName
                              ? 'register-input--error'
                              : ''
                          }`}
                        />
                      </div>
                      {fieldError('lastName')}
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label
                      className="block text-sm font-semibold text-[var(--text-primary)]"
                      htmlFor="reg-email"
                    >
                      Email Address{' '}
                      <span className="text-[var(--color-error)]">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--text-muted)]">
                        <Mail size={20} aria-hidden="true" />
                      </div>
                      <input
                        id="reg-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        aria-required="true"
                        aria-invalid={touched.email && !!errors.email}
                        value={formData.email}
                        onChange={(e) => handleField('email', e.target.value)}
                        onBlur={() => handleBlur('email')}
                        placeholder="name@example.com"
                        disabled={isDisabled}
                        className={`register-input register-input--icon ${
                          touched.email && errors.email
                            ? 'register-input--error'
                            : ''
                        }`}
                      />
                    </div>
                    {fieldError('email')}
                  </div>

                  {/* Date of Birth */}
                  <DateOfBirthPicker
                    value={formData.dob}
                    onChange={(v) => handleField('dob', v)}
                    error={touched.dob ? errors.dob : undefined}
                    disabled={isDisabled}
                  />

                  {/* Next Button */}
                  <motion.button
                    type="submit"
                    disabled={isDisabled}
                    whileHover={!isDisabled ? { scale: 1.01, y: -2 } : {}}
                    whileTap={!isDisabled ? { scale: 0.98 } : {}}
                    className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl text-sm font-bold login-primary-btn focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    Continue
                    <ArrowRight size={18} aria-hidden="true" />
                  </motion.button>
                </form>

                {/* Social Auth — only on Step 1 */}
                <SocialButtons
                  onSocialClick={handleSocialClick}
                  disabled={isDisabled}
                />

                {/* Sign-in link */}
                <p className="text-center text-sm text-[var(--text-secondary)]">
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    className="font-bold login-primary-link focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-1 rounded transition-all"
                  >
                    Sign in
                  </Link>
                </p>
              </motion.div>
            )}

            {/* ================================================================
                STEP 2 — Security: Mobile + Password + Confirm + Gender + Consents
                ================================================================ */}
            {step === 2 && !completed && (
              <motion.div
                key="step-2"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="space-y-5"
              >
                <StepProgress currentStep={2} />

                {/* Back button */}
                <button
                  type="button"
                  onClick={goBack}
                  disabled={isDisabled}
                  className="flex items-center gap-1.5 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  aria-label="Go back to identity"
                >
                  <ArrowLeft size={16} aria-hidden="true" />
                  Back
                </button>

                {/* Heading */}
                <div className="text-center sm:text-left">
                  <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
                    {stepHeading.title}
                  </h1>
                  <p className="text-[var(--text-secondary)] mt-1.5 text-sm">
                    {stepHeading.subtitle}
                  </p>
                </div>

                {/* General error */}
                <AnimatePresence>
                  {errors.general && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
                      role="alert"
                    >
                      <AlertCircle
                        className="size-5 shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <span>{errors.general}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form
                  className="space-y-4"
                  onSubmit={handleStep2Next}
                  noValidate
                >
                  {/* Mobile Input */}
                  <MobileInput
                    value={formData.mobile}
                    countryCode={formData.countryCode}
                    onValueChange={(v) => handleField('mobile', v)}
                    onCountryCodeChange={(c) => handleField('countryCode', c)}
                    error={touched.mobile ? errors.mobile : undefined}
                    disabled={isDisabled}
                  />

                  {/* Password */}
                  <div className="space-y-1.5">
                    <label
                      className="block text-sm font-semibold text-[var(--text-primary)]"
                      htmlFor="reg-password"
                    >
                      Password{' '}
                      <span className="text-[var(--color-error)]">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--text-muted)]">
                        <Lock size={20} aria-hidden="true" />
                      </div>
                      <input
                        id="reg-password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        required
                        aria-required="true"
                        aria-invalid={touched.password && !!errors.password}
                        value={formData.password}
                        onChange={(e) =>
                          handleField('password', e.target.value)
                        }
                        onBlur={() => handleBlur('password')}
                        placeholder="Create a strong password"
                        disabled={isDisabled}
                        className={`register-input register-input--icon register-input--pr-icon ${
                          touched.password && errors.password
                            ? 'register-input--error'
                            : ''
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={
                          showPassword ? 'Hide password' : 'Show password'
                        }
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
                    <PasswordMeter password={formData.password} />
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1.5">
                    <label
                      className="block text-sm font-semibold text-[var(--text-primary)]"
                      htmlFor="reg-confirm-password"
                    >
                      Confirm Password{' '}
                      <span className="text-[var(--color-error)]">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--text-muted)]">
                        <Lock size={20} aria-hidden="true" />
                      </div>
                      <input
                        id="reg-confirm-password"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        required
                        aria-required="true"
                        aria-invalid={
                          touched.confirmPassword && !!errors.confirmPassword
                        }
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          handleField('confirmPassword', e.target.value)
                        }
                        onBlur={() => handleBlur('confirmPassword')}
                        placeholder="Re-enter your password"
                        disabled={isDisabled}
                        className={`register-input register-input--icon register-input--pr-icon ${
                          touched.confirmPassword && errors.confirmPassword
                            ? 'register-input--error'
                            : ''
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        aria-label={
                          showConfirmPassword
                            ? 'Hide password'
                            : 'Show password'
                        }
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[var(--text-muted)] hover:text-[var(--color-primary)] transition-colors"
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={20} aria-hidden="true" />
                        ) : (
                          <Eye size={20} aria-hidden="true" />
                        )}
                      </button>
                    </div>
                    {fieldError('confirmPassword')}
                    {/* Match indicator */}
                    {formData.confirmPassword &&
                      formData.password === formData.confirmPassword && (
                        <p className="flex items-center gap-1 text-xs text-[var(--color-success)]">
                          <CheckCircle2 size={12} aria-hidden="true" />
                          Passwords match
                        </p>
                      )}
                  </div>

                  {/* Gender */}
                  <GenderSelect
                    value={formData.gender}
                    onChange={(g) => handleField('gender', g)}
                    disabled={isDisabled}
                  />

                  {/* Consents */}
                  <div className="space-y-3 pt-1">
                    <div className="flex items-start gap-3">
                      <input
                        id="reg-terms"
                        type="checkbox"
                        checked={formData.termsAccepted}
                        onChange={(e) =>
                          handleField('termsAccepted', e.target.checked)
                        }
                        className="mt-0.5 h-4 w-4 rounded border-[var(--border-primary)] cursor-pointer accent-[var(--color-primary)] login-checkbox"
                        required
                      />
                      <label
                        htmlFor="reg-terms"
                        className="text-sm text-[var(--text-secondary)] cursor-pointer select-none"
                      >
                        I agree to the{' '}
                        <a
                          href="#"
                          className="font-semibold text-[var(--text-primary)] hover:underline"
                        >
                          Terms of Service
                        </a>{' '}
                        and{' '}
                        <a
                          href="#"
                          className="font-semibold text-[var(--text-primary)] hover:underline"
                        >
                          Privacy Policy
                        </a>
                        .
                        <span className="text-[var(--color-error)]"> *</span>
                      </label>
                    </div>
                    {touched.termsAccepted && errors.termsAccepted && (
                      <p
                        className="flex items-center gap-1 text-xs text-red-400 pl-7"
                        role="alert"
                      >
                        <AlertCircle
                          className="size-3.5 shrink-0"
                          aria-hidden="true"
                        />
                        {errors.termsAccepted}
                      </p>
                    )}

                    <div className="flex items-start gap-3">
                      <input
                        id="reg-location"
                        type="checkbox"
                        checked={formData.liveLocationConsent}
                        onChange={(e) =>
                          handleLocationConsent(e.target.checked)
                        }
                        className="mt-0.5 h-4 w-4 rounded border-[var(--border-primary)] cursor-pointer accent-[var(--color-primary)] login-checkbox"
                      />
                      <label
                        htmlFor="reg-location"
                        className="text-sm text-[var(--text-muted)] cursor-pointer select-none"
                      >
                        <MapPin
                          size={13}
                          className="inline mr-1"
                          aria-hidden="true"
                        />
                        Allow live location sharing for event check-in
                        (optional)
                      </label>
                    </div>

                    <div className="flex items-start gap-3">
                      <input
                        id="reg-marketing"
                        type="checkbox"
                        checked={formData.marketingConsent}
                        onChange={(e) =>
                          handleField('marketingConsent', e.target.checked)
                        }
                        className="mt-0.5 h-4 w-4 rounded border-[var(--border-primary)] cursor-pointer accent-[var(--color-primary)] login-checkbox"
                      />
                      <label
                        htmlFor="reg-marketing"
                        className="text-sm text-[var(--text-muted)] cursor-pointer select-none"
                      >
                        Send me event recommendations and updates (optional)
                      </label>
                    </div>
                  </div>

                  {/* Next Button */}
                  <motion.button
                    type="submit"
                    disabled={isDisabled}
                    aria-busy={loading}
                    whileHover={!isDisabled ? { scale: 1.01, y: -2 } : {}}
                    whileTap={!isDisabled ? { scale: 0.98 } : {}}
                    className={`w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl text-sm font-bold login-primary-btn focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] transition-all disabled:opacity-70 disabled:cursor-not-allowed ${
                      loading ? 'login-btn-pulse' : ''
                    }`}
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      {loading ? (
                        <>
                          <Loader2
                            className="size-4 animate-spin"
                            aria-hidden="true"
                          />
                          Sending verification…
                        </>
                      ) : (
                        <>
                          Continue
                          <ArrowRight size={18} aria-hidden="true" />
                        </>
                      )}
                    </span>
                  </motion.button>
                </form>
              </motion.div>
            )}

            {/* ================================================================
                STEP 3 — Verify: Role fields + Email OTP + Phone OTP
                ================================================================ */}
            {step === 3 && !completed && (
              <motion.div
                key="step-3"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="space-y-5"
              >
                <StepProgress currentStep={3} />

                {/* Back button */}
                <button
                  type="button"
                  onClick={goBack}
                  disabled={submitting}
                  className="flex items-center gap-1.5 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  aria-label="Go back to security"
                >
                  <ArrowLeft size={16} aria-hidden="true" />
                  Back
                </button>

                {/* Heading */}
                <div className="text-center sm:text-left">
                  <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
                    {stepHeading.title}
                  </h1>
                  <p className="text-[var(--text-secondary)] mt-1.5 text-sm">
                    {stepHeading.subtitle}
                  </p>
                </div>

                {/* General error */}
                <AnimatePresence>
                  {errors.general && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
                      role="alert"
                    >
                      <AlertCircle
                        className="size-5 shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <span>{errors.general}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form
                  className="space-y-5"
                  onSubmit={handleStep3Next}
                  noValidate
                >
                  {/* === Dynamic role-specific fields === */}
                  <AnimatePresence mode="wait">
                    {(role === 'organizer' || role === 'admin') && (
                      <motion.div
                        key={`role-fields-${role}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden space-y-4"
                      >
                        {/* Organization (Organizer only) */}
                        {role === 'organizer' && (
                          <div className="space-y-1.5">
                            <label
                              className="block text-sm font-semibold text-[var(--text-primary)]"
                              htmlFor="reg-organization"
                            >
                              Organization Name{' '}
                              <span className="text-[var(--color-error)]">
                                *
                              </span>
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--text-muted)]">
                                <Building2 size={18} aria-hidden="true" />
                              </div>
                              <input
                                id="reg-organization"
                                name="organization"
                                type="text"
                                autoComplete="organization"
                                value={formData.organization}
                                onChange={(e) =>
                                  handleField('organization', e.target.value)
                                }
                                onBlur={() => handleBlur('organization')}
                                placeholder="Acme Corp"
                                disabled={isDisabled}
                                className={`register-input register-input--icon ${
                                  touched.organization && errors.organization
                                    ? 'register-input--error'
                                    : ''
                                }`}
                              />
                            </div>
                            {fieldError('organization')}
                          </div>
                        )}

                        {/* Department (Organizer only) */}
                        {role === 'organizer' && (
                          <div className="space-y-1.5">
                            <label
                              className="block text-sm font-semibold text-[var(--text-primary)]"
                              htmlFor="reg-department"
                            >
                              Department
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--text-muted)]">
                                <Briefcase size={18} aria-hidden="true" />
                              </div>
                              <select
                                id="reg-department"
                                name="department"
                                value={formData.department}
                                onChange={(e) =>
                                  handleField('department', e.target.value)
                                }
                                disabled={isDisabled}
                                className="register-input register-input--icon register-input--select"
                              >
                                <option value="" disabled>
                                  Select Department
                                </option>
                                <option value="marketing">
                                  Marketing & Events
                                </option>
                                <option value="hr">Human Resources</option>
                                <option value="ops">Operations</option>
                                <option value="engineering">Engineering</option>
                                <option value="other">Other</option>
                              </select>
                            </div>
                          </div>
                        )}

                        {/* Authorization Code (Organizer + Admin) */}
                        <div className="space-y-1.5">
                          <label
                            className="block text-sm font-semibold text-[var(--text-primary)]"
                            htmlFor="reg-auth-code"
                          >
                            Authorization Code{' '}
                            <span className="text-[var(--color-error)]">*</span>
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--text-muted)]">
                              <KeyRound size={18} aria-hidden="true" />
                            </div>
                            <input
                              id="reg-auth-code"
                              name="authorizationCode"
                              type="text"
                              value={formData.authorizationCode}
                              onChange={(e) =>
                                handleField(
                                  'authorizationCode',
                                  e.target.value,
                                )
                              }
                              onBlur={() => handleBlur('authorizationCode')}
                              placeholder={
                                role === 'admin'
                                  ? 'ADMIN-2026-FLOWGATEX'
                                  : 'ORG-KEC-2026'
                              }
                              disabled={isDisabled}
                              className={`register-input register-input--icon ${
                                touched.authorizationCode &&
                                errors.authorizationCode
                                  ? 'register-input--error'
                                  : ''
                              }`}
                            />
                            {authCodeValidated && (
                              <CheckCircle2
                                size={18}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-success)]"
                                aria-hidden="true"
                              />
                            )}
                          </div>
                          {fieldError('authorizationCode')}
                          {!authCodeValidated &&
                            formData.authorizationCode.trim() && (
                              <button
                                type="button"
                                onClick={handleValidateAuthCode}
                                disabled={isDisabled}
                                className="text-xs font-semibold text-[var(--color-primary)] hover:underline"
                              >
                                Validate Code
                              </button>
                            )}
                          {authCodeValidated && (
                            <p className="flex items-center gap-1 text-xs text-[var(--color-success)]">
                              <CheckCircle2 size={12} aria-hidden="true" />
                              Authorization code verified
                            </p>
                          )}
                          <p className="text-xs text-[var(--text-muted)] pl-0.5">
                            {role === 'admin'
                              ? 'Admin code is provided by your system administrator.'
                              : 'Organization code is issued during event registration.'}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Email Verification Notice */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-base)] px-4 py-3">
                      <Mail
                        size={16}
                        className="text-[var(--color-primary)] shrink-0"
                        aria-hidden="true"
                      />
                      <span className="text-sm text-[var(--text-secondary)] truncate">
                        {formData.email}
                      </span>
                    </div>
                    <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3">
                      <p className="text-sm text-blue-400">
                        <strong>📧 Email Verification:</strong> After you submit, we'll send a verification link to your email.
                        Please click the link to activate your account.
                      </p>
                    </div>
                  </div>

                  {/* Phone number display (if provided, no verification needed) */}
                  {hasMobile && (
                    <div className="flex items-center gap-2 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-base)] px-4 py-3">
                      <span className="text-sm text-[var(--text-muted)]">
                        📱 {formData.countryCode} {formData.mobile}
                      </span>
                      <span className="ml-auto text-xs text-[var(--text-muted)]">
                        (Optional)
                      </span>
                    </div>
                  )}

                  {/* Next Button */}
                  <motion.button
                    type="submit"
                    disabled={isDisabled || !step3CanAdvance}
                    whileHover={
                      !isDisabled && step3CanAdvance
                        ? { scale: 1.01, y: -2 }
                        : {}
                    }
                    whileTap={
                      !isDisabled && step3CanAdvance ? { scale: 0.98 } : {}
                    }
                    className={`w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl text-sm font-bold login-primary-btn focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] transition-all disabled:opacity-70 disabled:cursor-not-allowed ${
                      loading ? 'login-btn-pulse' : ''
                    }`}
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      {loading ? (
                        <>
                          <Loader2
                            className="size-4 animate-spin"
                            aria-hidden="true"
                          />
                          Validating…
                        </>
                      ) : (
                        <>
                          Review & Submit
                          <ArrowRight size={18} aria-hidden="true" />
                        </>
                      )}
                    </span>
                  </motion.button>
                </form>
              </motion.div>
            )}

            {/* ================================================================
                STEP 4 — Review & Submit
                ================================================================ */}
            {step === 4 && !completed && (
              <motion.div
                key="step-4"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="space-y-5"
              >
                <StepProgress currentStep={4} />

                {/* Back button */}
                <button
                  type="button"
                  onClick={goBack}
                  disabled={submitting}
                  className="flex items-center gap-1.5 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  aria-label="Go back to verification"
                >
                  <ArrowLeft size={16} aria-hidden="true" />
                  Back
                </button>

                {/* Heading */}
                <div className="text-center sm:text-left">
                  <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
                    {stepHeading.title}
                  </h1>
                  <p className="text-[var(--text-secondary)] mt-1.5 text-sm">
                    {stepHeading.subtitle}
                  </p>
                </div>

                {/* General error */}
                <AnimatePresence>
                  {errors.general && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
                      role="alert"
                    >
                      <AlertCircle
                        className="size-5 shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <span>{errors.general}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Review Screen */}
                <ReviewScreen
                  data={{
                    role,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    dob: formData.dob,
                    mobile: formData.mobile,
                    countryCode: formData.countryCode,
                    gender: formData.gender,
                    acceptTerms: formData.termsAccepted,
                    liveLocationConsent: formData.liveLocationConsent,
                    organization: formData.organization,
                    department: formData.department,
                    authorizationCode: formData.authorizationCode,
                    emailVerified: false, // Will be verified via email link after registration
                    phoneVerified: false, // Phone verification disabled
                  }}
                  onEditStep={handleEditStep}
                  disabled={submitting}
                />

                {/* Submit Button */}
                <motion.button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={submitting}
                  aria-busy={submitting}
                  whileHover={!submitting ? { scale: 1.01, y: -2 } : {}}
                  whileTap={!submitting ? { scale: 0.98 } : {}}
                  className={`w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl text-sm font-bold login-primary-btn focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] transition-all disabled:opacity-70 disabled:cursor-not-allowed ${
                    submitting ? 'login-btn-pulse' : ''
                  }`}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {submitting ? (
                      <>
                        <Loader2
                          className="size-4 animate-spin"
                          aria-hidden="true"
                        />
                        Creating account…
                      </>
                    ) : (
                      <>
                        Create Account
                        <ArrowRight size={18} aria-hidden="true" />
                      </>
                    )}
                  </span>
                </motion.button>
              </motion.div>
            )}

            {/* ================================================================
                COMPLETED — Confirmation Screen
                ================================================================ */}
            {completed && (
              <motion.div
                key="completed"
                custom={1}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                <StepProgress currentStep={4} />
                <ConfirmationScreen email={formData.email} role={role} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
