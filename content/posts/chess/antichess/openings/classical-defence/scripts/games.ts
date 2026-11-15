import { parseGame } from '../../../../../../shared/chess';

/**
 * Why Black cannot play a passive move against 1.e3: 2.Ba6! forces either
 * 2...bxa6 (ruining Black's queenside pawns) or 2...Nxa6?? 3.b4 Nxb4 4.Qf3!
 * which forces Black's knight onto a2 or c2 and launches a winning sweep.
 */
export const E3_BA6_TRAP = parseGame(`
[Variant "Antichess"]
[Result "*"]

1. e3 h6
2. Ba6! { 直接威胁消除 f1 象或引爆后翼 sweep。 [%cal Gf1a6] [%csl Ra6] }
2... Nxa6??
  (2... bxa6 { 白方顺势消除 f1 象，黑方形成 a 线 doubled pawns 且 c8 象仍被封锁。 [%csl Ya6,Yc8] })
3. b4 Nxb4
4. Qf3! { 同时瞄准 b7 与 a8，b4 黑马只能在 a2 与 c2 中二选一。 [%cal Gf3b7,Bf3a8,Rb4a2,Rb4c2] [%csl Rb4] }
*
`);

/**
 * Contrast between 1.e3 b5 2.Bxb5 and 1.e4 b5 2.Bxb5: e3 is doubly defended
 * by d2 and f2 and outside the reach of ...Nf6, so 3.Bxd7 is forced.
 */
export const E3_B5_STRUCTURE = parseGame(`
[Variant "Antichess"]
[Result "*"]

1. e3 b5 2. Bxb5 *
`);

/**
 * Suicide Defence (2...Bb7?): White locks the line with 6.Bxd2!, reaches the
 * critical tabiya at move 10, and refutes the thematic 10...Ne6?? counterattack
 * via a knight-to-rook relay sweep.
 */
export const SUICIDE_MAIN = parseGame(`
[Variant "Antichess"]
[Result "1-0"]

1. e3 b5 2. Bxb5 Bb7 { Suicide Defence：准备在 3.Bxd7 后吃 g2 和 h1。 [%cal Gb7g2] }
3. Bxd7 Bxg2
  (3... Qxd7?? 4. Qe2 { 外悬的 b7 象暴露后翼 weak point，黑方崩溃。 [%cal Rd1e2,Rb7g2] })
  (3... Kxd7?? 4. b4 { 暴露黑王与后翼，白方速胜。 })
  (3... Nxd7?? 4. a3 { 黑方同样无法守住后翼与 b7 象。 })
4. Bxe8 Bxh1 { 先走 4...Qxd2 再走 5...Bxh1 形成完全相同的局面。 }
5. Bxf7 Qxd2
6. Bxd2! { 最佳实战选择：保留后在 d1，把后续四步压缩为唯一 mainline。 [%cal Gd2h6,Gd2a5] }
6... Bf3 7. Bxg8 Rxg8 8. Qxf3 Nd7 9. Qxf8 Nxf8
10. c4! { 控制 d5 并预备 c5-e4 反击，封死黑方 10...Ne6。 [%cal Gc2c4,Rf8e6] [%csl Rd2,Ye3] }
10... Ne6?? 11. c5! Nxc5 12. e4! Nxe4
13. Bh6!! { 利用 e4 马的吃子义务腾空 d2，准备让 g8 车 relay。 [%cal Gd2h6,Bg8g1] }
13... gxh6
  (13... Nxf2 14. Kxf2 gxh6 15. Ke1! { 白王退回第一横排，g8 黑车同样被迫接手 sweep。 [%cal Rg8g1,Gg1e1] } 15... Rxg1)
14. f4! { 躲开 f2 兵，e4 马无子可吃，g8 车被迫接手 sweep。 [%cal Rg8g1,Gg1e1,Ge1a1] }
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
6. Bxd2! { 后留在 d1 支援 h5，黑方只剩 6...Bf3 一条活路。 [%cal Gc1d2,Gd1h5] }
(6. Bxg8?? { 帮黑方解除 f7 牵制并活化 h8 车。 [%cal Rf7g8,Rh8g8] } 6... Rxg8 7. Kxd2 h5! 8. Qxh5 Bd5 { 白后与白象被黑方 relay sweep。 [%cal Rd5h1] })
(6. Qxd2?? { 过早把白后亮在中心 d2。 [%cal Rd1d2] [%csl Rd2] } 6... Bd5!
  (6... Bf3 7. Nxf3 e5 8. Nxe5 Nc6 9. Nxc6 Re8! { 围绕白后与中心轻子组织 sweep。 })
  7. Qxd5 Nf6 { 黑方围绕白后组织 forced sweep。 })
(6. Nxd2 Be4 { 复杂乱战：黑方不足以 sweep 到底，但白方要额外计算大量分支。 })
(6. Kxd2 { 理论可行，但给黑方多留了 6...Bd5! 的选择。 } 6... Bd5! 7. Bxg8 Bxa2 8. Rxa2!
  (8. Bxh7?? { 贪多送一子会把黑车引到 h7 和第二横排。 [%cal Rf7h7,Rh8h7,Rh7h2] } 8... Rxh7 9. Rxa2 Rxh2 10. Rxa7 Rxf2 11. Rxc7 Rxd2 { 黑车沿第二横排反向 sweep，黑方翻盘。 })
  8... Rxg8 9. Rxa7 Rxa7 10. Ne2 { 白方保持优势。 })
6... Bf3 (6... Bd5?? 7. Bxg8! Rxg8 (7... Bxg8 8. c4!) (7... Bxa2 8. Rxa2 Rxg8 9. Rxa7 Rxa7 10. Ba5!)
  8. Qh5! { 三种 recapture 都会被拖入 forced sweep，完整 variation 见下一张棋盘。 })
(6... Be4?? 7. Bxg8 Bxc2 8. Qxc2)
7. Bxg8 Rxg8 8. Qxf3 Nd7 9. Qxf8 Nxf8 *
`);

