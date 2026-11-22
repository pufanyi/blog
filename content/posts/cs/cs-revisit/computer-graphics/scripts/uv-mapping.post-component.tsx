import type { CSSProperties } from 'react';
import { CANVAS, fmt, type Point2D, posStyle, UV_RECT, UV_SCENE } from './uv-mapping-geometry';

function MathLabel({ at, tex, className = '' }: { at: Point2D; tex: string; className?: string }) {
  return (
    <span className={`cg-uv-tex ${className}`.trim()} style={posStyle(at)}>
      <span className="math-inline">{`\\(${tex}\\)`}</span>
    </span>
  );
}

function SurfacePanel() {
  return (
    <div className="cg-uv-panel">
      <div className="cg-uv-title">3D Surface（网格表面）</div>
      <div className="cg-uv-canvas">
        <svg
          viewBox={`0 0 ${CANVAS.width} ${CANVAS.height}`}
          role="img"
          aria-label="三维环面三角网格：每个三角面片按其 (u, v) 纹理坐标着色，虚线标出沿 u=0 与 v=0 剖开的接缝，并高亮展示一个样本三角形 v1 v2 v3"
        >
          <title>3D Surface 上的 UV 坐标分布</title>
          <desc>
            三维环面由 20x10 个网格单元剖分为 400 个三角形。颜色由 (u, v)
            坐标双线性混合得到，并叠加柔和的漫反射光照以呈现立体形态；虚线标出展开时沿 u=0 与 v=0
            切开的接缝，正面右上方高亮一个样本三角形 v1、v2、v3。
          </desc>

          <g className="cg-uv-mesh">
            {UV_SCENE.surfaceTriangles.map((tri) => (
              <polygon
                key={tri.id}
                className="cg-uv-tri cg-uv-tri-3d"
                points={tri.points}
                style={
                  {
                    '--u': tri.uPct,
                    '--v': tri.vPct,
                    '--lit': tri.litPct,
                  } as CSSProperties
                }
              />
            ))}
          </g>

          <g className="cg-uv-seams">
            {UV_SCENE.seams.map((seg) => (
              <line
                key={seg.id}
                className={`cg-uv-seam cg-uv-seam-${seg.kind}`}
                x1={seg.x1}
                y1={seg.y1}
                x2={seg.x2}
                y2={seg.y2}
              />
            ))}
          </g>

          <polygon className="cg-uv-highlight-poly" points={UV_SCENE.highlightSurfacePoints} />

          {UV_SCENE.highlightVertices.map((vert) => (
            <circle
              key={vert.id}
              className="cg-uv-highlight-dot"
              cx={fmt(vert.surfacePt.x)}
              cy={fmt(vert.surfacePt.y)}
              r="3.2"
            />
          ))}
        </svg>

        {UV_SCENE.highlightVertices.map((vert) => (
          <MathLabel
            key={vert.id}
            at={vert.surfaceLabelPt}
            tex={vert.tex}
            className="cg-uv-vertex-label"
          />
        ))}
      </div>

      <div className="cg-uv-note">
        网格表面按各点对应的 <span className="math-inline">{String.raw`\((u, v)\)`}</span>{' '}
        着色；外圈与内圈三角形在 3D 空间尺寸不同，但共享同一套 UV 参数化。
      </div>
    </div>
  );
}

