// =============================================================================
// ROLE SELECTOR — Unified role selector with FULL WORKFLOW ENFORCEMENT
// =============================================================================
// ✅ SUPPORTED ROLES: Attendee | Organizer | Admin | Superadmin
// ✅ WORKFLOW: Users can select ANY of the 4 roles during signup
// ✅ VALIDATION: Selected role is validated before account creation
// ✅ MAPPING: 'attendee' (UI) maps to 'user' in Firestore/AuthMapppingAutomated
// ✅ FORM FORMAT: Same format used for all roles (no role-specific fields)
// =============================================================================

import React from 'react';
import { motion } from 'framer-motion';
import { Users, Briefcase, ShieldCheck, Crown } from 'lucide-react';
import type { SignupRole } from '@/features/auth/types/registration.types';

interface RoleSelectorProps {
  value: SignupRole;
  onChange: (role: SignupRole) => void;
  disabled?: boolean;
}

const ROLES: { id: SignupRole; label: string; icon: React.ElementType; summary: string }[] = [
  {
    id: 'attendee',
    label: 'Attendee',
    icon: Users,
    summary: 'Browse events, purchase tickets, and manage your bookings.',
  },
  {
    id: 'organizer',
    label: 'Organizer',
    icon: Briefcase,
    summary: 'Create and manage events, track analytics, and handle attendees.',
  },
  {
    id: 'admin',
    label: 'Admin',
    icon: ShieldCheck,
    summary: 'Full system administration, user management, and monitoring.',
  },
  {
    id: 'superadmin',
    label: 'Super Admin',
    icon: Crown,
    summary: 'Highest-level access: platform-wide control, system config, and audit oversight.',
  },
];

export default function RoleSelector({ value, onChange, disabled }: RoleSelectorProps) {
  const activeIndex = ROLES.findIndex((r) => r.id === value);
  const activeSummary = ROLES[activeIndex]?.summary ?? '';

  return (
    <div className="space-y-3">
      {/* Segmented control */}
      <div
        className="register-role-tabs"
        role="radiogroup"
        aria-label="Select your role"
      >
        {ROLES.map((role) => {
          const Icon = role.icon;
          const isActive = value === role.id;
          return (
            <button
              key={role.id}
              type="button"
              role="radio"
              aria-checked={isActive}
              aria-label={`${role.label} — ${role.summary}`}
              disabled={disabled}
              onClick={() => onChange(role.id)}
              className={`register-role-tab ${isActive ? 'register-role-tab--active' : ''}`}
            >
              {isActive && (
                <motion.span
                  layoutId="register-role-pill"
                  className="register-role-pill"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <Icon size={15} aria-hidden="true" />
                {role.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Role summary */}
      <motion.p
        key={value}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="text-xs text-[var(--text-muted)] leading-relaxed pl-0.5"
        aria-live="polite"
      >
        {activeSummary}
      </motion.p>
    </div>
  );
}
