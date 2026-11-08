'use client';

import { useEffect } from 'react';

/**
 * iOS Safari keeps the layout viewport the same height when the keyboard opens, so a bar
 * pinned to the bottom ends up hidden behind it. This publishes the keyboard's height as
 * `--kb-inset` (from the visual viewport) so a fixed bar can sit just above the keyboard.
 */
export function useKeyboardInset(): void {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return undefined;
    const root = document.documentElement;
    const update = () => {
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      root.style.setProperty('--kb-inset', `${Math.round(inset)}px`);
    };
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
      root.style.removeProperty('--kb-inset');
    };
  }, []);
}
