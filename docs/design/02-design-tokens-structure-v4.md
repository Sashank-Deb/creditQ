# 02 - Design tokens v4 (CreditQ, Direction B, Linen & Lacquer, Base-style structure)

Supersedes v3 tokens. The hues, the six tile gradients and the serif plus mono character are unchanged from v3. v4 adds structure inspired by Uber's Base design system: a 4px grid, named type roles, semantic colour tokens on top of primitives, a radius scale, a 3-step elevation ramp, interaction states and motion tokens. **Components reference only semantic or component tokens, never primitives or raw hex.** The one exception is tile pattern overlays, which are part of each tile primitive.

Token layers: **primitives → semantic → component**. The live CSS is inside every v4 screen (`<style>`); `components.html` shows every token and state.

---

## 1. Primitives

| Primitive  | Value                                            | Primitive         | Value                                    |
| ---------- | ------------------------------------------------ | ----------------- | ---------------------------------------- |
| linen-50   | #FFF9EE                                          | gold-500          | #D4A02A                                  |
| linen-100  | #FBF5EA                                          | gold-400          | #E3B851                                  |
| linen-200  | #EFE6D6                                          | gold-600          | #B8862B                                  |
| linen-300  | #E6DBC8 (new, deeper linen for wells and inputs) | gold-700          | #8C6420                                  |
| cocoa-950  | #1E1816                                          | gold-800          | #7A5512 (new, dark-mode snackbar action) |
| cocoa-900  | #2A221F                                          | gold-100          | #F6E7C1                                  |
| cocoa-850  | #30271F                                          | gold-dark-bg      | #3D3120                                  |
| cocoa-800  | #3A2D2A (espresso)                               | vermilion-600     | #A8321F                                  |
| cocoa-750  | #362C28                                          | vermilion-300     | #E8876A                                  |
| cocoa-700  | #6E5A52                                          | vermilion-100     | #F5DCD5                                  |
| cocoa-600  | #76615A (new, tertiary content)                  | vermilion-dark-bg | #4A2A20                                  |
| cocoa-350  | #9C8B7C (new, dark tertiary)                     | jade-700          | #2F4F46                                  |
| cocoa-300  | #BFAE9C                                          | jade-300          | #9CC3AE                                  |
| cocoa-well | #16110F (new, dark well)                         | jade-100          | #DDE7E1                                  |
| cream-100  | #F6ECDA                                          | jade-dark-bg      | #22332D                                  |
| cream-200  | #F4EAD8                                          | cream-ink         | #FFF7EA (tile ink)                       |

Tile primitives (`--tile-<name>-from/-to/-ink`). These are unchanged from v3; worst-case contrast includes an 8% pattern overlay.

| Tile      | From    | To      | Ink     | Worst case |
| --------- | ------- | ------- | ------- | ---------- |
| gold      | #D1A443 | #E3B851 | #3A2D2A | 4.9:1      |
| lacquer   | #7A1F1A | #A8321F | #FFF7EA | 5.4:1      |
| jade      | #2F4F46 | #456555 | #FFF7EA | 5.0:1      |
| vermilion | #A9381F | #B43F27 | #FFF7EA | 4.7:1      |
| indigo    | #283044 | #46557A | #FFF7EA | 5.6:1      |
| cocoa     | #3A2D2A | #6E5148 | #FFF7EA | 5.5:1      |

## 2. Semantic colour tokens (light / dark)

Ratios are WCAG 2.x, measured against the background the token is used on.

