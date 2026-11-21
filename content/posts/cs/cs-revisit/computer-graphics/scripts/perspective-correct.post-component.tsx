import {
  AXIS_Z_END,
  CAM_O,
  fmt,
  IMG_BOT,
  IMG_TOP,
  LABELS,
  M_3D,
  MS_LEADER_END,
  P_HIT,
  type Point,
  PROJ_HIT,
  PROJ_MID,
  PROJ_V1,
  PROJ_V2,
  posStyle,
  SIDE_VIEW,
  T_HIT,
  V1,
  V2,
  Z_HIT,
  Z1,
  Z2,
} from './perspective-correct-geometry';

function MathLabel({
  at,
  tex,
  className = '',
  align = 'center',
}: {
  at: Point;
  tex: string;
  className?: string;
  align?: 'center' | 'start' | 'end';
}) {
  return (
    <span className={`cg-pcorr-tex cg-pcorr-tex-${align} ${className}`.trim()} style={posStyle(at)}>
      <span className="math-inline">{`\\(${tex}\\)`}</span>
    </span>
  );
}

function GeometryPanel() {
  return (
    <div className="cg-pcorr-panel">
      <div className="cg-pcorr-panel-title">为什么不能直接按屏幕比例插值</div>
      <div className="cg-pcorr-canvas">
        <svg
          viewBox={`0 0 ${SIDE_VIEW.width} ${SIDE_VIEW.height}`}
          role="img"
          aria-label="针孔相机侧视图：屏幕成像面上的中点 phi = 0.5 对应的视线交在三维线段 v1 v2 的 t = 0.25 处，靠近近端顶点 v1，而非三维中点 t = 0.5"
        >
          <title>透视投影下的屏幕中点与三维交点错位</title>
          <desc>
            相机光心 O 位于左侧，成像平面位于 z = 1。三维线段两端深度分别为 z1 = 1.5 与 z2 =
            4.5。屏幕中点 m_s（phi = 0.5）发出的视线击中线段于 t = 0.25、z = 2.25 处，远靠近
            v1；三维中点 M_3D（t = 0.5）则投影在成像面更靠近 v2 投影的位置。
          </desc>

          {/* Depth axis z */}
          <line
            className="cg-pcorr-axis"
            x1={fmt(CAM_O.x)}
            y1={fmt(CAM_O.y)}
            x2={fmt(AXIS_Z_END.x)}
            y2={fmt(AXIS_Z_END.y)}
          />

          {/* Image plane z = 1 */}
          <line
            className="cg-pcorr-plane"
            x1={fmt(IMG_TOP.x)}
            y1={fmt(IMG_TOP.y)}
            x2={fmt(IMG_BOT.x)}
            y2={fmt(IMG_BOT.y)}
          />
          <line
            className="cg-pcorr-projected-seg"
            x1={fmt(PROJ_V1.x)}
            y1={fmt(PROJ_V1.y)}
            x2={fmt(PROJ_V2.x)}
            y2={fmt(PROJ_V2.y)}
          />

          {/* Outer camera sight rays to v1 and v2 */}
          <line
            className="cg-pcorr-ray"
            x1={fmt(CAM_O.x)}
            y1={fmt(CAM_O.y)}
            x2={fmt(V1.x)}
            y2={fmt(V1.y)}
          />
          <line
            className="cg-pcorr-ray"
            x1={fmt(CAM_O.x)}
            y1={fmt(CAM_O.y)}
            x2={fmt(V2.x)}
            y2={fmt(V2.y)}
          />

          {/* Faint ray through true 3D midpoint M_3D */}
          <line
            className="cg-pcorr-ray-mid"
            x1={fmt(CAM_O.x)}
            y1={fmt(CAM_O.y)}
            x2={fmt(M_3D.x)}
            y2={fmt(M_3D.y)}
          />

          {/* Highlighted ray through screen midpoint m_s -> true 3D hit P */}
          <line
            className="cg-pcorr-ray-hit"
            x1={fmt(CAM_O.x)}
            y1={fmt(CAM_O.y)}
            x2={fmt(P_HIT.x)}
            y2={fmt(P_HIT.y)}
          />

          {/* 3D tilted segment v1 -> v2 */}
          <line
            className="cg-pcorr-seg3d"
            x1={fmt(V1.x)}
            y1={fmt(V1.y)}
            x2={fmt(V2.x)}
            y2={fmt(V2.y)}
          />

          {/* Leader line from m_s to clear upper-left label */}
          <line
            className="cg-pcorr-leader"
            x1={fmt(PROJ_HIT.x)}
            y1={fmt(PROJ_HIT.y)}
            x2={fmt(MS_LEADER_END.x)}
            y2={fmt(MS_LEADER_END.y)}
          />

          {/* Key points */}
          <circle className="cg-pcorr-dot-origin" cx={fmt(CAM_O.x)} cy={fmt(CAM_O.y)} r="3.6" />
          <circle className="cg-pcorr-dot-proj" cx={fmt(PROJ_V1.x)} cy={fmt(PROJ_V1.y)} r="2.6" />
          <circle className="cg-pcorr-dot-proj" cx={fmt(PROJ_V2.x)} cy={fmt(PROJ_V2.y)} r="2.6" />
          <circle className="cg-pcorr-dot-mid" cx={fmt(PROJ_MID.x)} cy={fmt(PROJ_MID.y)} r="2.8" />
          <circle className="cg-pcorr-dot-hit" cx={fmt(PROJ_HIT.x)} cy={fmt(PROJ_HIT.y)} r="3.6" />

          <circle className="cg-pcorr-dot-vertex" cx={fmt(V1.x)} cy={fmt(V1.y)} r="4" />
          <circle className="cg-pcorr-dot-vertex" cx={fmt(V2.x)} cy={fmt(V2.y)} r="4" />
          <circle className="cg-pcorr-dot-mid" cx={fmt(M_3D.x)} cy={fmt(M_3D.y)} r="3.6" />
          <circle className="cg-pcorr-dot-hit" cx={fmt(P_HIT.x)} cy={fmt(P_HIT.y)} r="4.2" />
        </svg>

        <MathLabel at={LABELS.origin} tex="O" className="cg-pcorr-label-muted" />
        <MathLabel at={LABELS.imagePlane} tex="z = 1" className="cg-pcorr-label-muted" />
        <MathLabel
          at={LABELS.ms}
          tex={String.raw`m_s\ (\phi = 0.5)`}
          className="cg-pcorr-label-hit"
        />
        <MathLabel
          at={LABELS.v1}
          tex={String.raw`v_1\ (z_1=${Z1})`}
          className="cg-pcorr-label-vertex"
          align="start"
        />
        <MathLabel
          at={LABELS.v2}
          tex={String.raw`v_2\ (z_2=${Z2})`}
          className="cg-pcorr-label-vertex"
        />
        <MathLabel
          at={LABELS.pHit}
          tex={String.raw`P\ (t=${T_HIT},\ z=${Z_HIT})`}
          className="cg-pcorr-label-hit"
          align="start"
        />
        <MathLabel
          at={LABELS.m3d}
          tex={String.raw`M_{3\mathrm{D}}\ (t=0.5)`}
          className="cg-pcorr-label-mid"
          align="start"
        />
        <MathLabel at={LABELS.axisZ} tex="z" className="cg-pcorr-label-muted" />
      </div>

      <p className="cg-pcorr-foot">
        屏幕中点 <span className="math-inline">{String.raw`\(\phi = 0.5\)`}</span> 的视线落在 3D
        线段 <span className="math-inline">{String.raw`\(t = 0.25\)`}</span> 处（近端权重更大：
        <span className="math-inline">{String.raw`\(w_i \propto \phi_i / z_i\)`}</span>
        ），因此线性插值 <span className="math-inline">{String.raw`\(1/z\)`}</span> 与{' '}
        <span className="math-inline">{String.raw`\(a/z\)`}</span> 才能还原真实位置。
      </p>
    </div>
  );
}

