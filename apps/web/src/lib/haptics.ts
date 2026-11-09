/** Short vibrations for taps that matter. A no-op where the device or browser has none. */
export const HAPTIC_PATTERNS = {
  /** Switching a tab. */
  tab: 10,
  /** Saved settings. */
  save: 18,
  /** A payment was recorded: a quick double pulse. */
  success: [24, 40, 36],
} as const satisfies Record<string, number | number[]>;

export type HapticKind = keyof typeof HAPTIC_PATTERNS;

interface Vibrator {
  vibrate?: (pattern: number | number[]) => boolean;
}

export const haptic = (
  kind: HapticKind,
  nav: Vibrator | undefined = typeof navigator === 'undefined' ? undefined : navigator,
): void => {
  try {
    nav?.vibrate?.(HAPTIC_PATTERNS[kind]);
  } catch {
    // Haptics are a nicety; never let them break a tap.
  }
};
