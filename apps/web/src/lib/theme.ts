export const THEMES = ['system', 'light', 'dark'] as const;
export type Theme = (typeof THEMES)[number];

export const THEME_KEY = 'creditq-theme';

export const parseTheme = (value: string | null | undefined): Theme =>
  (THEMES as readonly (string | null | undefined)[]).includes(value) ? (value as Theme) : 'system';

/** Runs before first paint (inlined in <head>) so a chosen theme never flashes the other one. */
export const themeBootScript = `try{var t=localStorage.getItem('${THEME_KEY}');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`;

/** Applies a theme to the page. "system" removes the override and follows the device. */
export const applyTheme = (theme: Theme): void => {
  if (theme === 'system') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;
};

export const readTheme = (): Theme => {
  try {
    return parseTheme(localStorage.getItem(THEME_KEY));
  } catch {
    return 'system';
  }
};

export const saveTheme = (theme: Theme): void => {
  try {
    if (theme === 'system') localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Private mode: the theme still applies for this visit.
  }
  applyTheme(theme);
};
