import {
  AXES_ORIGIN,
  AXIS_X_END,
  AXIS_Y_END,
  AXIS_Z_END,
  fmt,
  type Point,
  poly,
  posStyle,
  STAGE_BOX,
  TRI2D_P,
  TRI2D_V1,
  TRI2D_V2,
  TRI2D_V3,
  TRI3D_V1,
  TRI3D_V2,
  TRI3D_V3,
  UV_GRID,
  UV_SAMPLE,
} from './perspective-correct-geometry';

function MathLabel({ at, tex, className = '' }: { at: Point; tex: string; className?: string }) {
  return (
    <span className={`cg-pcorr-tex ${className}`.trim()} style={posStyle(at)}>
      <span className="math-inline">{`\\(${tex}\\)`}</span>
    </span>
  );
}

function Stage3dPlane() {
  return (
    <div className="cg-pcorr-stage">
      <div className="cg-pcorr-stage-head">3D 平面</div>
      <div className="cg-pcorr-canvas">
        <svg
          viewBox={`0 0 ${STAGE_BOX.width} ${STAGE_BOX.height}`}
          role="img"
          aria-label="三维相机空间中的三角形平面 Ax + By + Cz = D"
        >
          <title>三维三角形平面</title>
          <desc>三角形位于三维平面 Ax + By + Cz = D 上，顶点深度分别为 z1, z2, z3。</desc>

          <line
            className="cg-pcorr-axis"
            x1={fmt(AXES_ORIGIN.x)}
            y1={fmt(AXES_ORIGIN.y)}
            x2={fmt(AXIS_X_END.x)}
            y2={fmt(AXIS_X_END.y)}
          />
          <line
            className="cg-pcorr-axis"
            x1={fmt(AXES_ORIGIN.x)}
            y1={fmt(AXES_ORIGIN.y)}
            x2={fmt(AXIS_Y_END.x)}
            y2={fmt(AXIS_Y_END.y)}
          />
          <line
            className="cg-pcorr-axis cg-pcorr-axis-z"
            x1={fmt(AXES_ORIGIN.x)}
            y1={fmt(AXES_ORIGIN.y)}
            x2={fmt(AXIS_Z_END.x)}
            y2={fmt(AXIS_Z_END.y)}
          />

          <polygon
            className="cg-pcorr-tri cg-pcorr-tri-3d"
            points={poly(TRI3D_V1, TRI3D_V2, TRI3D_V3)}
          />
          <circle className="cg-pcorr-dot-v" cx={fmt(TRI3D_V1.x)} cy={fmt(TRI3D_V1.y)} r="3.4" />
          <circle className="cg-pcorr-dot-v" cx={fmt(TRI3D_V2.x)} cy={fmt(TRI3D_V2.y)} r="3.4" />
          <circle className="cg-pcorr-dot-v" cx={fmt(TRI3D_V3.x)} cy={fmt(TRI3D_V3.y)} r="3.4" />
        </svg>

        <MathLabel at={{ x: TRI3D_V1.x - 10, y: TRI3D_V1.y + 12 }} tex="v_1" />
        <MathLabel at={{ x: TRI3D_V2.x + 12, y: TRI3D_V2.y + 12 }} tex="v_2" />
        <MathLabel at={{ x: TRI3D_V3.x + 14, y: TRI3D_V3.y - 4 }} tex="v_3" />
        <MathLabel
          at={{ x: AXIS_Z_END.x + 9, y: AXIS_Z_END.y - 5 }}
          tex="z"
          className="cg-pcorr-muted"
        />
      </div>
      <div className="cg-pcorr-eq">
        <span className="math-inline">{String.raw`\(Ax + By + Cz = D\)`}</span>
      </div>
    </div>
  );
}