function PipelinePanel() {
  return (
    <div className="cg-pcorr-panel">
      <div className="cg-pcorr-panel-title">三步计算：从屏幕重心到真实 texture</div>

      <div className="cg-pcorr-flow">
        {/* Step 1 */}
        <div className="cg-pcorr-step">
          <div className="cg-pcorr-step-head">
            <span className="cg-pcorr-badge">1</span>
            <span>顶点处预除深度（转成屏幕空间线性量）</span>
          </div>
          <div className="cg-pcorr-step-body cg-pcorr-split">
            <div className="cg-pcorr-pill cg-pcorr-pill-rose">
              <span className="math-inline">{String.raw`\(\frac{1}{z_1},\ \frac{1}{z_2},\ \frac{1}{z_3}\)`}</span>
            </div>
            <div className="cg-pcorr-pill cg-pcorr-pill-blue">
              <span className="math-inline">{String.raw`\(\frac{a(v_1)}{z_1},\ \frac{a(v_2)}{z_2},\ \frac{a(v_3)}{z_3}\)`}</span>
            </div>
          </div>
        </div>

        <div className="cg-pcorr-arrow" aria-hidden="true">
          ↓ 用屏幕重心{' '}
          <span className="math-inline">{String.raw`\((\phi_x, \phi_y, \phi_z)\)`}</span>{' '}
          分别线性插值
        </div>

        {/* Step 2 */}
        <div className="cg-pcorr-step">
          <div className="cg-pcorr-step-head">
            <span className="cg-pcorr-badge">2</span>
            <span>屏幕空间并行重心插值</span>
          </div>
          <div className="cg-pcorr-step-body cg-pcorr-branches">
            <div className="cg-pcorr-branch cg-pcorr-branch-rose">
              <span className="cg-pcorr-branch-tag">恢复真实深度</span>
              <span className="math-inline">
                {String.raw`\(\frac{1}{z} = \sum_i \frac{1}{z_i}\phi_i \;\Rightarrow\; z(\phi_x,\phi_y)\)`}
              </span>
            </div>
            <div className="cg-pcorr-branch cg-pcorr-branch-blue">
              <span className="cg-pcorr-branch-tag">插值深度加权属性</span>
              <span className="math-inline">
                {String.raw`\(\left(\frac{a}{z}\right)_{\!\text{interp}} = \sum_i \frac{a(v_i)}{z_i}\phi_i\)`}
              </span>
            </div>
          </div>
        </div>

        <div className="cg-pcorr-arrow" aria-hidden="true">
          ↓ 两路相乘，消去 <span className="math-inline">{String.raw`\(1/z\)`}</span> 因子
        </div>

        {/* Step 3 */}
        <div className="cg-pcorr-step cg-pcorr-step-result">
          <div className="cg-pcorr-step-head">
            <span className="cg-pcorr-badge cg-pcorr-badge-sage">3</span>
            <span>乘回真实深度，得到精确 texture 坐标</span>
          </div>
          <div className="cg-pcorr-step-body cg-pcorr-result-eq">
            <span className="math-inline">
              {String.raw`\(a(\phi_x,\phi_y) = z(\phi_x,\phi_y)\cdot\left(\frac{a}{z}\right)_{\!\text{interp}}\)`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PerspectiveCorrectFigure() {
  return (
    <figure className="cg-pcorr">
      <div className="cg-pcorr-grid">
        <GeometryPanel />
        <PipelinePanel />
      </div>
      <figcaption>
        左图展示透视投影导致的屏幕空间非线性：以 <span className="math-inline">\(z_1 = 1.5\)</span>
        、<span className="math-inline">\(z_2 = 4.5\)</span> 为例，屏幕中点{' '}
        <span className="math-inline">\(\phi = 0.5\)</span> 实际对应 3D 线段{' '}
        <span className="math-inline">\(t = 0.25\)</span>、深度{' '}
        <span className="math-inline">\(z = 2.25\)</span>。右图总结 Perspective Correct Shading
        的三步计算：先在顶点处除以深度，再用屏幕空间重心坐标分别插值{' '}
        <span className="math-inline">\(1/z\)</span> 与 <span className="math-inline">\(a/z\)</span>
        ，最后乘回 <span className="math-inline">\(z(\phi_x,\phi_y)\)</span> 还原真实的 texture
        坐标。
      </figcaption>
    </figure>
  );
}

export const POST_COMPONENTS = { PerspectiveCorrectFigure };
