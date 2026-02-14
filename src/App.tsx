import AppRoutes from './routes/AppRoutes';
import { useCartSync } from '@/hooks/useCartSync';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import useAuth from '@/features/auth/hooks/useAuth';
import { useSettingsSync } from '@/hooks/useSettingsSync';

// =============================================================================
// APP COMPONENT
// =============================================================================

function App() {
  // Initialize Firebase auth listener at the root level.
  // This ensures auth state is available on ALL pages (including public pages
  // like Home) and prevents duplicate Firestore listeners from route guards.
  useAuth();

  // Sync Firestore SettingInfo (platform + org settings) into Zustand in real-time.
  // Must run after useAuth so user context is available for org-level settings.
  useSettingsSync();

  // Sync Zustand cart ↔ Firestore when a user is authenticated
  useCartSync();

  return (
    <ErrorBoundary>
      <div id="main-content">
        <AppRoutes />
      </div>
    </ErrorBoundary>
  );
}

export default App;

