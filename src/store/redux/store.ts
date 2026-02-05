import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these paths in the state for serialization check
        ignoredPaths: ['auth.user'],
        ignoredActions: ['auth/setUser'],
      },
    }),
  devTools: import.meta.env.VITE_ENABLE_DEBUG === 'true',
});

// Infer types from the store
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