function TextureSpacePanel() {
  const x0 = UV_RECT.x;
  const y0 = UV_RECT.y;
  const x1 = UV_RECT.x + UV_RECT.size;
  const y1 = UV_RECT.y + UV_RECT.size;

  const uAxisEndX = x1 + 26;
  const vAxisEndY = y0 - 18;

  return (
    <div className="cg-uv-panel">
      <div className="cg-uv-title">2D Texture Space（UV 平面）</div>
      <div className="cg-uv-canvas">
        <svg
          viewBox={`0 0 ${CANVAS.width} ${CANVAS.height}`}
          role="img"
          aria-label="展开到二维 [0, 1] x [0, 1] 纹理空间的 UV 网格，横轴为 u，纵轴为 v，对应高亮同一三角形 v1 v2 v3"
        >
          <title>2D Texture Space 中的展开网格</title>
          <desc>
            三维环面沿 u=0 与 v=0 接缝切开并展开到二维单位正方形 [0, 1] x [0, 1]。横轴 u 从 0 到
            1，纵轴 v 从 0 到 1，网格上的颜色与左侧三维表面一一对应，样本三角形 v1、v2、v3
            对应其各自的二维顶点坐标。
          </desc>

          <defs>
            <marker
              id="cg-uv-arrow"
              viewBox="0 0 8 8"
              refX="6.5"
              refY="4"
              markerWidth="6.5"
              markerHeight="6.5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 7 4 L 0 7 z" className="cg-uv-arrow-head" />
            </marker>
          </defs>

          <g className="cg-uv-mesh">
            {UV_SCENE.uvTriangles.map((tri) => (
              <polygon
                key={tri.id}
                className="cg-uv-tri cg-uv-tri-2d"
                points={tri.points}
                style={
                  {
                    '--u': tri.uPct,
                    '--v': tri.vPct,
                  } as CSSProperties
                }
              />
            ))}
          </g>

          {/* Seam borders matching the 3D cuts: u = 0 / 1 (vertical) and v = 0 / 1 (horizontal) */}
          <line className="cg-uv-seam cg-uv-seam-u" x1={x0} y1={y0} x2={x0} y2={y1} />
          <line className="cg-uv-seam cg-uv-seam-u" x1={x1} y1={y0} x2={x1} y2={y1} />
          <line className="cg-uv-seam cg-uv-seam-v" x1={x0} y1={y1} x2={x1} y2={y1} />
          <line className="cg-uv-seam cg-uv-seam-v" x1={x0} y1={y0} x2={x1} y2={y0} />

          {/* u and v axes */}
          <line
            className="cg-uv-axis"
            x1={x0 - 10}
            y1={y1}
            x2={uAxisEndX}
            y2={y1}
            markerEnd="url(#cg-uv-arrow)"
          />
          <line
            className="cg-uv-axis"
            x1={x0}
            y1={y1 + 10}
            x2={x0}
            y2={vAxisEndY}
            markerEnd="url(#cg-uv-arrow)"
          />

          {/* Axis ticks at 1 */}
          <line className="cg-uv-tick" x1={x1} y1={y1 - 3} x2={x1} y2={y1 + 4} />
          <line className="cg-uv-tick" x1={x0 - 4} y1={y0} x2={x0 + 3} y2={y0} />

          {/* Highlighted sample triangle */}
          <polygon className="cg-uv-highlight-poly" points={UV_SCENE.highlightUvPoints} />

          {UV_SCENE.highlightVertices.map((vert) => (
            <circle
              key={vert.id}
              className="cg-uv-highlight-dot"
              cx={fmt(vert.uvPt.x)}
              cy={fmt(vert.uvPt.y)}
              r="3.2"
            />
          ))}
        </svg>

        <MathLabel at={{ x: uAxisEndX + 10, y: y1 }} tex="u" className="cg-uv-axis-label" />
        <MathLabel at={{ x: x0, y: vAxisEndY - 9 }} tex="v" className="cg-uv-axis-label" />
        <MathLabel at={{ x: x0 - 13, y: y1 + 13 }} tex="0" className="cg-uv-tick-label" />
        <MathLabel at={{ x: x1, y: y1 + 15 }} tex="1" className="cg-uv-tick-label" />
        <MathLabel at={{ x: x0 - 15, y: y0 }} tex="1" className="cg-uv-tick-label" />

        {UV_SCENE.highlightVertices.map((vert) => (
          <MathLabel
            key={vert.id}
            at={vert.uvLabelPt}
            tex={vert.tex}
            className="cg-uv-vertex-label"
          />
        ))}
      </div>

      <div className="cg-uv-note">
        网格沿两条接缝展开为 <span className="math-inline">{String.raw`\([0, 1]^2\)`}</span>{' '}
        上的二维平面；每个顶点都记录着唯一的纹理坐标{' '}
        <span className="math-inline">{String.raw`\((u, v)\)`}</span>。
      </div>
    </div>
  );
}

function UvMappingFigure() {
  const [v1, v2, v3] = UV_SCENE.highlightVertices;

  return (
    <figure className="cg-uv">
      <div className="cg-uv-panels">
        <SurfacePanel />
        <TextureSpacePanel />
      </div>

      <div className="cg-uv-legend">
        <span className="cg-uv-legend-item">
          <span className="cg-uv-swatch cg-uv-swatch-tri" aria-hidden="true" />
          <span>
            高亮三角形顶点映射：
            <span className="math-inline">
              {String.raw`\(${v1.tex}\!\mapsto\!(${v1.u.toFixed(2)}, ${v1.v.toFixed(2)}),\; ${v2.tex}\!\mapsto\!(${v2.u.toFixed(2)}, ${v2.v.toFixed(2)}),\; ${v3.tex}\!\mapsto\!(${v3.u.toFixed(2)}, ${v3.v.toFixed(2)})\)`}
            </span>
          </span>
        </span>
        <span className="cg-uv-legend-item">
          <span className="cg-uv-swatch cg-uv-swatch-seam-u" aria-hidden="true" />
          <span>
            接缝 <span className="math-inline">{String.raw`\(u=0/1\)`}</span>
          </span>
        </span>
        <span className="cg-uv-legend-item">
          <span className="cg-uv-swatch cg-uv-swatch-seam-v" aria-hidden="true" />
          <span>
            接缝 <span className="math-inline">{String.raw`\(v=0/1\)`}</span>
          </span>
        </span>
      </div>

      <figcaption>
        UV mapping 示例：左图为三维环面网格，右图为沿两条虚线接缝（
        <span className="math-inline">{String.raw`\(u=0\)`}</span> 与{' '}
        <span className="math-inline">{String.raw`\(v=0\)`}</span>
        ）展开到二维纹理空间 <span className="math-inline">{String.raw`\([0, 1]^2\)`}</span>{' '}
        后的平面网格。相同颜色表示同一组{' '}
        <span className="math-inline">{String.raw`\((u, v)\)`}</span>{' '}
        坐标；每个三维顶点（如高亮三角形的{' '}
        <span className="math-inline">{String.raw`\(v_1, v_2, v_3\)`}</span>
        ）都关联到纹理平面上的对应位置，渲染时再借助重心坐标插值求得三角形内部各像素的纹理坐标。
      </figcaption>
    </figure>
  );
}

export const POST_COMPONENTS = { UvMappingFigure };
