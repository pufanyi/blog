import { parseGame } from '../../../../../../shared/chess';

/**
 * Why Black cannot play a passive move against 1.e3: 2.Ba6 Nxa6?? 3.b4 Nxb4 4.Qf3!
 * forces Black's knight onto a2 or c2 and launches a winning sweep.
 */
export const E3_BA6_TRAP = parseGame(`
[Variant "Antichess"]
[Result "*"]

1. e3 h6 2. Ba6 Nxa6 3. b4 Nxb4 4. Qf3 *
`);

/**
 * Suicide Defence (2...Bb7): White locks the line with 6.Bxd2!, reaches the
 * critical tabiya at move 10, and refutes the thematic 10...Ne6?? counterattack
 * via a knight-to-rook relay sweep.
 */
export const SUICIDE_MAIN = parseGame(`
[Variant "Antichess"]
[Result "1-0"]

1. e3 b5 2. Bxb5 Bb7 { 自杀防御：准备在 3.Bxd7 后吃 g2 和 h1。 [%cal Gb7g2] }
3. Bxd7 Bxg2 4. Bxe8 Bxh1 5. Bxf7 Qxd2
6. Bxd2 { 最佳实战选择：保留后在 d1，把后续四步压缩为唯一主线。 [%cal Gd2h6,Gd2a5] }
6... Bf3 7. Bxg8 Rxg8 8. Qxf3 Nd7 9. Qxf8 Nxf8
10. c4 { 控制 d5 并预备 c5-e4 反击，封死黑方 10...Ne6。 [%cal Gc2c4,Rf8e6] [%csl Rd2,Ye3] }
10... Ne6 11. c5 Nxc5 12. e4 Nxe4
13. Bh6 { 利用 e4 马的吃子义务腾空 d2，准备让 g8 车接力。 [%cal Gd2h6,Bg8g1] }
13... gxh6 14. f4 { 躲开 f2 兵，e4 马无子可吃，g8 车被迫接手清扫。 [%cal Rg8g1,Gg1e1,Ge1a1] }
14... Rxg1 15. f5 Rxe1 16. Na3 Rxa1 17. b3 Rxa2 18. h4 Rxa3 19. h5 Rxb3 20. f6 exf6 1-0
`);

/**
 * What goes wrong if White develops routinely at move 10 without guarding the
 * d2-h6 battery: 10.Na3?? Ne6! rips away the e3 shield with ...Nf4 and ...g5.
 */
export const SUICIDE_NA3_BLUNDER = parseGame(`
[Variant "Antichess"]
[Result "0-1"]

1. e3 b5 2. Bxb5 Bb7 3. Bxd7 Bxg2 4. Bxe8 Bxh1 5. Bxf7 Qxd2
6. Bxd2 Bf3 7. Bxg8 Rxg8 8. Qxf3 Nd7 9. Qxf8 Nxf8
10. Na3 Ne6 11. Nc4 Nf4 12. exf4 g5 13. fxg5 Rxg5
14. Bxg5 h5 15. Bxe7 Rd8 16. Bxd8 a5 17. Bxc7 h4 18. Bxa5 h3 19. Nxh3 0-1
`);

/**
 * Classical Bishop Defence (2...e6 3.Bxd7 Bxd7) with the Beltman Attack
 * (4.Na3 Bxa3 5.bxa3) and Watkins' principal 5...Qh4 line.
 */
export const CLASSIC_E6_BELTMAN = parseGame(`
[Variant "Antichess"]
[Result "*"]

1. e3 b5 2. Bxb5 e6 3. Bxd7 Bxd7 { 唯一不立即败北的吃回方式。 }
4. Na3 { Beltman 攻击：甘愿叠兵，也要立刻兑掉黑方 f8 象并打开 b 线。 [%cal Gb1a3,Rf8a3] }
4... Bxa3 5. bxa3 Qh4 { 黑方最复杂的反击：抢先挑起后翼与王翼的对攻。 }
6. Qg4 Qxf2 7. Kxf2 Bc8 8. Qxg7 a5 9. Qxf7 Kxf7 10. Nh3 Nf6 11. a4 *
`);

/**
 * Classical Bishop Defence with the Minear Attack (4.b4 Bxb4 5.a4), illustrating
 * the intermediate rook capture 8.Rxa7! before recapturing on d2.
 */
