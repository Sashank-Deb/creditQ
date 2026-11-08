/**
 * Where each paid card sits in the stack. Position 0 is the back of the deck (only a thin
 * strip shows); the highest position is the front card, fully open. The chosen card goes
 * to the front and the others keep their relative order underneath.
 */
export const deckPositions = (
  ids: readonly string[],
  topId: string | null,
): Record<string, number> => {
  const front = ids.find((id) => id === topId) ?? ids[0];
  const ordered = [...ids.filter((id) => id !== front), ...(front ? [front] : [])];
  return Object.fromEntries(ordered.map((id, position) => [id, position]));
};