| Group      | Token                                     | Light                       | Dark                        | Contrast (light / dark)                                                                                                                           |
| ---------- | ----------------------------------------- | --------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| background | bg-primary                                | linen-200 #EFE6D6           | cocoa-950 #1E1816           | page                                                                                                                                              |
|            | bg-secondary                              | linen-100 #FBF5EA           | cocoa-900 #2A221F           | surfaces, sheets, strip                                                                                                                           |
|            | bg-tertiary                               | linen-300 #E6DBC8           | cocoa-well #16110F          | wells, inputs, selected chip                                                                                                                      |
|            | bg-inverse-primary                        | cocoa-800 #3A2D2A           | cream-200 #F4EAD8           | primary button, snackbar, desktop sidebar                                                                                                         |
| content    | content-primary                           | #3A2D2A                     | #F4EAD8                     | 10.7 / 14.7 on bg-primary                                                                                                                         |
|            | content-secondary                         | #6E5A52                     | #BFAE9C                     | 5.2 (4.7 on tertiary) / 7.2                                                                                                                       |
|            | content-tertiary                          | #76615A                     | #9C8B7C                     | 4.7 on primary, 5.3 on secondary / 5.3, 4.8. **Light: not for small text on bg-tertiary (4.2:1)**; use content-secondary there (placeholders do). |
|            | content-inverse-primary                   | #F6ECDA                     | #2A221F                     | 11.3 / 13.1                                                                                                                                       |
| border     | border-opaque                             | rgba(88,66,60,.16)          | rgba(244,234,216,.16)       | surfaces, inputs                                                                                                                                  |
|            | border-transparent                        | rgba(88,66,60,.08)          | rgba(244,234,216,.08)       | list dividers                                                                                                                                     |
|            | border-selected                           | #3A2D2A                     | #F4EAD8                     | selected chip/option, secondary button, focus field (12.2:1)                                                                                      |
| accent     | accent / content-on-accent                | #D4A02A / #3A2D2A           | #E3B851 / #2A221F           | 5.6 / 8.4. Gold is a fill, dot or underline only; never text on paper (1.9:1).                                                                    |
| status     | positive / bg-positive                    | #2F4F46 / #DDE7E1           | #9CC3AE / #22332D           | 7.1 / 6.9                                                                                                                                         |
|            | warning / bg-warning / content-on-warning | #D4A02A / #F6E7C1 / #3A2D2A | #E3B851 / #3D3120 / #E3B851 | 10.8 / 6.8. Gold is the warning fill or icon; warning text uses content-on-warning.                                                               |
|            | negative / bg-negative                    | #A8321F / #F5DCD5           | #E8876A / #4A2A20           | 5.1 / 4.9 (5.4 / 6.8 on bg-primary)                                                                                                               |
| focus      | ring                                      | gold-700 #8C6420            | gold-400 #E3B851            | 4.3 / 9.4 (3:1 required)                                                                                                                          |
| overlay    | scrim                                     | rgba(26,18,16,.48)          | rgba(8,6,5,.64)             | behind sheets                                                                                                                                     |
| chart      | chart-1/2/3                               | #B8862B / #A8321F / #456555 | #E3B851 / #E8876A / #9CC3AE | one per card                                                                                                                                      |

## 3. Component tokens

| Component token                                  | Light                                                       | Dark                                          | Used by                                         |
| ------------------------------------------------ | ----------------------------------------------------------- | --------------------------------------------- | ----------------------------------------------- |
| content-on-tile-dark                             | cream-ink                                                   | same                                          | text on lacquer, jade, vermilion, indigo, cocoa |
| content-on-tile-light                            | cocoa-800                                                   | same                                          | text on gold; primary button text on dark tiles |
| bg-tile-action-dark                              | cream-ink                                                   | same                                          | "Mark as paid" on dark tiles (12.4:1)           |
| bg-tile-action-light / content-tile-action-light | cocoa-800 / cream-100                                       | same                                          | "Mark as paid" on the gold tile (11.3:1)        |
| bg-tile-tag-dark                                 | rgba(0,0,0,.24)                                             | same                                          | "1 day late" tag on dark tiles                  |
| border-tile                                      | rgba(58,45,42,.16)                                          | same                                          | tile edge, thumbnails                           |
| chip-metal-from/-to/-line/-edge                  | #F2DFB0 / #C9A25B / rgba(80,55,10,.55) / rgba(58,45,42,.35) | same                                          | chip graphic                                    |
| content-snack-action                             | gold-400 (7.1:1)                                            | **gold-800** (5.6:1; gold-700 failed at 4.45) | "Undo"                                          |
| bg-nav-selected                                  | rgba(246,236,218,.12)                                       | rgba(42,34,31,.08)                            | desktop sidebar active                          |
| bg-lock-* / content-lock-*                       | warm espresso gradient, cream                               | same                                          | simulated OS lock screen                        |
| btn-large / btn-default / btn-compact            | 56 / 48 / 36 px                                             |                                               | button heights                                  |
| topbar                                           | 48 px                                                       |                                               | top bar (Android height chosen)                 |

