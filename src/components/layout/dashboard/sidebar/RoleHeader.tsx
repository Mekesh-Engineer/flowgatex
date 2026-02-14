// =============================================================================
// ROLE HEADER — Placed at the top of the sidebar, below the toggle button
// =============================================================================
// User/Attendee: Purple-to-pink gradient with profile initials
// Organizer:     Blue-to-cyan gradient with organization name
// Admin:         Red-to-orange gradient with system icon
// =============================================================================

import { UserRole } from '@/lib/constants';
import type { User } from '@/types';

interface RoleHeaderProps {
  role: UserRole;
  user: User | null;
  isCollapsed: boolean;
}

// ── Gradient & icon config per role ──────────────────────────────────────────
const ROLE_CONFIG = {
  [UserRole.USER]: {
    gradient: 'from-purple-500 to-pink-500',
    label: 'Attendee',
    iconBg: 'bg-purple-600/20',
  },
  [UserRole.ORGANIZER]: {
    gradient: 'from-primary-500 to-cyan-400',
    label: 'Organizer',
    iconBg: 'bg-primary-600/20',
  },
  [UserRole.ORG_ADMIN]: {
    gradient: 'from-amber-500 to-orange-400',
    label: 'Org Admin',
    iconBg: 'bg-amber-600/20',
  },
  [UserRole.ADMIN]: {
    gradient: 'from-red-500 to-orange-400',
    label: 'System Admin',
    iconBg: 'bg-red-600/20',
  },
  [UserRole.SUPER_ADMIN]: {
    gradient: 'from-red-600 to-orange-500',
    label: 'Super Admin',
    iconBg: 'bg-red-700/20',
  },
};

function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function RoleHeader({ role, user, isCollapsed }: RoleHeaderProps) {
  const config = ROLE_CONFIG[role] ?? ROLE_CONFIG[UserRole.USER];
  const isAdmin = role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;
  const isOrganizer = role === UserRole.ORGANIZER;

  // ── Collapsed: show only the avatar ────────────────────────────────────
  if (isCollapsed) {
    return (
      <div className="flex justify-center py-2">
        <div className={`size-8 rounded-lg bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-sm`}>
          {isAdmin ? (
            <svg className="size-4 text-white" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/></svg>
          ) : (
            <span className="text-[11px] font-bold text-white leading-none">{getInitials(user?.displayName)}</span>
          )}
        </div>
      </div>
    );
  }

  // ── Expanded ───────────────────────────────────────────────────────────
  return (
    <div className={`mb-3 p-2.5 rounded-lg bg-gradient-to-r ${config.gradient} shadow-sm`}>
      <div className="flex items-center gap-x-2.5">
        {/* Avatar / Icon */}
        <div className="size-9 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
          {isAdmin ? (
            <svg className="size-5 text-white" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/></svg>
          ) : (
            <span className="text-sm font-bold text-white leading-none">{getInitials(user?.displayName)}</span>
          )}
        </div>

        {/* Name & role tag */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white truncate">
            {isAdmin
              ? (user?.displayName || 'Administrator')
              : isOrganizer
                ? (user?.displayName || 'Organizer')
                : (user?.displayName || 'Attendee')}
          </p>
          <span className="inline-flex items-center gap-x-1 mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/25 text-white leading-none">
            {config.label}
          </span>
        </div>
      </div>
    </div>
  );
}
