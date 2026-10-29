import {
  ChessDiagram,
  ChessGame,
  moveArrows,
  moveText,
  type Square,
} from '../../../../../shared/chess';
import { E4_B5 } from './games';
import { TACTICS } from './tactics';

// Diagrams name positions by the number of half-moves played in E4_B5, so
// they cannot drift from the replayed line.
const game = E4_B5;

function MainLine() {
  return (
    <ChessGame
      id="anti-main"
      game={game}
      title="1.e4 b5 主线"
      description="逐步查看黑方如何引导清扫，并以 c7 兵无棋可走获胜。"
      caption="1.e4 b5 主线：从初始局面逐步查看双方走法。"
      result="黑方无棋可走，获胜"
    />
  );
}

function E4Threat() {
  return (
    <ChessDiagram
      id="anti-e4-threat"
      game={game}
      ply={2}
      title="1.e4 b5 之后的局面"
      description="1.e4 打开了 f1 象的斜线，黑方把 b 兵放在这条斜线上的 b5。白方唯一合法着法是 2.Bxb5。"
      arrows={moveArrows(game, [3])}
      marks={[{ square: 'b5', role: 'target' }]}
      caption={`${moveText(game, 0, 2)} 之后：b5 兵在 f1 象的斜线上，2.Bxb5 是白方唯一合法着法。`}
    />
  );
}

function BishopRun() {
  return (
    <ChessDiagram
      id="anti-bishop-run"
      game={game}
      ply={9}
      title="白方 f1 象被迫连续吃子的路线"
      description="白象依次吃 b5、d7、e8、f7。每一步之后，象的新位置都正对下一个黑子。"
      arrows={moveArrows(game, [3, 5, 7, 9])}
      caption={`${moveText(game, 2, 9)}：白象每吃一次，就停在下一个必须吃的位置上。`}
    />
  );
}

function ForcedRecapture() {
  const captures: Square[] = ['b1', 'c1'];
  return (
    <ChessDiagram
      id="anti-recapture"
      game={game}
      ply={12}
      title="6...Qxd2 之后白方的三种吃法"
      description="黑后在 d2，白方必须用王、b1 马或 c1 象吃掉它。"
      arrows={[
        ...moveArrows(game, [13], 'option'),
        ...captures.map((from) => ({ from, to: 'd2' as const, role: 'option' as const })),
      ]}
      marks={[{ square: 'd2', role: 'target' }]}
      caption={`${moveText(game, 9, 12)} 之后：白方只能在 Kxd2、Nxd2、Bxd2 中选择，三种都输。`}
    />
  );
}

function BishopReturn() {
  return (
    <ChessDiagram
      id="anti-bishop-return"
      game={game}
      ply={21}
      title="白象第二段被迫吃子路线"
      description="黑方先后把 g8 车、h7 兵、g6 兵、e4 兵送到白象面前，白象从 f7 走到 e4，之后还要吃 a8 车。"
      arrows={moveArrows(game, [15, 17, 19, 21])}
      marks={[{ square: 'a8', role: 'target' }]}
      caption={`${moveText(game, 12, 21)}：黑方用车和兵把白象一路引到 e4，下一步白象只能吃 a8 车。`}
    />
  );
}

function FinalStalemate() {
  const last = game.plies.length;
  return (
    <ChessDiagram
      id="anti-final"
      game={game}
      ply={last}
      title="终局：黑方最后一个兵被堵住"
      description="白方 Rxc5 吃掉黑方最后的象。黑方只剩 c7 兵，c6 被白象挡住，b6 和 d6 没有可吃的子，黑方没有合法着法，因此获胜。"
      arrows={moveArrows(game, [last])}
      marks={[
        { square: 'c7', role: 'target' },
        { square: 'c6', role: 'area' },
      ]}
      caption={`${moveText(game, 21, last)}：黑方只剩 c7 兵，前方 c6 被白象堵住，黑方无子可动而获胜。`}
    />
  );
}

function PawnGap() {
  const gap: Square[] = ['a3', 'a4', 'a5', 'a6'];
  return (
    <ChessDiagram
      id="anti-pawn-gap"
      fen="8/p7/8/8/8/8/P7/8 w - - 0 1"
      title="同一直线上相向的两个兵"
      description="白兵 a2，黑兵 a7，中间有 a3 到 a6 四个空格。无论轮到哪一方走，走棋方都输。"
      marks={gap.map((square) => ({ square, role: 'area' }))}
      caption="a2 对 a7，中间四个空格。双方都不能吃子，谁先把空格走完，谁就让对方无棋可走。"
    />
  );
}

function CaptureOrder() {
  return (
    <ChessDiagram
      id="anti-capture-order"
      title="吃子次序：白先，两种吃法导向不同终点"
      description="白方：c1 车、a3 象；黑方：a1 车、c4 马、a4 兵。白车只能吃 c4 马或 a1 车。"
      fen={TACTICS.order.fen}
      arrows={[
        { from: 'c1', to: 'c4', role: 'path' },
        { from: 'c1', to: 'a1', role: 'option' },
      ]}
      caption="白先。先吃 c4 马，可以让黑车清扫；先吃 a1 车，最终反而把黑兵堵住，让黑方获胜。"
    />
  );
}

function RelayTactic() {
  return (
    <ChessDiagram
      id="anti-relay"
      title="接力：白先，利用黑马的吃子义务调动车"
      description="白方：e5 车、h1 车、c2 王；黑方：a8 车、f2 马。白车经 b5 到 b8，让黑车接替黑马完成清扫。"
      fen={TACTICS.relay.fen}
      arrows={[
        { from: 'e5', to: 'b5', role: 'path', label: '1' },
        { from: 'b5', to: 'b8', role: 'path', label: '2' },
        { from: 'f2', to: 'h1', role: 'option' },
      ]}
      caption="白先。1.Rb5 Nxh1 2.Rb8 Rxb8 3.Kb3 Rxb3：黑方每一步都只有一种合法着法，白方送光获胜。"
    />
  );
}

function IntermediateTactic() {
  return (
    <ChessDiagram
      id="anti-intermediate"
      title="中间着：白先，在 h7 准备替代吃法"
      description="白方：b8 车、f4 王、e3 兵、f1 马；黑方：c4 马、h7 兵。e3 受白王和白马保护，1.Rh8 预先准备 Rxh7，避免在黑方 Nxe3 后立即回吃。"
      fen={TACTICS.intermediate.fen}
      arrows={[
        { from: 'b8', to: 'h8', role: 'path' },
        { from: 'c4', to: 'e3', role: 'option' },
      ]}
      marks={[{ square: 'h7', role: 'target' }]}
      caption="白先。先走 Rh8 准备另一处吃子；Nxe3 后选择 Rxh7，保留黑马继续清扫。"
    />
  );
}

export const POST_COMPONENTS = {
  CaptureOrder,
  RelayTactic,
  IntermediateTactic,
  MainLine,
  E4Threat,
  BishopRun,
  ForcedRecapture,
  BishopReturn,
  FinalStalemate,
  PawnGap,
};
