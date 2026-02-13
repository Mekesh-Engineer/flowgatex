import AppRoutes from './routes/AppRoutes';
import { useCartSync } from '@/hooks/useCartSync';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

// =============================================================================
// APP COMPONENT
// =============================================================================

function App() {
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