## 4. Type ramp (every text element uses one role)

| Role         | Font                 | Weight | Size / line-height      | Use                                             |
| ------------ | -------------------- | ------ | ----------------------- | ----------------------------------------------- |
| display-s    | Fraunces stack       | 700    | 44/52                   | Spends total, big moments                       |
| display-xs   | Fraunces stack       | 700    | 36/44                   | focus-tile due date, amount input               |
| heading-l    | Fraunces             | 600    | 32/40                   | top-level screen titles (Settings, empty Home)  |
| heading-m    | Fraunces             | 600    | 28/36                   | wizard question, done title                     |
| heading-s    | Fraunces             | 600    | 24/32                   | sheet titles, non-focus tile dates              |
| heading-xs   | Fraunces             | 600    | 20/28                   | issuer name, section titles, brand              |
| label-l      | system sans          | 600    | 18/24                   | large (dock) buttons                            |
| label-m      | system sans          | 600    | 16/20                   | default buttons, segmented control, list values |
| label-s      | system sans          | 500    | 14/16                   | compact buttons, chips, pills, field labels     |
| label-xs     | system sans          | 600    | 12/16                   | tags, chart axis                                |
| paragraph-l  | system sans          | 400    | 18/28                   | (reserved)                                      |
| paragraph-m  | system sans          | 400    | 16/24                   | body, list keys                                 |
| paragraph-s  | system sans          | 400    | 14/20                   | supporting copy, banners, snackbar              |
| paragraph-xs | system sans          | 400    | 12/20                   | footnotes, errors                               |
| mono-s       | JetBrains Mono stack | 500    | 14/20, .08em            | card digits only                                |
| mono-xs      | JetBrains Mono stack | 500    | 12/16, .08em, uppercase | cardholder on tile, tiny overlines              |

Stacks: display `'Fraunces','Iowan Old Style','Palatino Linotype',Palatino,Georgia,serif`; sans `ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Noto Sans",sans-serif`; mono `'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,Consolas,monospace`. Self-host Fraunces and JetBrains Mono (OFL) in the product. The simulated OS lock-screen clock (72/80) sits outside the app ramp.

## 5. Spacing (4px grid)

`space-100` 4 · `200` 8 · `300` 12 · `400` 16 · `500` 20 · `600` 24 · `700` 32 · `800` 40 · `900` 48 · `1000` 64.
Phone side margins 16; top bar 48; list rows 56; tile padding 20, internal gap 12; stack gaps 8/12/16. An automated audit of all v4 HTML found **no off-grid spacing, size or line-height values**. The only exceptions are 1px and 2px borders and the device frame (390px wide, which is fixed by the device).

## 6. Radius

| Token          | Value | Use                                                                   |
| -------------- | ----- | --------------------------------------------------------------------- |
| radius-tag     | 4     | tags (count badge, "1 day late", "Paid"), chart bar bases, thumbnails |
| radius-nested  | 8     | inputs, chips, options inside sheets, avatars, back button            |
| radius-default | 12    | cards and surfaces, banners, snackbar, segmented control              |
| radius-large   | 16    | sheets (top corners), dialogs, card tiles, empty-state well           |
| radius-pill    | 999   | **all buttons** (espresso pill kept from v3), under-tile pills, "+"   |

Deviation from Base, on purpose: buttons inside containers stay pills to keep v3's look, so on-tile actions are compact pills.

## 7. Elevation

| Level              | Treatment                                                                | Token                               |
| ------------------ | ------------------------------------------------------------------------ | ----------------------------------- |
| 0 page             | bg-primary + grain                                                       | none                                |
| 1 surface          | flat, border-opaque 1px                                                  | none                                |
| 2 raised tile      | `0 1px 2px rgba(58,45,42,.12), 0 4px 12px rgba(58,45,42,.12)`            | shadow-200                          |
| 3 sheet / snackbar | `0 -4px 8px rgba(26,18,16,.08), 0 -12px 32px rgba(26,18,16,.20)` + scrim | shadow-300                          |
| (utility)          | `0 1px 2px rgba(58,45,42,.08)`                                           | shadow-100: thumbnails, small lifts |

