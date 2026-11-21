import { ChessDiagram, ChessGame, moveArrows, moveText } from '../../../../../../shared/chess';
import {
  BISHOP_BA6_KE2,
  BISHOP_BA6_MAIN,
  BISHOP_BA6_RECAPTURES,
  CLASSIC_E6_BELTMAN,
  CLASSIC_E6_MINEAR,
  CLASSIC_E6_RECAPTURES,
  CLASSIC_E6_SIDELINES,
  OTHER_DEFENCES,
  OTHER_SIDELINES,
} from './games';

function ClassicE6Recaptures() {
  return (
    <ChessGame
      id="cd-classic-e6-recaptures"
      game={CLASSIC_E6_RECAPTURES}
      ply={5}
      title="Classical Defence 1.e3 b5 2.Bxb5 e6 3.Bxd7 后的四种 recapture"
      description="从 3.Bxd7 出发，对比唯一正确的 3...Bxd7!，以及会立刻落入被动或 forced sweep 的 3...Qxd7??、3...Nxd7? 与 3...Kxd7?。"
      caption={`${moveText(CLASSIC_E6_RECAPTURES, 0, 5)} 之后：唯有 3...Bxd7! 能守住结构，其余三种 recapture 均被迅速击破。`}
    />
  );
}

function ClassicQxd7Rd1() {
  return (
    <ChessDiagram
      id="cd-classic-qxd7-rd1"
      game={CLASSIC_E6_SIDELINES.qxd7}
      ply={15}
      title="3...Qxd7?? 分支中的安静预备手 8.Rd1!!"
      description="黑方走 7...c6! 暂时封住 a8–h1 斜线后，白方走 8.Rd1!! 准备 9.Qa6 Nxa6 10.Bb4 Nxb4 后在 d 线 relay sweep。"
      arrows={[
        { from: 'e2', to: 'a6', role: 'path' },
        { from: 'd2', to: 'b4', role: 'path' },
        { from: 'd1', to: 'd7', role: 'idea' },
      ]}
      marks={[
        { square: 'a6', role: 'target' },
        { square: 'd7', role: 'area' },
      ]}
      caption={`${moveText(CLASSIC_E6_SIDELINES.qxd7, 13, 15)}：8.Rd1!! 预先接管 d 线，无论黑王逃向 d7 还是 d8 都难逃 9.Qa6 后的 relay sweep。`}
    />
  );
}

function ClassicNxd7Sjaak() {
  return (
    <ChessDiagram
      id="cd-classic-nxd7-sjaak"
      game={CLASSIC_E6_SIDELINES.nxd7}
      ply={11}
      title="3...Nxd7? 分支中 Sjaak 的 6.Nxd2!"
      description="6.Nxd2! 特意保留无象的干净阵形；黑方 c8 象仍被 d7 马堵住，白方随后以 Qh5xh7 撕开 h 线。"
      arrows={[
        { from: 'd1', to: 'h5', role: 'path' },
        { from: 'h5', to: 'h7', role: 'idea' },
      ]}
      marks={[
        { square: 'd2', role: 'area' },
        { square: 'h7', role: 'target' },
      ]}
      caption={`${moveText(CLASSIC_E6_SIDELINES.nxd7, 9, 11)}：用马吃而不走 6.Bxd2，彻底保留无象阵形并瞄准 Qh5xh7。`}
    />
  );
}

