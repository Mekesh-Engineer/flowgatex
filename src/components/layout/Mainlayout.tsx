// =============================================================================
// DEPENDENCIES & IMPORTS
// =============================================================================

// React core imports
import { ReactNode, useEffect, useState, useCallback } from 'react';

// React Router for navigation
import { useLocation, Outlet } from 'react-router-dom';

// Animation library
import { motion, AnimatePresence } from 'framer-motion';

// Internal layout components
import Navbar from './Navbar';
import Footer from './Footer';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export interface MainLayoutProps {
  /** Content to render - if not provided, uses Outlet for nested routes */
  children?: ReactNode;
  /** Whether to show the navbar */
  showNavbar?: boolean;
  /** Whether to show the footer */
  showFooter?: boolean;
  /** Custom class name for the main content area */
  className?: string;
  /** Whether to enable page transition animations */
  enableTransitions?: boolean;
  /** Whether to scroll to top on route change */
  scrollToTop?: boolean;
}

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

const pageVariants = {
  initial: {
    opacity: 0,
    y: 20
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut' as const
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
      ease: 'easeIn' as const
    }
  }
};

// =============================================================================
// MAIN LAYOUT COMPONENT
// =============================================================================

export function MainLayout({
  children,
  showNavbar = true,
  showFooter = true,
  className = '',
  enableTransitions = true,
  scrollToTop = true
}: MainLayoutProps) {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  // Scroll to top on route change
  useEffect(() => {
    if (scrollToTop) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location.pathname, scrollToTop]);

  // Handle hash navigation for smooth scrolling to sections
  useEffect(() => {
    if (location.hash) {
      const element = document.getElementById(location.hash.slice(1));
      if (element) {
        // Delay to allow page content to render first
        const timeoutId = setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
        return () => clearTimeout(timeoutId);
      }
    }
    return undefined;
  }, [location.hash]);

  // Simulate page loading state for route transitions
  useEffect(() => {
    if (enableTransitions) {
      setIsLoading(true);
      const timeoutId = setTimeout(() => setIsLoading(false), 100);
      return () => clearTimeout(timeoutId);
    }
    return undefined;
  }, [location.pathname, enableTransitions]);

  // Handle scroll restoration for browser back/forward
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    return () => {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'auto';
      }
    };
  }, []);

  // Render content - either children or Outlet for nested routes
  const renderContent = useCallback(() => {
    const content = children ?? <Outlet />;

    if (enableTransitions) {
      return (
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex-1"
          >
            {content}
          </motion.div>
        </AnimatePresence>
      );
    }

    return content;
  }, [children, enableTransitions, location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] antialiased">
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-200 focus:px-4 focus:py-2 focus:bg-primary-500 focus:text-white focus:rounded-lg focus:outline-none"
      >
        Skip to main content
      </a>

      {/* Navbar */}
      {showNavbar && <Navbar />}

      {/* Main Content */}
      <main
        id="main-content"
        className={`flex-1 flex flex-col ${className}`}
        role="main"
      >
        {isLoading && enableTransitions ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          renderContent()
        )}
      </main>

      {/* Footer */}
      {showFooter && <Footer />}
    </div>
  );
}

// =============================================================================
// SPECIALIZED LAYOUT VARIANTS
// =============================================================================

/** Layout for public pages with full navbar and footer */
export function PublicLayout({ children, ...props }: Omit<MainLayoutProps, 'showNavbar' | 'showFooter'>) {
  return (
    <MainLayout showNavbar showFooter {...props}>
      {children}
    </MainLayout>
  );
}

/** Layout for auth pages - minimal, no footer */
export function AuthLayout({ children, ...props }: Omit<MainLayoutProps, 'showNavbar' | 'showFooter'>) {
  return (
    <MainLayout showNavbar={false} showFooter={false} {...props}>
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-[var(--bg-primary)] via-[var(--bg-secondary)] to-[var(--bg-primary)]">
        {children}
      </div>
    </MainLayout>
  );
}


/** Layout for minimal pages - navbar only */
export function MinimalLayout({ children, ...props }: Omit<MainLayoutProps, 'showFooter'>) {
  return (
    <MainLayout showFooter={false} {...props}>
      {children}
    </MainLayout>
  );
}

/** Default Layout component for public pages with navbar, footer, and transitions */
export function Layout() {
  return (
    <MainLayout
      showNavbar={true}
      showFooter={true}
      enableTransitions={true}
      scrollToTop={true}
    >
      <Outlet />
    </MainLayout>
  );
}

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

export default MainLayout;

// =============================================================================
// FILE CONNECTIONS SUMMARY
// =============================================================================

/**
 * This file provides all layout components for the FlowGateX application:
 * 
 * MAIN COMPONENTS:
 * - MainLayout: Core layout with configurable navbar/footer
 * - Layout: Default public layout (navbar + footer + transitions)
 * - PublicLayout: Specialized for public pages  
 * - AuthLayout: Minimal layout for authentication pages
 * - MinimalLayout: Layout with navbar only
 * 
 * USAGE:
 * import { Layout, MainLayout } from '@/components/layout/MainLayout';
 * import Layout from '@/components/layout/Layout'; // re-exports from here
 * 
 * DEPENDENCIES:
 * - Navbar component from './Navbar'
 * - Footer component from './Footer' 
 * - Framer Motion for page transitions
 * - React Router for routing integration
 */