Dark mode uses black-based versions of the same three steps.

## 8. Interaction states (all interactive elements, class `.ia`)

| State                              | Treatment                                                                    |
| ---------------------------------- | ---------------------------------------------------------------------------- |
| Hover                              | `::after` overlay of the element's content colour (`currentColor`) at **4%** |
| Pressed                            | overlay **8%** + `transform: scale(.98)`                                     |
| Focus                              | `outline: 2px solid var(--ring); outline-offset: 2px` (`:focus-visible`)     |
| Disabled                           | opacity **.4**, no overlay, no pointer events                                |
| Selected (chips, options, segment) | 2px inset border-selected + bg-tertiary; segment adds a 4px gold underline   |

Button sizes: large 56 (bottom dock), default 48, compact 36 (on-tile actions). Compact buttons and chips (40) get an invisible hit area to 44 (`.hit::before`, 4px above and below).

**Bottom button dock** (`.dock`): sticky at the bottom of wizards, sheets, card detail and the calendar screen. Padding 16; when content scrolls under it an IntersectionObserver adds `.raised` (top hairline + soft shadow).

## 9. Motion

| Token          | Duration | Easing                      | Use                                       |
| -------------- | -------- | --------------------------- | ----------------------------------------- |
| enter          | 500ms    | cubic-bezier(0.22,1,0.36,1) | sheet slide-up, snackbar in, review modal |
| move           | 500ms    | cubic-bezier(0.83,0,0.17,1) | reorder (tile moving into focus)          |
| exit (passive) | 400ms    | cubic-bezier(0.64,0,0.78,0) | snackbar auto-exit after 4s               |
| dismiss        | 200ms    | cubic-bezier(0.11,0,0.5,0)  | sheet close, scrim fade-out               |
| fade           | 150ms    | linear                      | colour, opacity, state layer              |

`prefers-reduced-motion: reduce` sets all durations to 1ms.

Working demo: on `home.html`, "Mark as paid" opens the amount sheet (enter + scrim). Save or Skip dismisses it, marks the tile paid, and shows "Marked paid. Undo" for 4s (passive exit). Undo restores the tile; Esc or a scrim tap closes the sheet. Add `#open` or `#saved` to the URL to preview either state.

Haptics idea (docs only, Android PWA): call `navigator.vibrate(12)` on a successful "Mark as paid" (iOS Safari ignores it). Respect reduced-motion and keep it off for repeated actions.

## 10. Content rules

Sentence case everywhere except mono overlines. Money is always ₹ plus numerals with en-IN grouping (`Intl.NumberFormat("en-IN", {style:"currency", currency:"INR", maximumFractionDigits:0})`), for example ₹3,89,275, and is never spelled out. Dates use "Mon, 3 Mar"; times use "9:00 am".

## 11. shadcn/ui CSS variables (HSL)

shadcn's role names map onto the semantic tokens. The app's own semantic names are exposed alongside them for custom components.

