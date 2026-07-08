/**
 * useOrientationLock
 *
 * Handles screen orientation locking and layout stability across:
 * - iOS Safari browser (lock API not supported — uses CSS/event fallback)
 * - iOS installed PWA / standalone mode (lock API not supported — uses CSS/event fallback)
 * - Android PWA (lock API supported — native lock applied)
 * - Desktop browsers (no-op, not relevant)
 *
 * Strategy:
 * 1. Attempt Screen Orientation API lock (cross-platform, works on Android PWA).
 * 2. Silently ignore rejections (iOS always rejects with NotSupportedError).
 * 3. Listen to orientationchange and resize events to trigger a layout
 *    stabilization signal via a data attribute on <html>, allowing CSS rules
 *    to counteract rotation-induced layout breakage without any UI overlay.
 */

import { useEffect } from 'react';

/**
 * screen.orientation.lock() is not present in TypeScript's lib.dom.d.ts
 * (it is a newer spec addition). We cast to a local interface to call it
 * safely while keeping strict mode on for the rest of the codebase.
 */
interface ScreenOrientationWithLock extends ScreenOrientation {
  lock(orientation: OrientationLockType): Promise<void>;
}

type OrientationLockType =
  | 'any'
  | 'natural'
  | 'landscape'
  | 'portrait'
  | 'portrait-primary'
  | 'portrait-secondary'
  | 'landscape-primary'
  | 'landscape-secondary';

/** Returns true when running as an installed PWA in standalone display mode. */
function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS-specific standalone detection
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** Returns true on iOS (both Safari browser and installed PWA). */
function isIOS(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    // iPadOS 13+ reports as MacIntel with touch support
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

/** Returns true on Android. */
function isAndroid(): boolean {
  return /Android/.test(navigator.userAgent);
}

/**
 * Attempt to lock orientation via the Screen Orientation API.
 * Fails silently — iOS Safari and iOS PWA will always reject this.
 * Android PWA (Chrome) supports it when in standalone mode.
 */
async function attemptOrientationLock(): Promise<void> {
  try {
    const orientation = screen.orientation as ScreenOrientationWithLock | undefined;
    if (orientation && typeof orientation.lock === 'function') {
      await orientation.lock('portrait');
    }
  } catch {
    // Expected on iOS Safari, iOS PWA, and desktop browsers — not an error.
  }
}

/**
 * Updates a data attribute on <html> that reflects the current orientation.
 * CSS can target [data-orientation="landscape"] to apply stabilisation rules.
 */
function syncOrientationAttribute(): void {
  const isPortrait = window.matchMedia('(orientation: portrait)').matches;
  document.documentElement.setAttribute(
    'data-orientation',
    isPortrait ? 'portrait' : 'landscape'
  );
}

export function useOrientationLock(): void {
  useEffect(() => {
    const env = {
      ios: isIOS(),
      android: isAndroid(),
      standalone: isStandalone(),
    };

    // Attempt native lock regardless of platform; it will succeed on
    // Android PWA and fail silently everywhere else.
    attemptOrientationLock();

    // Set initial orientation attribute.
    syncOrientationAttribute();

    // --- Event listeners for layout stabilisation ---
    // orientationchange fires on both iOS Safari and Android.
    const handleOrientationChange = (): void => {
      syncOrientationAttribute();
      // Re-attempt lock after physical rotation (Android PWA needs this).
      if (env.android && env.standalone) {
        attemptOrientationLock();
      }
    };

    // resize is a reliable fallback on iOS PWA where orientationchange
    // can fire before dimensions are updated.
    const handleResize = (): void => {
      syncOrientationAttribute();
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleResize);

    // Listen for matchMedia changes — most reliable across all platforms.
    const portraitMQ = window.matchMedia('(orientation: portrait)');
    const handleMQChange = (): void => {
      syncOrientationAttribute();
    };
    portraitMQ.addEventListener('change', handleMQChange);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleResize);
      portraitMQ.removeEventListener('change', handleMQChange);
    };
  }, []);
}
