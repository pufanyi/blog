import { parseGame } from '../../../../../shared/chess';

/**
 * 1.e4 b5 and the line in which White recaptures with the king on move 7.
 * The build replays it under Lichess antichess rules; the final position
 * leaves Black's only piece, the c7 pawn, without a move.
 */
export const E4_B5 = parseGame(`
[Variant "Antichess"]
[Result "0-1"]

1. e4 b5 2. Bxb5 Nf6 3. Bxd7 Nxe4 4. Bxe8 Nxf2 5. Bxf7 Nxd1 6. Kxd1 Qxd2
7. Kxd2 Rg8 8. Bxg8 e5 9. Bxh7 g6 10. Bxg6 e4 11. Bxe4 Be6 12. Bxa8 Bxa2
13. Rxa2 a5 14. Rxa5 Nc6 15. Bxc6 Bc5 16. Rxc5 0-1
`);