```css
@layer base {
  :root {
    --background: 38 44% 89%; /* bg-primary */
    --foreground: 11 16% 20%; /* content-primary */
    --card: 39 68% 95%; /* bg-secondary */
    --card-foreground: 11 16% 20%;
    --popover: 39 68% 95%;
    --popover-foreground: 11 16% 20%;
    --primary: 11 16% 20%; /* bg-inverse-primary (espresso pill) */
    --primary-foreground: 39 61% 91%; /* content-inverse-primary */
    --secondary: 38 37% 84%; /* bg-tertiary */
    --secondary-foreground: 11 16% 20%;
    --muted: 38 37% 84%;
    --muted-foreground: 17 15% 38%; /* content-secondary */
    --accent: 42 67% 50%; /* gold */
    --accent-foreground: 11 16% 20%;
    --destructive: 8 69% 39%; /* negative */
    --destructive-foreground: 39 61% 91%;
    --border: 13 19% 29% / 0.16; /* border-opaque */
    --input: 13 19% 29% / 0.16;
    --ring: 38 63% 34%; /* gold-700 */
    --radius: 0.75rem; /* radius-default 12 */
    --chart-1: 39 62% 45%;
    --chart-2: 8 69% 39%;
    --chart-3: 150 19% 33%;
    /* app semantic extras */
    --content-tertiary: 15 13% 41%;
    --border-transparent: 13 19% 29% / 0.08;
    --border-selected: 11 16% 20%;
    --positive: 163 25% 25%;
    --bg-positive: 144 17% 89%;
    --warning: 42 67% 50%;
    --bg-warning: 43 75% 86%;
    --negative: 8 69% 39%;
    --bg-negative: 13 62% 90%;
  }
  .dark {
    --background: 15 15% 10%;
    --foreground: 39 56% 90%;
    --card: 16 15% 14%;
    --card-foreground: 39 56% 90%;
    --popover: 16 15% 14%;
    --popover-foreground: 39 56% 90%;
    --primary: 39 56% 90%;
    --primary-foreground: 16 15% 14%;
    --secondary: 17 19% 7%;
    --secondary-foreground: 39 56% 90%;
    --muted: 17 19% 7%;
    --muted-foreground: 31 21% 68%;
    --accent: 42 72% 60%;
    --accent-foreground: 16 15% 14%;
    --destructive: 14 73% 66%;
    --destructive-foreground: 16 15% 14%;
    --border: 39 56% 90% / 0.16;
    --input: 39 56% 90% / 0.16;
    --ring: 42 72% 60%;
    --chart-1: 42 72% 60%;
    --chart-2: 14 73% 66%;
    --chart-3: 148 25% 69%;
    --content-tertiary: 28 14% 55%;
    --border-transparent: 39 56% 90% / 0.08;
    --border-selected: 39 56% 90%;
    --positive: 148 25% 69%;
    --bg-positive: 159 20% 17%;
    --warning: 42 72% 60%;
    --bg-warning: 35 31% 18%;
    --negative: 14 73% 66%;
    --bg-negative: 14 40% 21%;
  }
}
```

shadcn component mapping: Button `default` = primary pill; `outline` = secondary (2px border-selected); `link` = tertiary; sizes `lg` 56, `default` 48, `sm` 36. Drawer = sheet (radius-large, shadow-300, scrim). Sonner = snackbar. ToggleGroup = segmented control and chips. Alert = banner (default, negative, positive). Badge = tag (radius-tag). Input = radius-nested on bg-tertiary. CardTile, CardSwitcher and ButtonDock are custom.

## 12. SCSS (maps + mixins)

