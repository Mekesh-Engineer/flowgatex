import { useState, useRef, useCallback, useEffect } from 'react';
import { validateQRCode } from '../services/iotService';
import type { ScanResult } from '../types/iot.types';
import { showSuccess, showError } from '@/components/common/Toast';

interface UseQRScannerOptions {
  eventId: string;
  onSuccess?: (result: ScanResult) => void;
  onError?: (error: string) => void;
}

export function useQRScanner({ eventId, onSuccess, onError }: UseQRScannerOptions) {
  const [isScanning, setIsScanning] = useState(false);
  const [lastScan, setLastScan] = useState<ScanResult | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startScanning = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsScanning(true);
      }
    } catch (error) {
      console.error('Camera access denied:', error);
      onError?.('Camera access denied');
    }
  }, [onError]);

  const stopScanning = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  }, []);

  const processCode = useCallback(
    async (code: string) => {
      if (!code) return;

      const result = await validateQRCode(code, eventId);
      setLastScan(result);

      if (result.success) {
        showSuccess(`Valid ticket: ${result.attendeeName}`);
        onSuccess?.(result);
      } else {
        showError(result.error || 'Invalid ticket');
        onError?.(result.error || 'Invalid ticket');
      }
    },
    [eventId, onSuccess, onError]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, [stopScanning]);

  return {
    isScanning,
    lastScan,
    videoRef,
    startScanning,
    stopScanning,
    processCode,
  };
}

export default useQRScanner;
