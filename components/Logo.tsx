/**
 * The mark and the header lockup come from @ekdotico/domico, the same
 * source docs re-exports.
 *
 * What was here was a hand-rolled copy pinned to the `dark-solid` pair — a plum
 * tile with a cream stroke, in every theme and every mode. That is correct on
 * the Parchment Light canvas this site used to be, and wrong the moment a
 * reader is in dark mode: a near-black tile on a near-black canvas. The
 * package's `solid` variant defers the choice to the stylesheet, which resolves
 * it at paint rather than after hydration, so the tile always contrasts with
 * the canvas it lands on.
 *
 * Re-exported rather than swapped at the call sites so consumers here keep
 * importing from one place, and so this note survives where someone looking for
 * the old component will find it.
 */
export { Logo, LogoMark, type LogoMarkVariant } from '@ekdotico/domico/components';