function BeltmanBxa3() {
  return (
    <ChessDiagram
      id="cd-beltman-bxa3"
      game={CLASSIC_E6_BELTMAN}
      ply={9}
      title="Beltman Attack 5.bxa3：以 doubled pawns 换取黑格象兑子与王翼通路"
      description="5.bxa3 消除了黑方活跃的 f8 象，打开 b 线与 a1 车，并为白后打开 Qg4–g7–f7 的进攻线路。"
      arrows={[
        { from: 'a1', to: 'b1', role: 'idea' },
        { from: 'd1', to: 'g4', role: 'path' },
        { from: 'g4', to: 'g7', role: 'path' },
        { from: 'g7', to: 'f7', role: 'path' },
      ]}
      marks={[
        { square: 'a3', role: 'area' },
        { square: 'b3', role: 'area' },
      ]}
      caption={`${moveText(CLASSIC_E6_BELTMAN, 6, 9)}：牺牲 a 线兵形，立即兑掉黑方 f8 象并打通 b 线与王翼斜线。`}
    />
  );
}

function ClassicBeltman() {
  return (
    <ChessGame
      id="cd-classic-beltman"
      game={CLASSIC_E6_BELTMAN}
      title="Classical Bishop Defence 2...e6 3.Bxd7 Bxd7：Beltman Attack"
      description="逐步查看 4.Na3 Bxa3 5.bxa3 如何兑掉黑方 f8 象，并应对黑方的 5...Qh4、5...Bc8? 与 5...c6。"
      caption="Beltman Attack（4.Na3 Bxa3 5.bxa3）：包含 mainline 5...Qh4 以及 5...Bc8? 与 5...c6 两种分支。"
    />
  );
}

function ClassicMinear() {
  return (
    <ChessGame
      id="cd-classic-minear"
      game={CLASSIC_E6_MINEAR}
      title="Classical Bishop Defence：Minear Attack（4.b4 Bxb4 5.a4）完整变化"
      description="逐步查看 Minear Attack 如何连送后翼两兵兑光双象与后，在 7...Qxd2 时用 8.Rxa7! 避开 8.Qxd2?? 与 8.Kxd2? 的陷阱，并转入优势车马残局。"
      caption="Minear Attack：包含 4.Nh3 改良次序、7...Qxd2 的三种吃法对比，以及 10.Qg4! 吃掉黑王后的残局转化。"
    />
  );
}

function MinearOrder() {
  return (
    <ChessDiagram
      id="cd-minear-order"
      game={CLASSIC_E6_MINEAR}
      ply={14}
      title="Minear Attack 7...Qxd2 之后的 intermediate move 8.Rxa7"
      description="黑后吃 d2 后，白方不急于 recapture d2 后，而是先走 intermediate move 8.Rxa7 兑掉双车，再走 9.Kxd2，避免 8.Qxd2 a5 或 8.Kxd2 Na6 9.Rxa6 Rd8 的反击。"
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
      caption={`${moveText(CLASSIC_E6_MINEAR, 6, 14)} 之后：先插入 intermediate move 8.Rxa7 Rxa7 消除 a 线隐患，再以 9.Kxd2 吃后。`}
    />
  );
}

function BishopRecaptures() {
  return (
    <ChessGame
      id="cd-bishop-recaptures"
      game={BISHOP_BA6_RECAPTURES}
      ply={4}
      title="Bishop Defence 2...Ba6 之后白方的选择与黑方三种 recapture"
      description="对比 3.Bxd7! 与 3.Bxa6?，以及黑方 3...Nxd7!、3...Qxd7? 4.Ke2!! 与 3...Kxd7? 4.d3!。"
      caption={`${moveText(BISHOP_BA6_RECAPTURES, 0, 4)} 之后：白方拒绝 3.Bxa6?，走 3.Bxd7! 把 a6 象晾在边线，再用 4.Ke2!! 与 4.d3! 分别惩罚错误 recapture。`}
    />
  );
}

