// Original reduced positions illustrating the mechanisms discussed in the text.
// Full FENs and SAN lines are retained for independent Antichess rules validation.
export const TACTICS = {
  order: {
    fen: '8/8/8/8/p1n5/B7/8/r1R5 w - - 0 1',
    line: 'Rxc4 Rxa3 Rxa4 Rxa4',
    alternative: 'Rxa1 Nxa3 Rxa3',
  },
  relay: {
    fen: 'r7/8/8/4R3/8/8/2K2n2/7R w - - 0 1',
    line: 'Rb5 Nxh1 Rb8 Rxb8 Kb3 Rxb3',
  },
  intermediate: {
    fen: '1R6/7p/8/8/2n2K2/4P3/8/5N2 w - - 0 1',
    line: 'Rh8 Nxe3 Rxh7 Nxf1 Rh2 Nxh2 Kg4 Nxg4',
  },
} as const;