export const CLASSIC_E6_MINEAR = parseGame(`
[Variant "Antichess"]
[Result "*"]

1. e3 b5 2. Bxb5 e6 3. Bxd7 Bxd7 4. b4 Bxb4 5. a4 Bxd2 6. Bxd2 Bxa4 7. Rxa4 Qxd2
8. Rxa7 Rxa7 9. Kxd2 c5 10. Qg4 Rd7 *
`);

/**
 * Refutation of 2...e6 3.Bxd7 Nxd7? (Classical Knight Defence) via Sjaak's 6.Nxd2!
 * and 2...e6 3.Bxd7 Qxd7?? via Beltman-Kraaijpoel's 5.Qe2! and 8.Rd1!!.
 */
export const CLASSIC_E6_SIDELINES = {
  nxd7: parseGame(`
[Variant "Antichess"]
[Result "*"]

1. e3 b5 2. Bxb5 e6 3. Bxd7 Nxd7 4. b4 Bxb4 5. e4 Bxd2 6. Nxd2 Nf8 7. Nh3 Qxd2 8. Kxd2 *
`),
  qxd7: parseGame(`
[Variant "Antichess"]
[Result "1-0"]

1. e3 b5 2. Bxb5 e6 3. Bxd7 Qxd7 4. b4 Bxb4 5. Qe2 Bxd2 6. Nxd2 Qxd2 7. Bxd2 c6
8. Rd1 Kd7 9. Qa6 Nxa6 10. Bb4 Nxb4 11. Rxd7 Nxc2 12. Rxf7 Nxe3 13. Rxg7 Nxg2
14. Rxg8 Nxe1 15. Rxc8 Raxc8 16. Nf3 Nxf3 17. Rb1 Nxh2 18. f3 Nxf3 19. Rb5 cxb5 20. a4 1-0
`),
};

/**
 * Bishop Defence (2...Ba6): Black's theoretically toughest defence in the
 * Classical complex, met by 3.Bxd7 Nxd7 4.d3! Bxd3 5.Qxd3.
 */
export const BISHOP_BA6_MAIN = parseGame(`
[Variant "Antichess"]
[Result "*"]

1. e3 b5 2. Bxb5 Ba6 { 象防御：试图顺手兑掉难出的 c8 白格象。 }
3. Bxd7 { 拒绝 3.Bxa6 Nxa6 帮黑方出子，先把 a6 象晾在边线。 [%cal Gb5d7,Ba6d3] }
3... Nxd7 4. d3 { 把 a6 象拉进 d3 吃掉，同时出后瞄准 h7 兵。 [%cal Gd3h7] }
4... Bxd3 5. Qxd3 Qb8 { 黑方最顽强的防守：反击 b2，准备兑光王翼与后翼长程子。 [%cal Rb8b2,Gd3h7] }
6. Qxh7 Rxh7 7. Nc3 Qxb2 8. Bxb2 Rxh2 9. Rxh2 a5
10. Ba3 e5 11. Bxf8 Nxf8 12. Rh6 gxh6 13. f4 exf4 14. exf4 *
`);

/**
 * Sjaak's king sacrifice refuting 2...Ba6 3.Bxd7 Qxd7?: 4.Ke2!! Bxe2 5.Nxe2 Qxd2 6.Bxd2.
 */
export const BISHOP_BA6_KE2 = parseGame(`
[Variant "Antichess"]
[Result "*"]

1. e3 b5 2. Bxb5 Ba6 3. Bxd7 Qxd7 4. Ke2 Bxe2 5. Nxe2 Qxd2 6. Bxd2 *
`);

/**
 * Knight Defence (2...Nh6) and Ancient Defence (2...c6?).
 */
export const OTHER_DEFENCES = {
  nh6: parseGame(`
[Variant "Antichess"]
[Result "*"]

1. e3 b5 2. Bxb5 Nh6 3. Bxd7 Nxd7 4. e4 *
`),
  c6: parseGame(`
[Variant "Antichess"]
[Result "*"]

1. e3 b5 2. Bxb5 c6 3. Bxc6 Nxc6 4. b4 Nxb4 5. a4 Nxc2 6. Qxc2 *
`),
};