function BishopKe2Diagram() {
  return (
    <ChessDiagram
      id="cd-bishop-ke2"
      game={BISHOP_BA6_KE2}
      ply={7}
      title="3...Qxd7? 之后 Sjaak 的弃王妙手 4.Ke2!!"
      description="白方用王换掉黑方的 a6 象与后，自己保留后和双马直扑黑方王翼，印证有具体 forcing 收益时不必盲目保王。"
      arrows={[
        { from: 'e1', to: 'e2', role: 'path' },
        { from: 'a6', to: 'e2', role: 'threat' },
        { from: 'd1', to: 'h5', role: 'idea' },
      ]}
      marks={[
        { square: 'e2', role: 'target' },
        { square: 'h7', role: 'area' },
      ]}
      caption={`${moveText(BISHOP_BA6_KE2, 4, 7)}：用王换掉黑方 a6 象与后，保留后与双马直扑王翼。`}
    />
  );
}

function BishopQxd3() {
  return (
    <ChessDiagram
      id="cd-bishop-qxd3"
      game={BISHOP_BA6_MAIN}
      ply={9}
      title="4.d3! Bxd3 5.Qxd3 的一石二鸟"
      description="白方把 a6 黑象拉进 d3 吃掉的同时出后，沿 d3–h7 斜线瞄准无保护的 h7 兵；黑方只能以 5...Qb8 或 5...Rb8 反咬 b2。"
      arrows={[
        { from: 'd3', to: 'h7', role: 'path' },
        { from: 'd8', to: 'b8', role: 'threat' },
        { from: 'b8', to: 'b2', role: 'threat' },
      ]}
      marks={[
        { square: 'h7', role: 'target' },
        { square: 'b2', role: 'area' },
      ]}
      caption={`${moveText(BISHOP_BA6_MAIN, 6, 9)}：一举消除 a6 黑象并沿 d3–h7 斜线瞄准 h7，迫使黑方反击 b2 兑子。`}
    />
  );
}

function BishopDefenceMain() {
  return (
    <ChessGame
      id="cd-bishop-main"
      game={BISHOP_BA6_MAIN}
      title="Bishop Defence 1.e3 b5 2.Bxb5 Ba6 mainline 与 sideline"
      description="逐步查看白方如何以 3.Bxd7 Nxd7 4.d3 Bxd3 5.Qxd3 吃掉 a6 黑象、瞄准 h7 兵，并应对 5...Qb8、5...g6? 与 5...Rb8。"
      caption="Bishop Defence mainline：包含 5...Qb8 主线与 5...g6?、5...Rb8 分支，重子兑光后白方凭子力协调度取胜。"
    />
  );
}

function BishopEndgame() {
  return (
    <ChessDiagram
      id="cd-bishop-endgame"
      game={BISHOP_BA6_MAIN}
      ply={27}
      title="Bishop Defence 14.exf4 后的完全对称子力残局"
      description="双方各剩“王 + 车 + 双马 + 四兵”，但白方 c3 马与中心兵结构舒展，黑方双马缩在 f8/g8 且四个兵（a5、c7、f7、h6）彼此孤立。"
      arrows={[
        { from: 'c3', to: 'd5', role: 'path' },
        { from: 'c3', to: 'e4', role: 'option' },
      ]}
      marks={[
        { square: 'c3', role: 'area' },
        { square: 'f8', role: 'target' },
        { square: 'g8', role: 'target' },
      ]}
      caption={`${moveText(BISHOP_BA6_MAIN, 25, 27)}：双方 material 完全对称，白方凭活性 Nc3 与中心 space 压制黑方受困双马与四孤兵。`}
    />
  );
}

function KnightDefence() {
  return (
    <ChessGame
      id="cd-knight-nh6"
      game={OTHER_DEFENCES.nh6}
      ply={4}
      title="Knight Defence 1.e3 b5 2.Bxb5 Nh6 的分支应对"
      description="从 2...Nh6 3.Bxd7 出发，查看黑方 3...Nxd7! 4.e4! 主线，以及 3...Qxd7? 4.Qh5! 与 3...Bxd7 4.h3! 的应对方案。"
      caption={`${moveText(OTHER_DEFENCES.nh6, 0, 4)} 之后：面对最强 3...Nxd7!，白方走 4.e4!（或 4.c4）抢占 space；若 3...Qxd7? 则走 4.Qh5! 封锁黑方。`}
    />
  );
}

