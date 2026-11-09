import { ChessDiagram, ChessGame, moveArrows, moveText } from '../../../../../../shared/chess';
import {
  BISHOP_BA6_MAIN,
  CLASSIC_E6_BELTMAN,
  CLASSIC_E6_MINEAR,
  E3_BA6_TRAP,
  SUICIDE_BD5,
  SUICIDE_MAIN,
  SUICIDE_RECAPTURES,
} from './games';

function Ba6Threat() {
  return (
    <ChessDiagram
      id="cd-ba6-threat"
      game={E3_BA6_TRAP}
      ply={7}
      title="1.e3 蕴含的 2.Ba6 威胁"
      description="1.e3 h6 2.Ba6 Nxa6 3.b4 Nxb4 4.Qf3 之后，白后瞄准 b7 与 a8，而 b4 黑马只能在 a2 或 c2 吃兵，随后把黑方后或车拖入清扫。"
      arrows={[
        { from: 'f3', to: 'b7', role: 'path' },
        { from: 'b4', to: 'a2', role: 'option' },
        { from: 'b4', to: 'c2', role: 'option' },
      ]}
      marks={[{ square: 'b4', role: 'target' }]}
      caption={`${moveText(E3_BA6_TRAP, 0, 7)}：黑方若随意走无关着法并用马吃 a6 象，就会在 3.b4 Nxb4 4.Qf3 后陷入强制清扫。`}
    />
  );
}

function SuicideMain() {
  return (
    <ChessGame
      id="cd-suicide-main"
      game={SUICIDE_MAIN}
      title="自杀防御 1.e3 b5 2.Bxb5 Bb7 主线与 10...Ne6 反击反驳"
      description="逐步查看自杀防御前 9 步强制变化，以及第 10 步白方 10.c4 如何通过马车接力反杀黑方的 10...Ne6。"
      caption="自杀防御典型对局：第 6 步以 6.Bxd2 锁定主线，第 10 步以 10.c4 埋伏马与车的接力清扫。"
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
      title="5...Qxd2 之后白方的五种吃法"
      description="黑后在 d2，白方 f7 象同时攻击 g8 马。6.Bxd2 锁定唯一主线；6.Kxd2 与 6.Nxd2 可行但增加分支；6.Qxd2 与 6.Bxg8 直接输棋。"
      caption={`${moveText(SUICIDE_RECAPTURES, 0, 10)} 之后：五种吃法中，6.Bxd2 令双方接下来四步全部唯一；6.Qxd2 与 6.Bxg8 则立刻落入黑方清扫。点击棋谱中的任一变化即可逐步查看。`}
      result="进入第 10 步关键局面"
    />
  );
}

function SuicideBd5() {
  return (
    <ChessGame
      id="cd-suicide-bd5"
      game={SUICIDE_BD5}
      ply={12}
      title="6.Bxd2 Bd5 之后的强制变化"
      description="d5 黑象保护 g8 马并瞄准 a2。7.Bxd5 会被 7...Nh6 反杀；7.Bxg8 之后，黑方无论用车、象吃回还是先吃 a2，都会被拖入强制清扫。"
      caption={`${moveText(SUICIDE_BD5, 10, 12)} 之后：白方只能走 7.Bxg8 获胜；主线与两条变化中，黑方从白方第 8 步起每一步都只有一个合法着法。`}
      result="白方子力送光，获胜"
    />
  );
}

function SuicideBattery() {
  return (
    <ChessDiagram
      id="cd-suicide-move10"
      game={SUICIDE_MAIN}
      ply={18}
      title="9...Nxf8 之后的炮台弱点与白方对策"
      description="白方 d2 象沿 d2–h6 斜线仅被 e3 兵挡住。黑方威胁 Ne6–Nf4 调离 e3 兵并推 g5 引出白象；白方走 10.c4 反制 Ne6，或退 10.Bc1 藏好弱点象。"
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
      caption="9...Nxf8 之后：白方子力与兵形全面占优，但 Bd2 + e3 构成炮台；先走 10.c4 或 10.Bc1 化解 ...Ne6–Nf4，才能安全转化胜势。"
    />
  );
}

function ClassicBeltman() {
  return (
    <ChessGame
      id="cd-classic-beltman"
      game={CLASSIC_E6_BELTMAN}
      title="古典象防御 2...e6 3.Bxd7 Bxd7：Beltman 攻击主线"
      description="逐步查看 4.Na3 Bxa3 5.bxa3 如何兑掉黑方 f8 象，并以 6.Qg4 反击黑方 5...Qh4，吃掉黑王进入优势中残局。"
      caption="Beltman 攻击（4.Na3 Bxa3 5.bxa3）：用后翼叠兵换取消除黑方黑格象与王翼入侵。"
    />
  );
}

function MinearOrder() {
  return (
    <ChessDiagram
      id="cd-minear-order"
      game={CLASSIC_E6_MINEAR}
      ply={14}
      title="Minear 攻击 7...Qxd2 之后的中间着 8.Rxa7"
      description="黑后吃 d2 后，白方不急于吃回 d2 后，而是先走中间着 8.Rxa7 兑掉双车，再走 9.Kxd2，避免 8.Qxd2 a5 或 8.Kxd2 Na6 9.Rxa6 Rd8 的反击。"
      arrows={[
        ...moveArrows(CLASSIC_E6_MINEAR, [15], 'path'),
        { from: 'b1', to: 'd2', role: 'option' },
        { from: 'e1', to: 'd2', role: 'threat' },
        { from: 'd1', to: 'd2', role: 'threat' },
      ]}
      marks={[
        { square: 'a7', role: 'target' },
        { square: 'd2', role: 'area' },
      ]}
      caption={`${moveText(CLASSIC_E6_MINEAR, 6, 14)} 之后：先插入 8.Rxa7 Rxa7 消除 a 线隐患，再以 9.Kxd2 吃后。`}
    />
  );
}

function BishopDefenceMain() {
  return (
    <ChessGame
      id="cd-bishop-main"
      game={BISHOP_BA6_MAIN}
      title="象防御 1.e3 b5 2.Bxb5 Ba6 主线"
      description="逐步查看白方如何以 3.Bxd7 Nxd7 4.d3 Bxd3 5.Qxd3 吃掉 a6 黑象、瞄准 h7 兵，并在重子兑光后取得协调优势。"
      caption="象防御主线：拒绝 3.Bxa6，改走 3.Bxd7 Nxd7 4.d3 消除黑象并抢先出后。"
    />
  );
}

export const POST_COMPONENTS = {
  Ba6Threat,
  SuicideMain,
  SuicideRecapture,
  SuicideBd5,
  SuicideBattery,
  ClassicBeltman,
  MinearOrder,
  BishopDefenceMain,
};
