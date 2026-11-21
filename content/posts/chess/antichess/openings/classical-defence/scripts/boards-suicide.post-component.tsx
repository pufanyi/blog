import { ChessDiagram, ChessGame, moveArrows, moveText } from '../../../../../../shared/chess';
import {
  E3_B5_STRUCTURE,
  E3_BA6_TRAP,
  SUICIDE_BC1_SHIELD,
  SUICIDE_BD5,
  SUICIDE_BD5_BXA2,
  SUICIDE_BD5_BXG8,
  SUICIDE_CONVERSION,
  SUICIDE_KXD2_TRAP,
  SUICIDE_MAIN,
  SUICIDE_MOVE10_BLUNDERS,
  SUICIDE_NE2_STALEMATE,
  SUICIDE_RECAPTURES,
} from './games';

function Ba6Threat() {
  return (
    <ChessDiagram
      id="cd-ba6-threat"
      game={E3_BA6_TRAP}
      ply={7}
      title="1.e3 蕴含的 2.Ba6 威胁"
      description="1.e3 h6 2.Ba6 Nxa6 3.b4 Nxb4 4.Qf3 之后，白后瞄准 b7 与 a8，而 b4 黑马只能在 a2 或 c2 吃兵，随后把黑方后或车拖入 sweep。"
      arrows={[
        { from: 'f3', to: 'b7', role: 'path' },
        { from: 'b4', to: 'a2', role: 'option' },
        { from: 'b4', to: 'c2', role: 'option' },
      ]}
      marks={[{ square: 'b4', role: 'target' }]}
      caption={`${moveText(E3_BA6_TRAP, 0, 7)}：黑方若随意走 waiting move 并用马吃 a6 象，就会在 3.b4 Nxb4 4.Qf3 后陷入 forced sweep。`}
    />
  );
}

function Ba6ThreatGame() {
  return (
    <ChessGame
      id="cd-ba6-game"
      game={E3_BA6_TRAP}
      ply={3}
      title="2.Ba6! 对黑方 waiting move 的两种应法"
      description="对比 2...bxa6（形成 doubled pawns 且封死 c8 象）与 2...Nxa6?? 3.b4 Nxb4 4.Qf3!。"
      caption="2.Ba6! 之后：黑方无论走 2...bxa6 还是 2...Nxa6?? 3.b4 Nxb4 4.Qf3!，都会在开局阶段陷入被动。"
    />
  );
}

function E3B5Tabiya() {
  return (
    <ChessDiagram
      id="cd-e3-b5-structure"
      game={E3_B5_STRUCTURE}
      ply={3}
      title="1.e3 b5 2.Bxb5 与 1.e4 b5 的结构差异"
      description="2.Bxb5 之后，e3 兵受 d2 与 f2 兵双重保护，且不在 f6 马的射程内；b5 白象正对 d7，白方下一回合几乎必然走 3.Bxd7。"
      arrows={[
        { from: 'b5', to: 'd7', role: 'path' },
        { from: 'd2', to: 'e3', role: 'idea' },
        { from: 'f2', to: 'e3', role: 'idea' },
        { from: 'g8', to: 'f6', role: 'option' },
      ]}
      marks={[
        { square: 'e3', role: 'area' },
        { square: 'd7', role: 'target' },
      ]}
      caption={`${moveText(E3_B5_STRUCTURE, 0, 3)}：e3 兵受 d2、f2 双重保护且不在 2...Nf6 射程内，迫使黑方在第 2 步提前应对 3.Bxd7。`}
    />
  );
}

function SuicideMain() {
  return (
    <ChessGame
      id="cd-suicide-main"
      game={SUICIDE_MAIN}
      title="Suicide Defence 1.e3 b5 2.Bxb5 Bb7 mainline 与 10...Ne6 反击反驳"
      description="逐步查看 Suicide Defence 前 9 步 forced variation（含第 3 步退缩吃子反驳），以及第 10 步白方 10.c4 如何通过马与车的 relay 反杀黑方的 10...Ne6。"
      caption="Suicide Defence 典型对局：第 6 步以 6.Bxd2 锁定 mainline，第 10 步以 10.c4 埋伏马与车的 relay sweep。"
      result="白方子力送光，获胜"
    />
  );
}

