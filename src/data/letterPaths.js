/**
 * SVG paths for all 26 letters.
 * Each letter has:
 *  - `strokes`: An array of SVG path `d` strings — one per stroke in correct order.
 *  - `viewBox`: the coordinate space (300x300).
 *
 * Strokes are ordered by how they should naturally be written.
 * Combined path is used for the faint guide display.
 */
export const LETTER_PATHS = {
  A: {
    strokes: [
      "M 150 30 L 40 270",   // Left diagonal
      "M 150 30 L 260 270",  // Right diagonal
      "M 80 180 L 220 180",  // Crossbar
    ],
  },
  B: {
    strokes: [
      "M 70 30 L 70 270",               // Vertical
      "M 70 30 Q 200 30 200 105 Q 200 150 70 150", // Top bump
      "M 70 150 Q 210 150 210 210 Q 210 270 70 270", // Bottom bump
    ],
  },
  C: {
    strokes: [
      "M 240 70 Q 100 30 60 150 Q 20 270 240 240", // Arc
    ],
  },
  D: {
    strokes: [
      "M 80 30 L 80 270",               // Vertical
      "M 80 30 Q 270 30 270 150 Q 270 270 80 270", // Arc
    ],
  },
  E: {
    strokes: [
      "M 210 30 L 70 30 L 70 270 L 210 270", // F-shape + base
      "M 70 150 L 180 150",                  // Middle bar
    ],
  },
  F: {
    strokes: [
      "M 70 30 L 70 270",   // Vertical
      "M 70 30 L 220 30",   // Top bar
      "M 70 150 L 190 150", // Middle bar
    ],
  },
  G: {
    strokes: [
      // Big C arc: start top-right → sweep counterclockwise → arrive at mid-right height
      "M 225 65 Q 140 15 65 85 Q 25 135 28 160 Q 32 245 135 270 Q 200 283 230 248 L 230 160",
      // Crossbar going left from the right arm
      "M 230 160 L 155 160",
    ],
  },

  H: {
    strokes: [
      "M 70 30 L 70 270",   // Left vertical
      "M 230 30 L 230 270", // Right vertical
      "M 70 150 L 230 150", // Crossbar
    ],
  },
  I: {
    strokes: [
      "M 110 30 L 190 30", // Top bar
      "M 150 30 L 150 270", // Vertical
      "M 110 270 L 190 270", // Bottom bar
    ],
  },
  J: {
    strokes: [
      "M 200 30 L 200 210 Q 200 280 110 270 Q 60 265 60 210", // Vertical + hook
    ],
  },
  K: {
    strokes: [
      "M 70 30 L 70 270",        // Vertical
      "M 220 30 L 70 155",       // Upper diagonal
      "M 70 155 L 230 270",      // Lower diagonal
    ],
  },
  L: {
    strokes: [
      "M 70 30 L 70 270 L 230 270", // L shape
    ],
  },
  M: {
    strokes: [
      "M 50 270 L 50 30 L 150 150 L 250 30 L 250 270", // M shape
    ],
  },
  N: {
    strokes: [
      "M 60 270 L 60 30 L 240 270 L 240 30", // N shape
    ],
  },
  O: {
    strokes: [
      "M 150 30 Q 270 30 270 150 Q 270 270 150 270 Q 30 270 30 150 Q 30 30 150 30", // Circle
    ],
  },
  P: {
    strokes: [
      "M 70 30 L 70 270",                    // Vertical
      "M 70 30 Q 210 30 210 110 Q 210 180 70 180", // Top bump
    ],
  },
  Q: {
    strokes: [
      "M 150 30 Q 270 30 270 150 Q 270 270 150 270 Q 30 270 30 150 Q 30 30 150 30", // Circle
      "M 190 200 L 250 270", // Tail
    ],
  },
  R: {
    strokes: [
      "M 70 30 L 70 270",
      "M 70 30 Q 210 30 210 110 Q 210 180 70 180",
      "M 130 180 L 240 270",
    ],
  },
  S: {
    strokes: [
      "M 230 60 Q 150 10 80 80 Q 30 140 150 155 Q 270 170 220 240 Q 170 290 80 250",
    ],
  },
  T: {
    strokes: [
      "M 50 30 L 250 30",  // Top bar
      "M 150 30 L 150 270", // Vertical
    ],
  },
  U: {
    strokes: [
      "M 60 30 L 60 200 Q 60 280 150 280 Q 240 280 240 200 L 240 30",
    ],
  },
  V: {
    strokes: [
      "M 50 30 L 150 270 L 250 30",
    ],
  },
  W: {
    strokes: [
      "M 30 30 L 80 270 L 150 160 L 220 270 L 270 30",
    ],
  },
  X: {
    strokes: [
      "M 60 30 L 240 270", // Diagonal 1
      "M 240 30 L 60 270", // Diagonal 2
    ],
  },
  Y: {
    strokes: [
      "M 50 30 L 150 160",  // Left arm
      "M 250 30 L 150 160", // Right arm
      "M 150 160 L 150 270", // Stem
    ],
  },
  Z: {
    strokes: [
      "M 60 30 L 240 30 L 60 270 L 240 270", // Z shape
    ],
  },
};

export const alphabet = Object.keys(LETTER_PATHS);
