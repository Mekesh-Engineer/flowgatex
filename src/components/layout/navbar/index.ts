export { SearchModal } from './SearchModal';
export { NotificationsDropdown } from './NotificationsDropdown';
export type { Notification } from './NotificationsDropdown';
export { ThemeToggle } from './ThemeToggle';
export { MegaMenu } from './MegaMenu';
export { MobileMenu } from './MobileMenu';

// ── Navigation Links ────────────────────────────────────────────────────────
export const NAVIGATION_LINKS = [
  { label: 'Home', path: '/' },
  { label: 'Events', path: '/events' },
  { label: 'About', path: '/about' },
  { label: 'Contact', path: '/contact' },
] as const;

// ── Mock Notifications ──────────────────────────────────────────────────────
export const MOCK_NOTIFICATIONS = [
  {
    id: '1',
    title: 'Booking Confirmed',
    message: 'Your ticket for Summer Jazz Festival has been confirmed.',
    time: '5 min ago',
    read: false,
    type: 'success' as const,
  },
  {
    id: '2',
    title: 'Event Reminder',
    message: 'Tech Summit 2026 starts tomorrow at 9:00 AM.',
    time: '1 hour ago',
    read: false,
    type: 'info' as const,
  },
  {
    id: '3',
    title: 'Price Drop Alert',
    message: 'Early-bird pricing ends tonight for Art Expo.',
    time: '3 hours ago',
    read: true,
    type: 'warning' as const,
  },
  {
    id: '4',
    title: 'New Event Near You',
    message: 'Food & Wine Festival added in your city this weekend.',
    time: 'Yesterday',
    read: true,
    type: 'info' as const,
  },
];