function SuicideRecapture() {
  return (
    <ChessGame
      id="cd-suicide-move6"
      game={SUICIDE_RECAPTURES}
      ply={10}
      title="5...Qxd2 之后白方的五种 recapture"
      description="黑后在 d2，白方 f7 象同时攻击 g8 马。6.Bxd2 锁定唯一 mainline；6.Kxd2 与 6.Nxd2 可行但增加分支；6.Qxd2 与 6.Bxg8 直接输棋。"
      caption={`${moveText(SUICIDE_RECAPTURES, 0, 10)} 之后：五种 recapture 中，6.Bxd2 令双方接下来四步全部唯一；6.Qxd2 与 6.Bxg8 则立刻落入黑方 sweep。点击棋谱中的任一 variation 即可逐步查看。`}
      result="进入第 10 步关键 tabiya"
    />
  );
}

function SuicideKxd2Choice() {
  return (
    <ChessDiagram
      id="cd-suicide-kxd2-choice"
      game={SUICIDE_KXD2_TRAP}
      ply={14}
      title="6.Kxd2 Bd5! 7.Bxg8 Bxa2 之后的捕获次序抉择"
      description="在 7...Bxa2 之后，白方必须走 8.Rxa2! 把黑车留在 g8；若走 8.Bxh7??，黑车沿 h7–h2 接手反杀。"
      arrows={[
        { from: 'a1', to: 'a2', role: 'path' },
        { from: 'f7', to: 'h7', role: 'threat' },
        { from: 'h8', to: 'h7', role: 'threat' },
        { from: 'h7', to: 'h2', role: 'idea' },
      ]}
      marks={[
        { square: 'a2', role: 'area' },
        { square: 'h7', role: 'target' },
      ]}
      caption={`${moveText(SUICIDE_KXD2_TRAP, 10, 14)} 之后：必须走 8.Rxa2! 留住 g8 黑车，不能走看似多送一子的 8.Bxh7??。`}
    />
  );
}

function SuicideBd5() {
  return (
    <ChessGame
      id="cd-suicide-bd5"
      game={SUICIDE_BD5}
      ply={12}
      title="6.Bxd2 Bd5 之后的 forced variation"
      description="d5 黑象保护 g8 马并瞄准 a2。7.Bxd5 会被 7...Nh6 反杀；7.Bxg8 之后，黑方无论用车、象 recapture 还是先吃 a2，都会被拖入 forced sweep。"
      caption={`${moveText(SUICIDE_BD5, 10, 12)} 之后：白方只能走 7.Bxg8 获胜；mainline 与两条 sideline 中，黑方从白方第 8 步起每一步都只有一个 legal move。`}
      result="白方子力送光，获胜"
    />
  );
}

function SuicideBd5Rxg8() {
  return (
    <ChessDiagram
      id="cd-suicide-bd5-rxg8"
      game={SUICIDE_BD5}
      ply={15}
      title="7...Rxg8 8.Qh5!：白后横扫第七、八横排并引出黑格象"
      description="8.Qh5! 之后黑方唯一能吃的是 8...Bxa2，随后白后连吃 h7、g8、g7，把 f8 黑格象引上 a1–h8 长对角线。"
      arrows={[...moveArrows(SUICIDE_BD5, [17, 19, 23]), { from: 'g7', to: 'b2', role: 'idea' }]}
      marks={[{ square: 'h7', role: 'target' }]}
      caption={`${moveText(SUICIDE_BD5, 13, 15)}：白后依次吃掉 h7、g8、g7 后，把 f8 黑格象引上 a1–h8 长对角线完成 sweep。`}
    />
  );
}

