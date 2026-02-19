
import { getDb } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

export interface SystemStatus {
  firestore: 'operational' | 'degraded' | 'down';
  razorpay: 'operational' | 'degraded' | 'down';
  email: 'operational' | 'degraded' | 'down';
}

export const checkSystemHealth = async (): Promise<SystemStatus> => {
  const status: SystemStatus = {
    firestore: 'operational',
    razorpay: 'operational',
    email: 'operational',
  };

  // 1. Check Firestore
  try {
    // We try to read a document. The 'unavailable' error code indicates offline/connectivity issues.
    // We target a document that might exist or not, we just care about the connection.
    const ref = doc(getDb(), 'system_stats', 'health_check');
    // We use a short timeout race to avoid hanging if offline
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000));
    
    await Promise.race([
        getDoc(ref),
        timeout
    ]);
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    if (err.code === 'unavailable' || err.message === 'timeout' || err.message?.includes('offline')) {
        status.firestore = 'down';
    } else {
        // Permission denied or not found means we ARE connected
        status.firestore = 'operational';
    }
  }

  // 2. Check Razorpay
  // We check if the CDN is reachable
  try {
      await fetch('https://checkout.razorpay.com/v1/checkout.js', { method: 'HEAD', mode: 'no-cors' });
      // opaque response (type: opaque) with status 0 is returned for no-cors, which means successful connection
      // If it throws, it's a network error
  } catch {
      status.razorpay = 'down';
  }

  // 3. Check Email 
  // Placeholder logic as we cannot easily check SendGrid/etc from client without a proxy
  // We assume operational unless we have a specific flag in Firestore (e.g. maintenance mode)
  
  return status;
};
