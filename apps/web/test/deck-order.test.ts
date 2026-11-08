import { describe, expect, it } from 'vitest';
import { deckPositions } from '../src/features/home/deck-order';

describe('deckPositions: where each paid card sits in the stack', () => {
  const ids = ['a', 'b', 'c'];

  it('puts the chosen card last, which is the front of the deck', () => {
    expect(deckPositions(ids, 'a')).toEqual({ b: 0, c: 1, a: 2 });
  });

  it('keeps the other cards in their original order underneath', () => {
    expect(deckPositions(ids, 'b')).toEqual({ a: 0, c: 1, b: 2 });
    expect(deckPositions(ids, 'c')).toEqual({ a: 0, b: 1, c: 2 });
  });

  it('defaults to the first card when nothing is chosen or the choice is gone', () => {
    expect(deckPositions(ids, null)).toEqual({ b: 0, c: 1, a: 2 });
    expect(deckPositions(ids, 'zzz')).toEqual({ b: 0, c: 1, a: 2 });
  });

  it('handles one card and none', () => {
    expect(deckPositions(['x'], 'x')).toEqual({ x: 0 });
    expect(deckPositions([], null)).toEqual({});
  });
});