function StageScreenLinear() {
  return (
    <div className="cg-pcorr-stage cg-pcorr-stage-mid">
      <div className="cg-pcorr-stage-head">屏幕空间线性插值</div>
      <div className="cg-pcorr-canvas">
        <svg
          viewBox={`0 0 ${STAGE_BOX.width} ${STAGE_BOX.height}`}
          role="img"
          aria-label="投影到二维屏幕的三角形：除以深度 z 后 1/z 与 a/z 呈线性，可直接用屏幕重心坐标插值"
        >
          <title>屏幕空间重心插值</title>
          <desc>
            方程两侧同除 z 得 Ax_s + By_s + C = D/z，因此 1/z 与 a/z 在屏幕空间呈线性，可直接用重心
            phi_x, phi_y 插值。
          </desc>

          <polygon
            className="cg-pcorr-tri cg-pcorr-tri-2d"
            points={poly(TRI2D_V1, TRI2D_V2, TRI2D_V3)}
          />
          <line
            className="cg-pcorr-ray"
            x1={fmt(TRI2D_P.x)}
            y1={fmt(TRI2D_P.y)}
            x2={fmt(TRI2D_V1.x)}
            y2={fmt(TRI2D_V1.y)}
          />
          <line
            className="cg-pcorr-ray"
            x1={fmt(TRI2D_P.x)}
            y1={fmt(TRI2D_P.y)}
            x2={fmt(TRI2D_V2.x)}
            y2={fmt(TRI2D_V2.y)}
          />
          <line
            className="cg-pcorr-ray"
            x1={fmt(TRI2D_P.x)}
            y1={fmt(TRI2D_P.y)}
            x2={fmt(TRI2D_V3.x)}
            y2={fmt(TRI2D_V3.y)}
          />
          <circle className="cg-pcorr-dot-v" cx={fmt(TRI2D_V1.x)} cy={fmt(TRI2D_V1.y)} r="3.2" />
          <circle className="cg-pcorr-dot-v" cx={fmt(TRI2D_V2.x)} cy={fmt(TRI2D_V2.y)} r="3.2" />
          <circle className="cg-pcorr-dot-v" cx={fmt(TRI2D_V3.x)} cy={fmt(TRI2D_V3.y)} r="3.2" />
          <circle className="cg-pcorr-dot-p" cx={fmt(TRI2D_P.x)} cy={fmt(TRI2D_P.y)} r="4" />
        </svg>

        <MathLabel
          at={{ x: TRI2D_V1.x - 4, y: TRI2D_V1.y + 13 }}
          tex={String.raw`\frac{1}{z_1},\frac{a_1}{z_1}`}
          className="cg-pcorr-sm"
        />
        <MathLabel
          at={{ x: TRI2D_V2.x + 2, y: TRI2D_V2.y + 13 }}
          tex={String.raw`\frac{1}{z_2},\frac{a_2}{z_2}`}
          className="cg-pcorr-sm"
        />
        <MathLabel
          at={{ x: TRI2D_V3.x + 34, y: TRI2D_V3.y + 2 }}
          tex={String.raw`\frac{1}{z_3},\frac{a_3}{z_3}`}
          className="cg-pcorr-sm"
        />
        <MathLabel
          at={{ x: TRI2D_P.x + 22, y: TRI2D_P.y - 8 }}
          tex="(\phi_x,\phi_y)"
          className="cg-pcorr-accent"
        />
      </div>
      <div className="cg-pcorr-eq cg-pcorr-eq-stack">
        <span className="math-inline">{String.raw`\(Ax_s + By_s + C = \frac{D}{z}\)`}</span>
        <span className="math-inline">
          {String.raw`\(\frac{1}{z} = \sum\frac{\phi_i}{z_i},\quad \frac{a}{z} = \sum\frac{a_i}{z_i}\phi_i\)`}
        </span>
      </div>
    </div>
  );
}

