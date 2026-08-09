/**
 * Chart palettes. One source of truth so no component invents its own series colors.
 *
 * Validated with the dataviz skill's checker against a white card surface on the
 * ALL-PAIRS list (every series is visible at once in a stacked bar with a legend,
 * so adjacent-only checking would be dishonest here):
 *
 *   Lightness band      PASS  all 4 inside L 0.43-0.77
 *   Chroma floor        PASS  all 4 >= 0.1
 *   CVD separation      PASS  worst all-pairs magenta<->plum dE 11.3 (deutan)
 *   Normal-vision floor PASS  worst all-pairs magenta<->plum dE 15.5
 *   Contrast vs surface PASS  all 4 >= 3:1
 *
 * Two constraints shaped this palette and are worth knowing before editing it.
 *
 * 1. Status colours are reserved. This product reads green/amber/red as a verdict
 *    (go / watch / no-go), so a data category must never land near them. Hues
 *    within ~45 degrees of the three status hues are excluded. The worst
 *    categorical-vs-status pair here is CVD dE 14.8, so no series can be mistaken
 *    for a recommendation.
 *
 * 2. The stacked bar prints its values in white ON the fill, so every slot must
 *    clear 4.5:1 against white text - stricter than the 3:1 surface check.
 *    Measured: 4.6 / 8.5 / 4.9 / 8.6.
 *
 * Those two constraints together rule out the entire warm half of the colour
 * wheel and every teal, which is why this reads as one cool blue-to-magenta
 * family rather than a scatter of unrelated hues. That is a consequence of the
 * gates, not a stylistic choice.
 *
 * Assign slots in order and never cycle them. A fifth series does not get a
 * generated hue - fold it into "Other" or facet the chart.
 */
export const CATEGORICAL = [
  '#0075de', // 1 blue - the product accent
  '#4f34b4', // 2 violet
  '#925f95', // 3 plum
  '#93006a', // 4 magenta
] as const;

/**
 * Diverging scale for correlation, where the poles mean direction and NOT
 * good/bad. It deliberately does not use the semantic red: a negative
 * correlation is not a bad outcome, and painting it in the no-go colour told
 * the reader otherwise.
 *
 * Two hues either side of a neutral midpoint, per the diverging rule.
 * Poles measure CVD dE 18.8 / normal dE 29.2 apart.
 */
export const DIVERGING = {
  negative: [147, 0, 106], // #93006a magenta
  neutral: [246, 245, 244], // #f6f5f4 warm page neutral
  positive: [0, 117, 222], // #0075de blue
} as const;