function SuicideBd5Bxg8() {
  return (
    <ChessDiagram
      id="cd-suicide-bd5-bxg8"
      game={SUICIDE_BD5_BXG8}
      ply={15}
      title="7...Bxg8 8.c4!：把 c 兵送上 a2–g8 斜线"
      description="8.c4! 迫使 g8 黑象走 8...Bxc4，白方随后以 9.Ba5 与 10.Bxc7 逐一清理双象并交接给 h8 黑车。"
      arrows={[
        { from: 'g8', to: 'c4', role: 'threat' },
        { from: 'd2', to: 'a5', role: 'path' },
        { from: 'c4', to: 'a2', role: 'idea' },
        { from: 'a5', to: 'c7', role: 'path' },
      ]}
      marks={[{ square: 'c4', role: 'target' }]}
      caption={`${moveText(SUICIDE_BD5_BXG8, 13, 15)}：把 c4 兵送上 a2–g8 斜线，黑象兑掉后由 h8 车沿横排完成 sweep。`}
    />
  );
}

function SuicideBd5Bxa2() {
  return (
    <ChessDiagram
      id="cd-suicide-bd5-bxa2"
      game={SUICIDE_BD5_BXA2}
      ply={19}
      title="7...Bxa2 8.Rxa2 Rxg8 9.Rxa7 Rxa7 10.Ba5!：先把黑车引上 h 线"
      description="10.Ba5! 迫使 a7 黑车吃象到 a5，白方再走 11.Qh5! 把黑车拉上 h 线扫清全盘。"
      arrows={[
        { from: 'a7', to: 'a5', role: 'threat' },
        { from: 'd1', to: 'h5', role: 'path' },
        { from: 'a5', to: 'h5', role: 'idea' },
      ]}
      marks={[
        { square: 'a5', role: 'area' },
        { square: 'h5', role: 'target' },
      ]}
      caption={`${moveText(SUICIDE_BD5_BXA2, 16, 19)}：先用 10.Ba5! 把黑车引到 a5，再走 11.Qh5! 将其拉上 h 线完成 sweep。`}
    />
  );
}

function SuicideBattery() {
  return (
    <ChessDiagram
      id="cd-suicide-move10"
      game={SUICIDE_MAIN}
      ply={18}
      title="9...Nxf8 之后的 battery weak point 与白方对策"
      description="白方 d2 象沿 d2–h6 斜线仅被 e3 兵挡住。黑方威胁 Ne6–Nf4 调离 e3 兵并推 g5 引出白象；白方走 10.c4 反制 Ne6，或退 10.Bc1 藏好 weak point 象。"
      arrows={[
        { from: 'c2', to: 'c4', role: 'path' },
        { from: 'd2', to: 'c1', role: 'option' },
        { from: 'f8', to: 'e6', role: 'threat', label: '1' },
        { from: 'e6', to: 'f4', role: 'threat', label: '2' },
        { from: 'd2', to: 'h6', role: 'idea' },
      ]}
      marks={[
        { square: 'd2', role: 'target' },
        { square: 'e3', role: 'area' },
      ]}
      caption="9...Nxf8 之后：白方 material 与 pawn structure 全面占优，但 Bd2 + e3 构成 battery；先走 10.c4 或 10.Bc1 化解 ...Ne6–Nf4，才能安全转化胜势。"
    />
  );
}

function SuicideMove10Blunders() {
  return (
    <ChessGame
      id="cd-suicide-move10-blunders"
      game={SUICIDE_MOVE10_BLUNDERS}
      ply={18}
      title="第 10 步必须避开的两类错误（10.Na3??、10.Ne2?? 与自拆掩体）"
      description="从 9...Nxf8 出发，比较 10.Na3??、10.Ne2??（double control 导致 a4 兵 stalemate 败局）以及 10.Bc3?? 等自 expose 象的败着。"
      caption="9...Nxf8 后的十种败着：忽略 battery 的 10.Na3??、制造 double control 的 10.Ne2??，以及主动暴露或拆掩体的 10.Bc3??/e4??。"
      result="黑方反杀或 stalemate 获胜"
    />
  );
}