function StageTextureUv() {
  const cellSize = UV_GRID.size / UV_GRID.cells;
  const cells: { x: number; y: number; dark: boolean; key: string }[] = [];
  for (let iy = 0; iy < UV_GRID.cells; iy++) {
    for (let ix = 0; ix < UV_GRID.cells; ix++) {
      cells.push({
        x: UV_GRID.x + ix * cellSize,
        y: UV_GRID.y + iy * cellSize,
        dark: (ix + iy) % 2 === 0,
        key: `${ix}-${iy}`,
      });
    }
  }

  return (
    <div className="cg-pcorr-stage cg-pcorr-stage-out">
      <div className="cg-pcorr-stage-head">Texture 坐标</div>
      <div className="cg-pcorr-canvas">
        <svg
          viewBox={`0 0 ${STAGE_BOX.width} ${STAGE_BOX.height}`}
          role="img"
          aria-label="乘回真实深度 z 后得到精确的二维 texture 采样点 a(phi_x, phi_y)"
        >
          <title>还原真实 texture 坐标</title>
          <desc>将插值得到的 a/z 乘回真实深度 z，落在正确的 UV 纹素位置。</desc>

          {cells.map((cell) => (
            <rect
              key={cell.key}
              className={cell.dark ? 'cg-pcorr-uv-dark' : 'cg-pcorr-uv-light'}
              x={fmt(cell.x)}
              y={fmt(cell.y)}
              width={fmt(cellSize)}
              height={fmt(cellSize)}
            />
          ))}
          <rect
            className="cg-pcorr-uv-frame"
            x={fmt(UV_GRID.x)}
            y={fmt(UV_GRID.y)}
            width={fmt(UV_GRID.size)}
            height={fmt(UV_GRID.size)}
          />
          <circle className="cg-pcorr-uv-ring" cx={fmt(UV_SAMPLE.x)} cy={fmt(UV_SAMPLE.y)} r="7" />
          <circle
            className="cg-pcorr-dot-out"
            cx={fmt(UV_SAMPLE.x)}
            cy={fmt(UV_SAMPLE.y)}
            r="3.6"
          />
        </svg>

        <MathLabel
          at={{ x: UV_GRID.x + UV_GRID.size + 10, y: UV_GRID.y + UV_GRID.size }}
          tex="u"
          className="cg-pcorr-muted"
        />
        <MathLabel
          at={{ x: UV_GRID.x - 10, y: UV_GRID.y + 4 }}
          tex="v"
          className="cg-pcorr-muted"
        />
        <MathLabel
          at={{ x: UV_SAMPLE.x, y: UV_SAMPLE.y - 16 }}
          tex="a(\phi_x,\phi_y)"
          className="cg-pcorr-out"
        />
      </div>
      <div className="cg-pcorr-eq">
        <span className="math-inline">{String.raw`\(a(\phi_x,\phi_y) = z \cdot \frac{a}{z}\)`}</span>
      </div>
    </div>
  );
}

function StepConnector({ tex }: { tex: string }) {
  return (
    <div className="cg-pcorr-conn" aria-hidden="true">
      <span className="cg-pcorr-conn-label">
        <span className="math-inline">{`\\(${tex}\\)`}</span>
      </span>
      <svg className="cg-pcorr-conn-svg" viewBox="0 0 36 16" aria-hidden="true">
        <line className="cg-pcorr-conn-line" x1="2" y1="8" x2="28" y2="8" />
        <polyline className="cg-pcorr-conn-head" points="23,3 30,8 23,13" />
      </svg>
    </div>
  );
}

function PerspectiveCorrectFigure() {
  return (
    <figure className="cg-pcorr">
      <div className="cg-pcorr-strip">
        <Stage3dPlane />
        <StepConnector tex="\div z" />
        <StageScreenLinear />
        <StepConnector tex="\times z" />
        <StageTextureUv />
      </div>
      <figcaption>
        Perspective Correct Shading 的推导过程：将 3D 平面方程{' '}
        <span className="math-inline">\(Ax+By+Cz=D\)</span> 两侧同除深度{' '}
        <span className="math-inline">\(z\)</span>，由{' '}
        <span className="math-inline">\(x_s=x/z,\ y_s=y/z\)</span> 立刻得到{' '}
        <span className="math-inline">\(1/z\)</span> 与 <span className="math-inline">\(a/z\)</span>{' '}
        在屏幕空间呈线性；用屏幕重心 <span className="math-inline">\((\phi_x,\phi_y)\)</span>{' '}
        分别插值后，再乘回真实深度 <span className="math-inline">\(z\)</span> 即得精确的 texture
        坐标。
      </figcaption>
    </figure>
  );
}

export const POST_COMPONENTS = { PerspectiveCorrectFigure };
