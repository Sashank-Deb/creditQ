import { TILE_PATTERNS, TILE_TONES, type TilePattern, type TileTone } from '@creditq/vault';
import styles from './TileStylePicker.module.scss';

const TONE_NAMES: Record<TileTone, string> = {
  forest: 'Forest',
  terracotta: 'Terracotta',
  sand: 'Sand',
  olive: 'Olive',
  slate: 'Slate blue',
  burgundy: 'Burgundy',
  black: 'Black',
};

const PATTERN_NAMES: Record<TilePattern, string> = {
  diamonds: 'Diamonds',
  lines: 'Lines',
  dots: 'Dots',
  grid: 'Grid',
  rings: 'Rings',
  plain: 'Plain',
};

interface TileStylePickerProps {
  /** null means automatic: the next colour in the rotation. */
  tone: TileTone | null;
  pattern: TilePattern;
  onTone: (tone: TileTone | null) => void;
  onPattern: (pattern: TilePattern) => void;
  /** Colour shown for the automatic choice. */
  autoTone: TileTone;
  /** Unique prefix so two pickers never share radio names. */
  name?: string;
}

/** Colour and pattern choices for a card tile: 6 colours, 4 patterns, tap to pick. */
export default function TileStylePicker({
  tone,
  pattern,
  onTone,
  onPattern,
  autoTone,
  name = 'tile',
}: TileStylePickerProps) {
  const current = tone ?? autoTone;
  return (
    <div className={styles.picker}>
      <fieldset className={styles.group}>
        <legend className={styles.legend}>Colour</legend>
        <div className={styles.row}>
          {TILE_TONES.map((t) => (
            <label key={t} className={styles.swatchLabel}>
              <input
                type="radio"
                name={`${name}-tone`}
                className={styles.radio}
                checked={current === t}
                onChange={() => onTone(t)}
              />
              <span className={`${styles.swatch} ${styles[`swatch-${t}`]}`} aria-hidden="true" />
              <span className={styles.srOnly}>{TONE_NAMES[t]}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className={styles.group}>
        <legend className={styles.legend}>Pattern</legend>
        <div className={styles.row}>
          {TILE_PATTERNS.map((p) => (
            <label key={p} className={styles.patternLabel}>
              <input
                type="radio"
                name={`${name}-pattern`}
                className={styles.radio}
                checked={pattern === p}
                onChange={() => onPattern(p)}
              />
              <span
                className={`${styles.patternBox} ${styles[`pattern-${p}`]}`}
                aria-hidden="true"
              />
              <span className={styles.patternName}>{PATTERN_NAMES[p]}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
