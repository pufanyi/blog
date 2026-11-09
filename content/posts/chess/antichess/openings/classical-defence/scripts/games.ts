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
 * White's five recaptures after 5...Qxd2, following Liardet: 6.Bxd2! leaves
 * Black only 6...Bf3, while the other captures lose or open extra branches.
 */
export const SUICIDE_RECAPTURES = parseGame(`
[Variant "Antichess"]
[Result "*"]

1. e3 b5 2. Bxb5 Bb7 3. Bxd7 Bxg2 4. Bxe8 Bxh1 5. Bxf7 Qxd2
{ [%cal Gc1d2,Be1d2,Bb1d2,Rd1d2,Rf7g8] [%csl Rd2,Yg8] }
6. Bxd2! { 后留在 d1 支援 h5，黑方只剩 6...Bf3 一条活路。 }
(6. Bxg8?? Rxg8 7. Kxd2 h5! 8. Qxh5 Bd5 { 白后与白象被黑方接力清扫。 })
(6. Qxd2?? Bd5! (6... Bf3 7. Nxf3 e5 8. Nxe5 Nc6 9. Nxc6 Re8!) 7. Qxd5 Nf6
  { 黑方围绕白后组织强制清扫。 })
(6. Nxd2 Be4 { 复杂乱战：黑方不足以清扫到底，但白方要额外计算大量分支。 })
(6. Kxd2 Bd5! 7. Bxg8 Bxa2 8. Rxa2!
  (8. Bxh7?? Rxh7 9. Rxa2 Rxh2 10. Rxa7 Rxf2 11. Rxc7 Rxd2 { 黑车沿第二横排反向清扫，黑方翻盘。 })
  8... Rxg8 9. Rxa7 Rxa7 10. Ne2 { 白方保持优势。 })
6... Bf3 (6... Bd5?? 7. Bxg8! Rxg8 (7... Bxg8 8. c4!) (7... Bxa2 8. Rxa2 Rxg8 9. Rxa7 Rxa7 10. Ba5!)
  8. Qh5! { 三种吃回都会被拖入强制清扫，完整变化见下一张棋盘。 })
(6... Be4?? 7. Bxg8 Bxc2 8. Qxc2)
7. Bxg8 Rxg8 8. Qxf3 Nd7 9. Qxf8 Nxf8 *
`);

/**
 * Refutation of 6.Bxd2 Bd5?? in the Suicide Defence. Every line was checked
 * with a proof-number search: 7.Bxd5? loses to 7...Nh6!, while after 7.Bxg8!
 * each of Black's three recaptures ends in a sweep in which Black has exactly
 * one legal move from White's eighth move onward.
 */
export const SUICIDE_BD5 = parseGame(`
[Variant "Antichess"]
[Result "1-0"]

1. e3 b5 2. Bxb5 Bb7 3. Bxd7 Bxg2 4. Bxe8 Bxh1 5. Bxf7 Qxd2 6. Bxd2 Bd5
{ d5 象同时保护 g8 马并瞄准 a2 兵；白方只能在 Bxd5 与 Bxg8 中选一。 [%cal Gd5g8,Gd5a2,Bf7d5,Bf7g8] }
7. Bxg8!
(7. Bxd5? Nh6! { b7 已空，d5 白象正对 a8 车。此后白方每步只有一个合法着法。 [%cal Rd5a8] }
  8. Bxa8 Nc6 9. Bxc6 a5 10. Bxa5 Ng8 11. Bxc7 e5 12. Bxe5 Be7 13. Bxg7 Bg5
  14. Bxh8 Bxe3 15. fxe3 Nf6 16. Bxf6 h5 17. Qxh5 { 黑方子力全部送光，黑方获胜。 })
7... Rxg8
(7... Bxg8 8. c4! { 把兵送到 g8 象的 a2–g8 斜线上，黑方此后再无选择。 [%cal Rg8c4] }
  8... Bxc4 9. Ba5 Bxa2 10. Bxc7 Bxb1 11. Rxa7 Rxa7 12. Qxb1 Rxc7 13. Qxh7 Rxh7
  14. Nh3 Rxh3 15. e4 Rxh2 16. Kd2 Rxf2 17. Ke3 Rxb2 18. Ke2 Rxe2 19. e5 Rxe5
  { h8 车接力扫光白方剩余子力，白方获胜。 })
(7... Bxa2 8. Rxa2 Rxg8 9. Rxa7 Rxa7 10. Ba5! { 先把 a7 车引到 a5，再用后把它拉到 h 线。 [%cal Ra7a5,Gd1h5] }
  10... Rxa5 11. Qh5! Rxh5 12. Nh3 Rxh3 13. e4 Rxh2 14. Kd2 Rxf2 15. Ke3 Rxc2
  16. Kd4 Rxb2 17. Kd5 Rxb1 18. Kc6 Nxc6 19. e5 Nxe5 { 黑车与黑马吃光白方，白方获胜。 })
8. Qh5! { 白后瞄准 h7；黑方唯一的吃法是 8...Bxa2，此后每步都只有一个合法着法。 [%cal Gd1h5,Gh5h7] }
8... Bxa2 9. Qxh7 Bxb1 10. Qxg8 Bxc2 11. Rxa7 Rxa7 12. Qxg7 Bxg7
{ 白后吃掉 h7、g8、g7 后，把 f8 黑格象引上 a1–h8 长对角线。 [%cal Rg7b2] }
13. Nh3 Bxb2 14. Bc3 Bxc3 15. Ng5 Bxe1 16. Nf7 Bxf2 17. Nh6 Bxe3 18. Nf5 Bxf5
19. h3 Bxh3 { 黑格象与白格象依次吃光白方剩余子力，白方获胜。 } 1-0
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
