export type Theme = 'light' | 'dark' | 'auto';

export interface Breadcrumb {
  label: string;
  href: string;
  isLast: boolean;
}

export interface DashboardLayoutProps {
  children?: React.ReactNode;
}

export interface SidebarConfig {
  showIoT: boolean;
  showStats: boolean;
  showQuickSettings: boolean;
  showSystemHealth: boolean;
}
