"use client";

import { useSyncExternalStore } from "react";

const neverChanges = () => () => {};

/**
 * False while the server renders and through the first client paint, true
 * afterwards.
 *
 * Used by the surfaces that progressively enhance: a form that hides the
 * fields the chosen answer does not need has to render *all* of them for a
 * browser with JavaScript off, and only start hiding once it knows there is a
 * browser doing the hiding. `useSyncExternalStore` is the way to ask that
 * question without setting state inside an effect — the two snapshots below
 * are the whole answer, and React reconciles them at hydration.
 */
export function useHydrated() {
  return useSyncExternalStore(neverChanges, () => true, () => false);
}
