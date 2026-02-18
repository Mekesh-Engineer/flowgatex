import { useState, useEffect, useMemo } from 'react';

const CART_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

interface CartExpiryState {
  timeRemaining: number;
  isWarning: boolean;
  isExpired: boolean;
  formattedTime: string;
}

export function useCartExpiry(oldestAddedAt: number | null): CartExpiryState {
  const expiresAt = useMemo(
    () => (oldestAddedAt ? oldestAddedAt + CART_EXPIRY_MS : null),
    [oldestAddedAt]
  );

  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!expiresAt) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const timeRemaining = expiresAt ? Math.max(0, expiresAt - now) : CART_EXPIRY_MS;
  const isExpired = timeRemaining <= 0;
  const isWarning = timeRemaining > 0 && timeRemaining <= 5 * 60 * 1000; // 5 minutes

  const minutes = Math.floor(timeRemaining / 60000);
  const seconds = Math.floor((timeRemaining % 60000) / 1000);
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return { timeRemaining, isWarning, isExpired, formattedTime };
}

export default useCartExpiry;