```scss
// _tokens.scss
$space: (
  100: 4px,
  200: 8px,
  300: 12px,
  400: 16px,
  500: 20px,
  600: 24px,
  700: 32px,
  800: 40px,
  900: 48px,
  1000: 64px,
);
$radius: (
  tag: 4px,
  nested: 8px,
  default: 12px,
  large: 16px,
  pill: 999px,
);

$font-display: 'Fraunces', 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif;
$font-sans:
  ui-sans-serif,
  system-ui,
  -apple-system,
  'Segoe UI',
  Roboto,
  'Noto Sans',
  sans-serif;
$font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;

// role: (family, weight, size, line-height, tracking, transform)
$type: (
  display-s: (
    $font-display,
    700,
    44px,
    52px,
    -0.02em,
    none,
  ),
  display-xs: (
    $font-display,
    700,
    36px,
    44px,
    -0.02em,
    none,
  ),
  heading-l: (
    $font-display,
    600,
    32px,
    40px,
    -0.01em,
    none,
  ),
  heading-m: (
    $font-display,
    600,
    28px,
    36px,
    -0.01em,
    none,
  ),
  heading-s: (
    $font-display,
    600,
    24px,
    32px,
    0,
    none,
  ),
  heading-xs: (
    $font-display,
    600,
    20px,
    28px,
    0,
    none,
  ),
  label-l: (
    $font-sans,
    600,
    18px,
    24px,
    0,
    none,
  ),
  label-m: (
    $font-sans,
    600,
    16px,
    20px,
    0,
    none,
  ),
  label-s: (
    $font-sans,
    500,
    14px,
    16px,
    0,
    none,
  ),
  label-xs: (
    $font-sans,
    600,
    12px,
    16px,
    0,
    none,
  ),
  paragraph-l: (
    $font-sans,
    400,
    18px,
    28px,
    0,
    none,
  ),
  paragraph-m: (
    $font-sans,
    400,
    16px,
    24px,
    0,
    none,
  ),
  paragraph-s: (
    $font-sans,
    400,
    14px,
    20px,
    0,
    none,
  ),
  paragraph-xs: (
    $font-sans,
    400,
    12px,
    20px,
    0,
    none,
  ),
  mono-s: (
    $font-mono,
    500,
    14px,
    20px,
    0.08em,
    none,
  ),
  mono-xs: (
    $font-mono,
    500,
    12px,
    16px,
    0.08em,
    uppercase,
  ),
);

$primitives: (
  linen-100: #fbf5ea,
  linen-200: #efe6d6,
  linen-300: #e6dbc8,
  cocoa-950: #1e1816,
  cocoa-900: #2a221f,
  cocoa-800: #3a2d2a,
  cocoa-700: #6e5a52,
  cocoa-600: #76615a,
  cocoa-350: #9c8b7c,
  cocoa-300: #bfae9c,
  cocoa-well: #16110f,
  cream-100: #f6ecda,
  cream-200: #f4ead8,
  cream-ink: #fff7ea,
  gold-500: #d4a02a,
  gold-400: #e3b851,
  gold-700: #8c6420,
  gold-800: #7a5512,
  gold-100: #f6e7c1,
  gold-dark-bg: #3d3120,
  vermilion-600: #a8321f,
  vermilion-300: #e8876a,
  vermilion-100: #f5dcd5,
  vermilion-dark-bg: #4a2a20,
  jade-700: #2f4f46,
  jade-300: #9cc3ae,
  jade-100: #dde7e1,
  jade-dark-bg: #22332d,
);
@function p($k) {
  @return map-get($primitives, $k);
}

$semantic: (
  light: (
    bg-primary: p(linen-200),
    bg-secondary: p(linen-100),
    bg-tertiary: p(linen-300),
    bg-inverse-primary: p(cocoa-800),
    content-primary: p(cocoa-800),
    content-secondary: p(cocoa-700),
    content-tertiary: p(cocoa-600),
    content-inverse-primary: p(cream-100),
    border-opaque: rgba(88, 66, 60, 0.16),
    border-transparent: rgba(88, 66, 60, 0.08),
    border-selected: p(cocoa-800),
    accent: p(gold-500),
    content-on-accent: p(cocoa-800),
    positive: p(jade-700),
    bg-positive: p(jade-100),
    warning: p(gold-500),
    bg-warning: p(gold-100),
    content-on-warning: p(cocoa-800),
    negative: p(vermilion-600),
    bg-negative: p(vermilion-100),
    ring: p(gold-700),
    scrim: rgba(26, 18, 16, 0.48),
    content-snack-action: p(gold-400),
  ),
  dark: (
    bg-primary: p(cocoa-950),
    bg-secondary: p(cocoa-900),
    bg-tertiary: p(cocoa-well),
    bg-inverse-primary: p(cream-200),
    content-primary: p(cream-200),
    content-secondary: p(cocoa-300),
    content-tertiary: p(cocoa-350),
    content-inverse-primary: p(cocoa-900),
    border-opaque: rgba(244, 234, 216, 0.16),
    border-transparent: rgba(244, 234, 216, 0.08),
    border-selected: p(cream-200),
    accent: p(gold-400),
    content-on-accent: p(cocoa-900),
    positive: p(jade-300),
    bg-positive: p(jade-dark-bg),
    warning: p(gold-400),
    bg-warning: p(gold-dark-bg),
    content-on-warning: p(gold-400),
    negative: p(vermilion-300),
    bg-negative: p(vermilion-dark-bg),
    ring: p(gold-400),
    scrim: rgba(8, 6, 5, 0.64),
    content-snack-action: p(gold-800),
  ),
);

$shadow: (
  100: (
    0 1px 2px rgba(58, 45, 42, 0.08),
  ),
  200: (
    0 1px 2px rgba(58, 45, 42, 0.12),
    0 4px 12px rgba(58, 45, 42, 0.12),
  ),
  300: (
    0 -4px 8px rgba(26, 18, 16, 0.08),
    0 -12px 32px rgba(26, 18, 16, 0.2),
  ),
);

$motion: (
  enter: (
    500ms,
    cubic-bezier(0.22, 1, 0.36, 1),
  ),
  move: (
    500ms,
    cubic-bezier(0.83, 0, 0.17, 1),
  ),
  exit: (
    400ms,
    cubic-bezier(0.64, 0, 0.78, 0),
  ),
  dismiss: (
    200ms,
    cubic-bezier(0.11, 0, 0.5, 0),
  ),
  fade: (
    150ms,
    linear,
  ),
);

// tiles: (from, to, ink)
$tiles: (
  gold: (
    #d1a443,
    #e3b851,
    #3a2d2a,
  ),
  lacquer: (
    #7a1f1a,
    #a8321f,
    #fff7ea,
  ),
  jade: (
    #2f4f46,
    #456555,
    #fff7ea,
  ),
  vermilion: (
    #a9381f,
    #b43f27,
    #fff7ea,
  ),
  indigo: (
    #283044,
    #46557a,
    #fff7ea,
  ),
  cocoa: (
    #3a2d2a,
    #6e5148,
    #fff7ea,
  ),
);

// ---- emit CSS custom properties ----
:root {
  @each $k, $v in map-get($semantic, light) {
    --#{$k}: #{$v};
  }
}
@media (prefers-color-scheme: dark) {
  :root {
    @each $k, $v in map-get($semantic, dark) {
      --#{$k}: #{$v};
    }
  }
}

// ---- mixins ----
@function space($k) {
  @return map-get($space, $k);
}
@function radius($k) {
  @return map-get($radius, $k);
}

@mixin type($role) {
  $t: map-get($type, $role);
  font-family: nth($t, 1);
  font-weight: nth($t, 2);
  font-size: nth($t, 3);
  line-height: nth($t, 4);
  letter-spacing: nth($t, 5);
  text-transform: nth($t, 6);
}

@mixin elevation($level) {
  box-shadow: map-get($shadow, $level);
}

@mixin motion($props, $kind: fade) {
  $m: map-get($motion, $kind);
  transition-property: $props;
  transition-duration: nth($m, 1);
  transition-timing-function: nth($m, 2);
  @media (prefers-reduced-motion: reduce) {
    transition-duration: 1ms;
  }
}

// hover 4%, pressed 8% + scale .98, focus ring, disabled .4
@mixin state-layer {
  position: relative;
  cursor: pointer;
  @include motion((transform, background-color, color, opacity));
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    pointer-events: none;
    background: currentColor;
    opacity: 0;
    @include motion(opacity);
  }
  &:hover::after {
    opacity: 0.04;
  }
  &:active::after {
    opacity: 0.08;
  }
  &:active {
    transform: scale(0.98);
  }
  &:focus-visible {
    outline: 2px solid var(--ring);
    outline-offset: 2px;
  }
  &:disabled,
  &[aria-disabled='true'] {
    opacity: 0.4;
    pointer-events: none;
    &::after {
      opacity: 0;
    }
  }
}

@mixin hit-area($to: 44px, $from: 36px) {
  &::before {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    top: -(($to - $from) / 2);
    bottom: -(($to - $from) / 2);
  }
}

@mixin tile($name) {
  $t: map-get($tiles, $name);
  color: nth($t, 3);
  background-image: linear-gradient(135deg, nth($t, 1), nth($t, 2));
  border-radius: radius(large);
  padding: space(500);
  @include elevation(200);
}

// usage
.button-primary {
  @include state-layer;
  @include type(label-m);
  height: 48px;
  padding: 0 space(600);
  border-radius: radius(pill);
  background: var(--bg-inverse-primary);
  color: var(--content-inverse-primary);
  &.is-large {
    height: 56px;
    @include type(label-l);
  }
  &.is-compact {
    height: 36px;
    @include type(label-s);
    @include hit-area;
  }
}
.sheet {
  @include elevation(300);
  border-radius: radius(large) radius(large) 0 0;
  @include motion(transform, enter);
}
.screen-title {
  @include type(heading-l);
}
```