function SuicideNe2Stalemate() {
  return (
    <ChessDiagram
      id="cd-suicide-ne2-stalemate"
      game={SUICIDE_NE2_STALEMATE}
      ply={35}
      title="10.Ne2?? 变化终点：18.Nxa8 后黑方 a4 兵 stalemate 获胜"
      description="白马扫光黑方子力后停在 a8，而之前留在 a3 的白马恰好堵死了黑方唯一的 a4 兵，黑方轮走无棋可走获胜。"
      arrows={[{ from: 'a3', to: 'a4', role: 'threat' }]}
      marks={[
        { square: 'a4', role: 'target' },
        { square: 'a3', role: 'area' },
      ]}
      caption={`${moveText(SUICIDE_NE2_STALEMATE, 18, 35)}：白马扫光黑子，但 a4 兵被 a3 白马堵死陷入 stalemate，黑方获胜。`}
    />
  );
}

function SuicideBh6Relay() {
  return (
    <ChessDiagram
      id="cd-suicide-bh6-relay"
      game={SUICIDE_MAIN}
      ply={25}
      title="10.c4! Ne6?? 11.c5! Nxc5 12.e4! Nxe4 13.Bh6!!：马与车 relay 的关键一着"
      description="e4 黑马同时攻击 f2，黑方下一回合必须吃子；白方趁机把 d2 象送到 h6 给 g7 兵吃，无论黑方走 13...gxh6 还是 13...Nxf2，最终都由 g8 黑车接手第一横排 sweep。"
      arrows={[
        { from: 'e4', to: 'f2', role: 'option' },
        { from: 'g7', to: 'h6', role: 'option' },
        { from: 'g8', to: 'g1', role: 'idea', label: '14' },
        { from: 'g1', to: 'e1', role: 'idea', label: '15' },
        { from: 'e1', to: 'a1', role: 'idea', label: '16' },
      ]}
      marks={[
        { square: 'h6', role: 'target' },
        { square: 'f2', role: 'area' },
      ]}
      caption={`${moveText(SUICIDE_MAIN, 18, 25)}：利用 e4 马的吃子义务腾空 d2，随后把 sweep 义务交给 g8 黑车。`}
    />
  );
}

function SuicideBc1Barrier() {
  return (
    <ChessDiagram
      id="cd-suicide-bc1-barrier"
      game={SUICIDE_BC1_SHIELD}
      ply={21}
      title="10.Bc1! Ne6 11.Nd2!：双屏障彻底封死 c1–h6 斜线"
      description="白象退回 c1 后，白方用 Nd2 与 e3 形成两道屏障；即便日后 e3 兵被兑掉，c1 象依然安全。"
      arrows={[
        { from: 'c1', to: 'h6', role: 'idea' },
        { from: 'e6', to: 'f4', role: 'threat' },
      ]}
      marks={[
        { square: 'd2', role: 'area' },
        { square: 'e3', role: 'area' },
      ]}
      caption={`${moveText(SUICIDE_BC1_SHIELD, 18, 21)}：Nd2 与 e3 双重遮护 c1 象，无需计算复杂战术即可稳健转化。`}
    />
  );
}

function SuicideConversion() {
  return (
    <ChessGame
      id="cd-suicide-conversion"
      game={SUICIDE_CONVERSION}
      ply={18}
      title="第 10 步方案与中局转化：10.c4! 应对黑车挑衅与缩防"
      description="对比 10.c4!（面对 10...Rd8、10...Rb8 时欢迎兑掉 d2 象；面对 10...h5? 以 11.e4 12.Bxh6 兑车；面对 10...h6 稳步出子）、10.Bc1! 与 10.f4!。"
      caption="第 10 步之后的转化口诀：黑车来捉象就欢迎兑子，黑方退缩则先出 short-range piece 再推兵兑车。"
    />
  );
}

export const POST_COMPONENTS = {
  Ba6Threat,
  Ba6ThreatGame,
  E3B5Tabiya,
  SuicideMain,
  SuicideRecapture,
  SuicideKxd2Choice,
  SuicideBd5,
  SuicideBd5Rxg8,
  SuicideBd5Bxg8,
  SuicideBd5Bxa2,
  SuicideBattery,
  SuicideMove10Blunders,
  SuicideNe2Stalemate,
  SuicideBh6Relay,
  SuicideBc1Barrier,
  SuicideConversion,
};
