# CreditQ design v5: Sage & Clay (final palette)

v5 is v4's screens, spacing, type ramp, radius, elevation, interactions and flows, re-coloured with the manager-chosen **Sage & Clay** palette. Nothing structural changed.

- Review page: `review.html` (offline fonts fall back) or `review-published.html` (loads Fraunces and JetBrains Mono from Google Fonts).
- Every screen also exists as its own file here, and each one carries a `<style id="pal">` block with the Sage & Clay tokens (light plus dark).
- Token sources for the build:
  - `sage-clay.css`: the semantic and tile tokens as CSS variables (light, plus dark under `prefers-color-scheme`).
  - `_theme-sage-clay.scss`: the same tokens as an SCSS map plus an `emit-theme` mixin.
  - `02-design-tokens-structure-v4.md`: v4's token structure (type ramp, spacing, radius, shadow, motion, mixins). It is still valid; only the colour values are replaced by `sage-clay.css`.

## Palette
| Role | Light | Dark |
|---|---|---|
| Background primary / secondary / tertiary | #EEF2EC / #F9FBF7 / #E1E8DE | #131A16 / #1C2620 / #0B110E |
| Content primary / secondary / tertiary | #1F3A2F / #4C6156 / #566A5F | #EEF2EC / #AFC0B5 / #93A69A |
| Primary button (inverse) | #1F3A2F on #F4F7F1 text | #EEF2EC on #1C2620 text |
| Accent (terracotta) | #B0532D | #E58F68 |
| Positive / warning / negative | #2F6B4A / #C08A2E / #A93C2A | #8CC9A3 / #E2B65C / #F08A73 |

The accent is darkened from #C8643B to #B0532D so that it passes 4.5:1 as text on the sage background.

Tiles (gradient from and to): Forest #1F3A2F to #2F5444, Terracotta #8E3B20 to #A94D2B, Sand #D6C29C to #E8DBBF (forest text), Olive #434D1E to #5C6729, Slate blue #2E4156 to #465F7C, Deep teal #0D4343 to #175C5C.

## Contrast (WCAG)
- Light:
  - Content on background: primary 10.9, secondary 5.9, tertiary 5.1 (4.6 on tertiary wells).
  - Inverse button text: 11.4.
  - Accent on background: 4.5 (4.9 on surfaces).
  - Text on accent: 5.1.
  - Positive 5.1, negative 4.9, snackbar action 6.0.
- Dark: every pair is at or above 5.8.
- Tile text, worst end of each gradient: Forest 8.5, Terracotta 5.6, Sand 7.1, Olive 6.1, Slate 6.6, Teal 7.7.

## Checked
- Rendered in headless Chrome: the review page in light mode, and Home in light and dark.
- The interactive Home (Mark as paid sheet and snackbar) is unchanged from v4.