/**
 * Helper game for the 6.Kxd2 Bd5! 7.Bxg8 Bxa2 position so diagrams can derive
 * positions and moveText from the main line.
 */
export const SUICIDE_KXD2_TRAP = parseGame(`
[Variant "Antichess"]
[Result "*"]

1. e3 b5 2. Bxb5 Bb7 3. Bxd7 Bxg2 4. Bxe8 Bxh1 5. Bxf7 Qxd2
6. Kxd2 Bd5 7. Bxg8 Bxa2 8. Rxa2 Rxg8 9. Rxa7 Rxa7 10. Ne2 *
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
(7. Bxd5? Nh6! { b7 已空，d5 白象正对 a8 车。此后白方每步只有一个 legal move。 [%cal Rd5a8] }
  8. Bxa8 Nc6 9. Bxc6 a5 10. Bxa5 Ng8 11. Bxc7 e5 12. Bxe5 Be7 13. Bxg7 Bg5
  14. Bxh8 Bxe3 15. fxe3 Nf6 16. Bxf6 h5 17. Qxh5 { 黑方子力全部送光，黑方获胜。 })
7... Rxg8
(7... Bxg8 8. c4! { 把兵送到 g8 象的 a2–g8 斜线上，黑方此后再无选择。 [%cal Rg8c4] }
  8... Bxc4 9. Ba5 Bxa2 10. Bxc7 Bxb1 11. Rxa7 Rxa7 12. Qxb1 Rxc7 13. Qxh7 Rxh7
  14. Nh3 Rxh3 15. e4 Rxh2 16. Kd2 Rxf2 17. Ke3 Rxb2 18. Ke2 Rxe2 19. e5 Rxe5
  { h8 车 relay sweep 白方剩余子力，白方获胜。 })
(7... Bxa2 8. Rxa2 Rxg8 9. Rxa7 Rxa7 10. Ba5! { 先把 a7 车引到 a5，再用后把它拉到 h 线。 [%cal Ra7a5,Gd1h5] }
  10... Rxa5 11. Qh5! Rxh5 12. Nh3 Rxh3 13. e4 Rxh2 14. Kd2 Rxf2 15. Ke3 Rxc2
  16. Kd4 Rxb2 17. Kd5 Rxb1 18. Kc6 Nxc6 19. e5 Nxe5 { 黑车与黑马吃光白方，白方获胜。 })
8. Qh5! { 白后瞄准 h7；黑方唯一的吃法是 8...Bxa2，此后每步都只有一个 legal move。 [%cal Gd1h5,Gh5h7] }
8... Bxa2 9. Qxh7 Bxb1 10. Qxg8 Bxc2 11. Rxa7 Rxa7 12. Qxg7 Bxg7
{ 白后吃掉 h7、g8、g7 后，把 f8 黑格象引上 a1–h8 长对角线。 [%cal Rg7b2] }
13. Nh3 Bxb2 14. Bc3 Bxc3 15. Ng5 Bxe1 16. Nf7 Bxf2 17. Nh6 Bxe3 18. Nf5 Bxf5
19. h3 Bxh3 { 黑格象与白格象依次吃光白方剩余子力，白方获胜。 } 1-0
`);

