import {
  DEFAULT_TILT_DEG,
  projectTiltedQuad,
  RASTER_HEIGHT,
  RASTER_WIDTH,
  type ShadingMode,
} from './shading-rasterizer';

const ASSET_BASE = '/posts/cs/cs-revisit/computer-graphics/images';
const TILT_INPUT_ID = 'cg-shade-tilt-input';
const WIREFRAME_INPUT_ID = 'cg-shade-wire-input';

interface ModeSpec {
  readonly mode: ShadingMode;
  readonly title: string;
  readonly image: string;
  readonly alt: string;
  readonly formula: string;
  readonly note: string;
  readonly roleClass: string;
}

const MODES: readonly ModeSpec[] = [
  {
    mode: 'flat',
    title: 'Flat Shading',
    image: `${ASSET_BASE}/shading-flat.avif`,
    alt: 'Flat Shading 渲染的倾斜棋盘平面：两个三角形各自只采样单个顶点颜色，整块纹理退化为两块纯色三角',
    formula: String.raw`a(\phi_x, \phi_y) = a(v_1)`,
    note: '每个三角形仅采样单个顶点，纹理细节完全丢失。',
    roleClass: 'cg-shade-card-flat',
  },
  {
    mode: 'smooth',
    title: 'Smooth Shading',
    image: `${ASSET_BASE}/shading-smooth.avif`,
    alt: 'Smooth Shading 渲染的倾斜棋盘平面：在屏幕空间直接线性插值 UV，棋盘格与圆环在两个三角形的共享对角线处发生明显折弯畸变',
    formula: String.raw`a = \sum_i a(v_i)\,\phi_i`,
    note: '在 2D 屏幕空间线性插值 UV，沿三角对角线出现明显折弯。',
    roleClass: 'cg-shade-card-smooth',
  },
  {
    mode: 'perspective',
    title: 'Perspective Correct',
    image: `${ASSET_BASE}/shading-perspective.avif`,
    alt: 'Perspective Correct Shading 渲染的倾斜棋盘平面：先插值 1/z 与 a/z 再乘回真实深度 z，网格直线与圆环跨对角线连续且符合近大远小透视规律',
    formula: String.raw`a = z\sum_i \frac{a(v_i)}{z_i}\,\phi_i`,
    note: '插值 1/z 与 a/z 后再乘回真实深度，直线与透视比例严格保持。',
    roleClass: 'cg-shade-card-perspective',
  },
];

function fmt(n: number): string {
  return n.toFixed(1);
}

function ShadingComparisonFigure() {
  const quad = projectTiltedQuad(DEFAULT_TILT_DEG, RASTER_WIDTH, RASTER_HEIGHT);
  const [bl, br, tr, tl] = quad.corners;
  const outlinePoints = [bl, br, tr, tl].map((p) => `${fmt(p.x)},${fmt(p.y)}`).join(' ');
  const ratio = (quad.zFar / quad.zNear).toFixed(2);

  return (
    <figure
      className="cg-shade"
      data-shading-comparison=""
      data-post-enhancement="shading-comparison"
    >
      <div className="cg-shade-header">
        <strong>同一倾斜纹理平面的三种插值渲染对比</strong>
        <span className="cg-shade-meta" data-shade-meta="">
          {`倾斜角 ${DEFAULT_TILT_DEG}° · 深度比 z_far / z_near ≈ ${ratio}× · 2 个三角形`}
        </span>
      </div>

      <div className="cg-shade-grid">
        {MODES.map((item) => (
          <div className={`cg-shade-card ${item.roleClass}`} key={item.mode}>
            <div className="cg-shade-card-head">
              <span className="cg-shade-card-title">{item.title}</span>
            </div>

            <div className="cg-shade-viewport">
              <img
                src={item.image}
                alt={item.alt}
                width={RASTER_WIDTH}
                height={RASTER_HEIGHT}
                loading="lazy"
                decoding="async"
                className="cg-shade-img"
                data-shade-img={item.mode}
              />
              <canvas
                width={RASTER_WIDTH}
                height={RASTER_HEIGHT}
                className="cg-shade-canvas"
                data-shade-canvas={item.mode}
                aria-hidden="true"
                hidden
              />
              <svg
                className="cg-shade-wire"
                viewBox={`0 0 ${RASTER_WIDTH} ${RASTER_HEIGHT}`}
                aria-hidden="true"
                data-shade-wire={item.mode}
              >
                <polygon
                  className="cg-shade-wire-outline"
                  points={outlinePoints}
                  data-shade-outline=""
                />
                <line
                  className="cg-shade-wire-diag"
                  x1={fmt(bl.x)}
                  y1={fmt(bl.y)}
                  x2={fmt(tr.x)}
                  y2={fmt(tr.y)}
                  data-shade-diag=""
                />
              </svg>
            </div>

            <div className="cg-shade-formula">
              <span className="math-inline">{`\\(${item.formula}\\)`}</span>
            </div>
            <p className="cg-shade-note">{item.note}</p>
          </div>
        ))}
      </div>

      <div className="cg-shade-controls" data-agent-omit="" hidden>
        <div className="cg-shade-slider-row">
          <label htmlFor={TILT_INPUT_ID}>平面倾斜角</label>
          <input
            id={TILT_INPUT_ID}
            type="range"
            min="0"
            max="66"
            step="1"
            defaultValue={String(DEFAULT_TILT_DEG)}
            data-shade-tilt=""
          />
          <output htmlFor={TILT_INPUT_ID} data-shade-tilt-out="">
            {`${DEFAULT_TILT_DEG}° (${ratio}×)`}
          </output>
        </div>
        <label className="cg-shade-toggle" htmlFor={WIREFRAME_INPUT_ID}>
          <input id={WIREFRAME_INPUT_ID} type="checkbox" defaultChecked data-shade-wire-toggle="" />
          <span>显示三角剖分线</span>
        </label>
      </div>

      <figcaption>
        同一块由两个三角形拼成的棋盘纹理平面（带中心圆环）在软件 rasterizer 下的真实渲染结果：Flat
        Shading 退化为两块纯色三角；Smooth Shading 因忽略深度变化，
        棋盘直线与圆环沿共享对角线严重折弯；Perspective Correct Shading
        正确还原近大远小的透视关系。拖动倾斜角到 0°（正对相机、各顶点等深）时，后两者完全一致。
      </figcaption>
    </figure>
  );
}

export const POST_COMPONENTS = { ShadingComparisonFigure };