function KnightE4Diagram() {
  return (
    <ChessDiagram
      id="cd-knight-e4"
      game={OTHER_DEFENCES.nh6}
      ply={7}
      title="Knight Defence 3...Nxd7! 4.e4! 后的 space 优势"
      description="黑方在 e4 没有任何反击点，白方顺利打开 c1 象与 g1 马的通道，取得清晰的 space 与 development 优势。"
      arrows={[
        { from: 'c1', to: 'h6', role: 'path' },
        { from: 'g1', to: 'f3', role: 'option' },
        { from: 'e3', to: 'e4', role: 'idea' },
      ]}
      marks={[{ square: 'e4', role: 'area' }]}
      caption={`${moveText(OTHER_DEFENCES.nh6, 4, 7)}：黑方在 e4 无反击点，白方舒展打开 c1 象与王翼马通道。`}
    />
  );
}

function AncientDefence() {
  return (
    <ChessGame
      id="cd-ancient-c6"
      game={OTHER_DEFENCES.c6}
      ply={4}
      title="Ancient Defence 1.e3 b5 2.Bxb5 c6? 弃两兵破法"
      description="对比白方简明的 4.b4! Nxb4 5.a4! Nxc2 6.Qxc2，以及应当避开的 4.d4? Nxd4 5.Qxd4 Qa5。"
      caption={`${moveText(OTHER_DEFENCES.c6, 0, 4)} 之后：3.Bxc6 Nxc6 后用 4.b4! Nxb4 5.a4! Nxc2 6.Qxc2 消除黑方唯一活跃马并瞄准 h7。`}
    />
  );
}

function AncientQxc2Diagram() {
  return (
    <ChessDiagram
      id="cd-ancient-qxc2"
      game={OTHER_DEFENCES.c6}
      ply={11}
      title="Ancient Defence 6.Qxc2 后的局面：白后直指 h7，c8 象仍被关死"
      description="白方一举消除 c6 黑马并安全送掉后翼两兵，白后在 c2 瞄准 h7，黑方 c8 象完全找不到出路。"
      arrows={[
        { from: 'c2', to: 'h7', role: 'path' },
        { from: 'h7', to: 'h8', role: 'idea' },
      ]}
      marks={[
        { square: 'h7', role: 'target' },
        { square: 'c8', role: 'area' },
      ]}
      caption={`${moveText(OTHER_DEFENCES.c6, 6, 11)}：消除 c6 马后白后瞄准 h7 兵，黑方彻底困死在 bad bishop Bc8 上。`}
    />
  );
}

function OtherSidelines() {
  return (
    <ChessGame
      id="cd-other-sidelines"
      game={OTHER_SIDELINES}
      ply={3}
      title="2.Bxb5 之后的其他速败第 2 步"
      description="查看 2...Nf6?（因 e3 有保护而失效）、2...h5?、2...e5?、2...Nc6?、2...Na6? 与 2...d5?/d6? 暴露底线的直接惩罚。"
      caption={`${moveText(OTHER_SIDELINES, 0, 3)} 之后：2...Nf6? 无法像对付 1.e4 那样发动 intermediate move，2...d5?/d6? 直接被 3.Bxe8! 撕开底线。`}
    />
  );
}

export const POST_COMPONENTS = {
  ClassicE6Recaptures,
  ClassicQxd7Rd1,
  ClassicNxd7Sjaak,
  BeltmanBxa3,
  ClassicBeltman,
  ClassicMinear,
  MinearOrder,
  BishopRecaptures,
  BishopKe2Diagram,
  BishopQxd3,
  BishopDefenceMain,
  BishopEndgame,
  KnightDefence,
  KnightE4Diagram,
  AncientDefence,
  AncientQxc2Diagram,
  OtherSidelines,
};