/**
 * Helper lines for the 7...Bxg8 8.c4! and 7...Bxa2 ... 10.Ba5! forced sweeps
 * in 6.Bxd2 Bd5?? so diagrams can derive directly from main lines.
 */
export const SUICIDE_BD5_BXG8 = parseGame(`
[Variant "Antichess"]
[Result "1-0"]

1. e3 b5 2. Bxb5 Bb7 3. Bxd7 Bxg2 4. Bxe8 Bxh1 5. Bxf7 Qxd2
6. Bxd2 Bd5 7. Bxg8 Bxg8 8. c4 Bxc4 9. Ba5 Bxa2 10. Bxc7 Bxb1
11. Rxa7 Rxa7 12. Qxb1 Rxc7 13. Qxh7 Rxh7 14. Nh3 Rxh3 15. e4 Rxh2
16. Kd2 Rxf2 17. Ke3 Rxb2 18. Ke2 Rxe2 19. e5 Rxe5 1-0
`);

export const SUICIDE_BD5_BXA2 = parseGame(`
[Variant "Antichess"]
[Result "1-0"]

1. e3 b5 2. Bxb5 Bb7 3. Bxd7 Bxg2 4. Bxe8 Bxh1 5. Bxf7 Qxd2
6. Bxd2 Bd5 7. Bxg8 Bxa2 8. Rxa2 Rxg8 9. Rxa7 Rxa7 10. Ba5 Rxa5
11. Qh5 Rxh5 12. Nh3 Rxh3 13. e4 Rxh2 14. Kd2 Rxf2 15. Ke3 Rxc2
16. Kd4 Rxb2 17. Kd5 Rxb1 18. Kc6 Nxc6 19. e5 Nxe5 1-0
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
 * Helper game for the 10.Ne2?? Ne6! 11.Na3 Nf4! stalemate refutation.
 */
export const SUICIDE_NE2_STALEMATE = parseGame(`
[Variant "Antichess"]
[Result "0-1"]

1. e3 b5 2. Bxb5 Bb7 3. Bxd7 Bxg2 4. Bxe8 Bxh1 5. Bxf7 Qxd2
6. Bxd2 Bf3 7. Bxg8 Rxg8 8. Qxf3 Nd7 9. Qxf8 Nxf8
10. Ne2 Ne6 11. Na3 Nf4 12. Nxf4 h5 13. Nxh5 Rgd8 14. Nxg7 Rxd2
15. Kxd2 e6 16. Nxe6 a5 17. Nxc7 a4 18. Nxa8 0-1
`);

/**
 * All major move-10 blunders in the Suicide Defence tabiya (9...Nxf8), grouped
 * in one viewer so readers can compare 10.Na3??, 10.Ne2??, and self-exposing moves.
 */
export const SUICIDE_MOVE10_BLUNDERS = parseGame(`
[Variant "Antichess"]
[Result "0-1"]

1. e3 b5 2. Bxb5 Bb7 3. Bxd7 Bxg2 4. Bxe8 Bxh1 5. Bxf7 Qxd2
6. Bxd2 Bf3 7. Bxg8 Rxg8 8. Qxf3 Nd7 9. Qxf8 Nxf8
10. Na3?? { 忽略 d2–h6 battery，直接放黑马跳往 e6。 [%cal Rf8e6] [%csl Rd2,Ye3] }
  (10. Ne2?? { 虽护住 f4，但在 f4 制造 double control。 [%cal Rg1e2,Rf8e6] [%csl Rf4] }
    10... Ne6! 11. Na3 Nf4! { 威胁 exf4 拆 battery，或逼迫 Nxf4 转入白马 sweep。 [%cal Re3f4,Re2f4] }
    12. Nxf4 h5! 13. Nxh5 Rgd8 14. Nxg7 Rxd2 15. Kxd2 e6 16. Nxe6 a5 17. Nxc7 a4 18. Nxa8
    { 白马扫光黑子，但最后黑方只剩被 a3 白马堵死的 a4 兵陷入 stalemate 获胜！ [%csl Ra4,Ya3] })
  (10. Bc3?? { 主动把 d2 象送到黑方火力线上。 [%cal Rd2c3,Re7e5] } 10... e5!)
  (10. Bb4?? { 主动暴露在 b 线。 [%cal Rd2b4,Ra8b8] } 10... Rb8!)
  (10. Ba5?? { 主动暴露在 d8 车射程内。 [%cal Rd2a5,Ra8d8] } 10... Rd8!)
  (10. e4?? { 亲手拆掉 e3 掩体。 [%cal Rd2h6,Rg7g6] } 10... g6!)
  (10. b4?? { 主动打开后翼斜线。 [%cal Rb2b4,Ra7a5] } 10... a5!)
10... Ne6! 11. Nc4 Nf4! 12. exf4 g5! { 拔掉 e3 掩体后把 d2 象引上第七、八横排 sweep。 [%cal Rg8g5,Rd2g5] }
13. fxg5 Rxg5 14. Bxg5 h5 15. Bxe7 Rd8 16. Bxd8 a5 17. Bxc7 h4 18. Bxa5 h3 19. Nxh3 0-1
`);

/**
 * Helper game for the 10.Bc1! Ne6 11.Nd2! double-barrier setup.
 */
export const SUICIDE_BC1_SHIELD = parseGame(`
[Variant "Antichess"]
[Result "*"]

1. e3 b5 2. Bxb5 Bb7 3. Bxd7 Bxg2 4. Bxe8 Bxh1 5. Bxf7 Qxd2
6. Bxd2 Bf3 7. Bxg8 Rxg8 8. Qxf3 Nd7 9. Qxf8 Nxf8
10. Bc1 Ne6 11. Nd2 *
`);

/**
 * White's sound move-10 plans and middlegame conversion guidelines after 9...Nxf8:
 * 10.c4! (welcoming rook trades on d2, punishing 10...h5?, or developing quietly),
 * 10.Bc1! double shield, and 10.f4!.
 */
export const SUICIDE_CONVERSION = parseGame(`
[Variant "Antichess"]
[Result "*"]

1. e3 b5 2. Bxb5 Bb7 3. Bxd7 Bxg2 4. Bxe8 Bxh1 5. Bxf7 Qxd2
6. Bxd2 Bf3 7. Bxg8 Rxg8 8. Qxf3 Nd7 9. Qxf8 Nxf8
10. c4! { 首选方案：控制 d5 并反制 10...Ne6，同时准备按黑方反应分类转化。 [%cal Gc2c4] }
  (10. Bc1! { 稳健预防：先藏回 c1 象，再以 Nd2 与 e3 形成双屏障挡住 c1–h6 斜线。 [%cal Gd2c1,Gc1h6] }
    10... Ne6 11. Nd2! { 有了 Nd2 与 e3 两道屏障，黑方无法再拉出 c1 象。 [%csl Yd2,Ye3] })
  (10. f4! { 直接封住 f4 点并为 Kf2–f3 腾路。 [%cal Gf2f4,Ge1f2] })
10... Rd8
  (10... Rb8 11. a4! { 同样不躲象，欢迎黑车吃 b2 后转而吃掉 d2 象。 [%cal Ga2a4] } 11... Rxb2 12. Nc3 Rxd2 13. Kxd2)
  (10... h5? 11. e4! { 趁黑方腾空 h6，主动打开斜线。 [%cal Ge3e4,Gd2h6] } 11... Rh8 12. Bxh6! Rxh6 { 主动用 bad bishop 换掉黑方一辆车。 })
  (10... h6 11. Nc3 { 黑方退缩时，先出 short-range piece 与王，再推后翼兵兑车。 [%cal Gb1c3,Ge1e2] })
11. a4!
  (11. Nc3! Rxd2 12. Kxd2 { 同样乐于用 weak point 象换掉黑方残局最强的车。 })
11... Rxd2 12. Kxd2! { 简化为白方“王 + 车 + 双马”对黑方“单车 + 单马”，再无 weak point。 } *
`);

/**
 * Comparison of Black's four recaptures after 1.e3 b5 2.Bxb5 e6 3.Bxd7:
 * only 3...Bxd7! avoids an early disadvantage.
 */
export const CLASSIC_E6_RECAPTURES = parseGame(`
[Variant "Antichess"]
[Result "*"]

1. e3 b5 2. Bxb5 e6 3. Bxd7
3... Bxd7! { Classical Bishop Defence：唯一不立即落入下风的 recapture，顺势消除 c8 白格象并保住结构。 }
  (3... Qxd7?? { 把黑后暴露在 d7，并让 a6 成为 double weak point。 [%csl Rd7,Ya6] }
    4. b4! Bxb4 5. Qe2! Bxd2 6. Nxd2 Qxd2 7. Bxd2 c6
    8. Rd1!! { 安静的 preparatory move，威胁 9.Qa6 Nxa6 10.Bb4 后在 d 线 relay。 [%cal Ga1d1,Ge2a6,Gd2b4] }
    8... Kd7
      (8... Kd8 9. Qa6 Nxa6 10. Bb4 Nxb4 11. Rxd8 { 同样在 d 线被白车与黑马 relay sweep。 })
    9. Qa6 Nxa6 10. Bb4 Nxb4 11. Rxd7 Nxc2 12. Rxf7 Nxe3 13. Rxg7 Nxg2
    14. Rxg8 Nxe1 15. Rxc8 Raxc8 16. Nf3 Nxf3 17. Rb1 Nxh2 18. f3 Nxf3 19. Rb5 cxb5 20. a4)
  (3... Nxd7? { Classical Knight Defence：d7 马堵住了自己的 c8 象。 [%csl Rd7,Yc8] }
    4. b4 Bxb4 5. e4 Bxd2 6. Nxd2! { Sjaak 给出的 refutation：用马吃而不走 6.Bxd2，保留无象的干净阵形。 [%cal Gb1d2] }
    6... Nf8 7. Nh3! Qxd2 8. Kxd2 { 白方威胁 Qh5xh7 撕开 h 线。 [%cal Gd1h5,Gh5h7] })
  (3... Kxd7? { 第 3 步就把黑王暴露在中心。 }
    4. b4!
      (4. c4 { 稳健控制局面的替代走法。 })
    4... Bxb4 5. Qf3)
*
`);

/**
 * Classical Bishop Defence (2...e6 3.Bxd7 Bxd7) with the Beltman Attack
 * (4.Na3 Bxa3 5.bxa3): includes 5...Qh4 (mainline), 5...Bc8?, and 5...c6.
 */
export const CLASSIC_E6_BELTMAN = parseGame(`
[Variant "Antichess"]
[Result "*"]

1. e3 b5 2. Bxb5 e6 3. Bxd7 Bxd7 { 唯一不立即败北的 recapture。 }
4. Na3! { Beltman Attack：甘愿形成 doubled pawns，也要立刻兑掉黑方 f8 象并打开 b 线。 [%cal Gb1a3,Rf8a3] }
4... Bxa3 5. bxa3 { 打开 b 线与 a1 车，同时为白后打开 Qg4–g7–f7 的王翼通路。 [%cal Ga1b1,Gd1g4] }
5... Qh4 { 黑方最复杂的反击（占 proof tree 59%）：抢先挑起后翼与王翼的对攻。 }
  (5... Bc8? { 退象回防，blunder。 } 6. a4! Qxd2 7. Bxd2 { 白方消除黑后，保留 Qb1–b7–c7 入侵后翼的强力威胁。 [%cal Gd1b1,Gb1b7] })
  (5... c6 { 封堵 a8–h1 长对角线（占 proof tree 26%）。 }
    6. Qf3 { 也可走 6.Qg4 或 6.Bb2，利用双马与开放 b 线持续施压。 }
    (6. Qg4)
    (6. Bb2))
6. Qg4! Qxf2 7. Kxf2 Bc8 8. Qxg7 a5 9. Qxf7 Kxf7 10. Nh3 Nf6 11. a4 *
`);

/**
 * Classical Bishop Defence with the Minear Attack (4.b4 Bxb4 5.a4), illustrating
 * the intermediate rook capture 8.Rxa7! before recapturing on d2, plus the
 * 8.Qxd2?? and 8.Kxd2? capture-order mistakes.
 */
export const CLASSIC_E6_MINEAR = parseGame(`
[Variant "Antichess"]
[Result "*"]

1. e3 b5 2. Bxb5 e6 3. Bxd7 Bxd7
4. b4 { Minear Attack：连送后翼两兵诱使黑方兑掉双象与后，避免 a 线 doubled pawns。 [%cal Gb2b4] }
  (4. Nh3 Nh6 5. b4 Bxb4 6. a4 { solution explorer 采用的简化改良次序。 })
4... Bxb4 5. a4! Bxd2 6. Bxd2 Bxa4 7. Rxa4 Qxd2
8. Rxa7 { 正确次序：先插入 intermediate move 消除 a 线双车，再走 9.Kxd2！ [%cal Ga4a7] [%csl Ra7,Yd2] }
  (8. Qxd2?? { 过早把白后暴露在后翼。 } 8... a5 9. Rxa5 Rxa5 10. Qxa5 c5 { 白后被一路 sweep。 })
  (8. Kxd2? { 未先消除 a 线隐患。 } 8... Na6 9. Rxa6 Rd8! 10. Rxe6 Rxd2 11. Rxe8? Rxc2 { 黑方反击得手。 })
8... Rxa7 9. Kxd2! c5 10. Qg4 Rd7 11. Qxe6 Rxd2 12. Qxe8 Rxf2 13. Qxg8 Rxg2 14. Qxh7 Rxh7 15. Nf3 { 白方吃掉黑王并转入优势车马残局。 } *
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
 * Bishop Defence (2...Ba6): comparing 3.Bxd7! vs 3.Bxa6? and Black's three
 * recaptures at d7, including Sjaak's king sacrifice 3...Qxd7? 4.Ke2!!.
 */
export const BISHOP_BA6_RECAPTURES = parseGame(`
[Variant "Antichess"]
[Result "*"]

1. e3 b5 2. Bxb5 Ba6
3. Bxd7! { 拒绝 3.Bxa6，把黑方 a6 象晾在边线。 [%cal Gb5d7] [%csl Ya6] }
  (3. Bxa6? Nxa6 { 帮黑方一举消除 c8 坏象并完成 b8 马 development，黑方后翼完全畅通。 })
3... Nxd7! { 黑方最强 mainline：保住王和后，不阻塞底线。 }
  (3... Qxd7? 4. Ke2!! { Sjaak 发现的惊人 king sacrifice：用王换掉黑方 a6 象与后，白方保留后与双马直扑王翼。 [%cal Ge1e2,Ra6e2] }
    4... Bxe2 5. Nxe2 Qxd2 6. Bxd2)
  (3... Kxd7? 4. d3! Bxd3 5. Qxd3 Kc8 6. Qxh7 Rxh7 7. Bd2 Qxd2 8. Nxd2 { 黑方失去王翼屏障，子力被压制在底线。 })
*
`);

/**
 * Bishop Defence (2...Ba6): Black's theoretically toughest defence in the
 * Classical complex, met by 3.Bxd7 Nxd7 4.d3! Bxd3 5.Qxd3.
 */
export const BISHOP_BA6_MAIN = parseGame(`
[Variant "Antichess"]
[Result "*"]

1. e3 b5 2. Bxb5 Ba6 { Bishop Defence：试图顺手兑掉难出的 c8 白格象。 }
3. Bxd7! { 拒绝 3.Bxa6 Nxa6 帮黑方完成 development，先把 a6 象晾在边线。 [%cal Gb5d7,Ba6d3] }
3... Nxd7 4. d3! { 把 a6 象拉进 d3 吃掉，同时出后瞄准 h7 兵。 [%cal Gd2d3,Gd3h7] }
4... Bxd3 5. Qxd3 { 一石二鸟：消除黑方白格象，并沿 d3–h7 斜线直接攻击 h7 兵。 [%cal Gd3h7] [%csl Rh7] }
5... Qb8 { 黑方最顽强的防守：反击 b2，准备兑光王翼与后翼 long-range piece。 [%cal Rb8b2,Gd3h7] }
  (5... g6? 6. Qxg6 fxg6 7. c4! { 封锁黑方后翼。 })
  (5... Rb8 6. Qxh7 Rxh7 7. b3 Rxh2 8. Rxh2 Rxb3 9. cxb3 { 兑掉重子后以 Kd2 出王控制中心。 })
6. Qxh7 Rxh7 7. Nc3 Qxb2 8. Bxb2 Rxh2 9. Rxh2 a5
10. Ba3 e5 11. Bxf8 Nxf8
  (11... Kxf8 { 走法相同，同样转入对称子力残局。 })
12. Rh6 gxh6 13. f4 exf4 14. exf4 { 双方 material 完全对称，但白方 Nc3 与中心兵结构协调，黑方双马受困且四兵孤立。 } *
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
 * Knight Defence (2...Nh6) and Ancient Defence (2...c6?) with refutations and traps.
 */
export const OTHER_DEFENCES = {
  nh6: parseGame(`
[Variant "Antichess"]
[Result "*"]

1. e3 b5 2. Bxb5 Nh6 { Knight Defence：先把王翼马跳到边线，保留 e7 兵不动。 }
3. Bxd7 Nxd7! { 黑方最强应着，不阻塞后翼也不暴露 h 线。 }
  (3... Qxd7? 4. Qh5! { 吃掉黑方后翼重子并封锁黑方出路。 [%cal Gd1h5] }
    (4. g4?! Nxg4 5. Qxg4 Qxg4 { 帮黑方兑后解困。 })
    4... Qxd2 5. Bxd2 Bh3 6. Nxh3!)
  (3... Bxd7 4. h3! Bxh3 5. Rxh3 { 顺手消除黑方白格象并活化 h 线车。 })
4. e4! { 黑方在 e4 没有任何反击点，白方顺利打开 c1 象与 g1 马的通道。 [%cal Ge3e4,Gc1h6,Gg1e2] }
  (4. c4 { 同样稳健的 space 控制走法。 })
*
`),
  c6: parseGame(`
[Variant "Antichess"]
[Result "*"]

1. e3 b5 2. Bxb5 c6? { Ancient Defence：引白象去 c6 顺势跳出 b8 马，却未解决双象被关的问题。 }
3. Bxc6 Nxc6
4. b4! { 连弃后翼两兵的简明破法。 [%cal Gb2b4] }
  (4. d4? Nxd4 5. Qxd4 Qa5 { 给黑方挑起混乱后战的机会。 })
4... Nxb4 5. a4! Nxc2 6. Qxc2 { 消除黑方唯一活跃的 c6 马并安全送掉后翼兵，白后瞄准 h7 兵。 [%cal Gc2h7] [%csl Rh7,Yc8] } *
`),
};

/**
 * Quick refutations of other Black second-move sidelines after 1.e3 b5 2.Bxb5:
 * 2...Nf6? (fails because e3 is protected), 2...h5?, 2...e5?, 2...Nc6?, 2...Na6?, 2...d5?, 2...d6?.
 */
export const OTHER_SIDELINES = parseGame(`
[Variant "Antichess"]
[Result "*"]

1. e3 b5 2. Bxb5
2... Nf6? { 想模仿 1.e4 b5 2.Bxb5 Nf6，但白兵在 e3 而非 e4，f6 马没有兵可吃。 [%csl Ye3] }
  (2... h5? 3. Qxh5 Rxh5 4. Bxd7 Qxd7 { 早早丢掉王翼屏障。 })
  (2... e5? { 暴露黑王斜线。 } 3. Bxd7)
  (2... Nc6? 3. Bxc6! { 唯一 legal move，逼迫黑方在 c6 吃回。 })
  (2... Na6? 3. Bxa6! { 白方轻松消除象与边缘马。 })
  (2... d5? 3. Bxe8! { 唯一 legal move，直接吃掉黑王并撕开底线。 })
  (2... d6? 3. Bxe8! { 唯一 legal move，同样直接吃掉黑王。 })
3. Bxd7 Nfxd7
  (3... Nbxd7 4. Qf3! { 紧逼 b7 与 a8。 })
4. Qf3! { 白后紧逼 b7 与 a8。 [%cal Gf3b7,Bf3a8] } *
`);
