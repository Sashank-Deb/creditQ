/**
 * Short vibrations for taps that matter.
 *
 * Android and desktop Chrome have `navigator.vibrate`. iPhone does not (WebKit never shipped
 * it, in Safari or an installed web app). Since iOS 17.4 Safari does give a light haptic tick
 * when a user toggles an `<input type="checkbox" switch>`, so on iPhone we toggle a hidden one.
 * It only fires from a real tap, which is where every call here comes from.
 */
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

/** Pulses are the even entries of a vibrate pattern (the odd ones are pauses). */
export const pulseCount = (pattern: number | readonly number[]): number =>
  typeof pattern === 'number' ? 1 : pattern.filter((_, i) => i % 2 === 0).length;

const PAUSE_MS = 90;

let tapLabel: HTMLLabelElement | null = null;

/** Toggles a hidden iOS "switch" checkbox, which makes Safari tick. */
const iosTap = (): void => {
  if (!tapLabel) {
    const label = document.createElement('label');
    label.setAttribute('aria-hidden', 'true');
    label.style.cssText =
      'position:fixed;left:-100px;top:-100px;width:1px;height:1px;opacity:0;pointer-events:none';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.setAttribute('switch', '');
    input.tabIndex = -1;
    label.append(input);
    document.body.append(label);
    tapLabel = label;
  }
  tapLabel.click();
};

const isIphone = (): boolean =>
  typeof navigator !== 'undefined' &&
  (/iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

const defaultFallback = (): (() => void) | undefined =>
  typeof document !== 'undefined' && isIphone() ? iosTap : undefined;

export const haptic = (
  kind: HapticKind,
  nav: Vibrator | undefined = typeof navigator === 'undefined' ? undefined : navigator,
  fallback: (() => void) | undefined = defaultFallback(),
): void => {
  try {
    const pattern = HAPTIC_PATTERNS[kind];
    if (typeof nav?.vibrate === 'function') {
      nav.vibrate(pattern);
      return;
    }
    if (!fallback) return;
    fallback();
    // Later pulses wait a beat, like the gaps in a vibrate pattern.
    for (let i = 1; i < pulseCount(pattern); i += 1) setTimeout(fallback, i * PAUSE_MS);
  } catch {
    // Haptics are a nicety; never let them break a tap.
  }
};
