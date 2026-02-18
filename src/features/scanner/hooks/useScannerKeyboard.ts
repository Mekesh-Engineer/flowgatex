// =============================================================================
// useScannerKeyboard — Keyboard shortcut handler for the Scanner page
// =============================================================================

import { useEffect } from 'react';
import { KEYBOARD_SHORTCUTS } from '../constants/scanner.constants';
import type { ScannerState } from '../types/scanner.types';

interface UseScannerKeyboardOptions {
  scannerState: ScannerState;
  onStartScanning: () => void;
  onStopScanning: () => void;
  onOpenManual: () => void;
  onToggleFlashlight: () => void;
  onOpenSettings: () => void;
  onTriggerUpload: () => void;
  onCloseAllModals: () => void;
}

/**
 * Registers global keyboard shortcuts for the scanner page.
 * Ignores events when the user is focused on an input/textarea/select.
 */
export function useScannerKeyboard(opts: UseScannerKeyboardOptions): void {
  const {
    scannerState,
    onStartScanning,
    onStopScanning,
    onOpenManual,
    onToggleFlashlight,
    onOpenSettings,
    onTriggerUpload,
    onCloseAllModals,
  } = opts;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when user is typing in a form field
      const tag = (e.target as Element)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      switch (e.key) {
        case KEYBOARD_SHORTCUTS.TOGGLE_SCAN:
          e.preventDefault();
          if (scannerState === 'scanning' || scannerState === 'processing') {
            onStopScanning();
          } else if (
            scannerState === 'idle' ||
            scannerState === 'ready' ||
            scannerState === 'paused' ||
            scannerState === 'valid' ||
            scannerState === 'invalid' ||
            scannerState === 'duplicate'
          ) {
            onStartScanning();
          }
          break;

        case 'm':
        case 'M':
          onOpenManual();
          break;

        case 'f':
        case 'F':
          onToggleFlashlight();
          break;

        case 's':
        case 'S':
          onOpenSettings();
          break;

        case 'u':
        case 'U':
          onTriggerUpload();
          break;

        case KEYBOARD_SHORTCUTS.ESCAPE:
          onCloseAllModals();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    scannerState,
    onStartScanning,
    onStopScanning,
    onOpenManual,
    onToggleFlashlight,
    onOpenSettings,
    onTriggerUpload,
    onCloseAllModals,
  ]);
}
