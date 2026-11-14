type Point = readonly [number, number];
const original: readonly Point[] = [
  [48, 10],
  [12, 73],
  [86, 73],
];
const transformed: readonly Point[] = [
  [70, 12],
  [12, 57],
  [78, 78],
];
const extra: Point = [94, 35];
const triangles = [transformed, [transformed[0], extra, transformed[2]]] as const;
const stages = [
  {
    name: 'Input assembler',
    kind: 'fixed',
    tag: '固定功能',
    note: '按索引组织顶点',
    detail: '形成图元连接关系',
  },
  {
    name: 'Vertex shader',
    kind: 'shader',
    tag: '可编程',
    note: '变换顶点位置',
    detail: '输出逐顶点属性',
  },
  {
    name: 'Tessellation',
    kind: 'mixed',
    tag: '可选 · 混合阶段',
    note: '细分输入 patch',
    detail: '生成更密的网格',
  },
  {
    name: 'Geometry shader',
    kind: 'shader',
    tag: '可选 · 可编程',
    note: '处理整个图元',
    detail: '可生成新的图元',
  },
  {
    name: 'Rasterization',
    kind: 'fixed',
    tag: '固定功能',
    note: '确定采样点覆盖',
    detail: '生成 fragments',
  },
  {
    name: 'Fragment shader',
    kind: 'shader',
    tag: '可编程',
    note: '计算 fragment 颜色',
    detail: '例如纹理与光照',
  },
  {
    name: 'Color blending',
    kind: 'fixed',
    tag: '固定功能',
    note: '与已有目标颜色混合',
    detail: '写入 framebuffer',
  },
] as const;
const points = (vertices: readonly Point[]) => vertices.map((p) => p.join(',')).join(' ');
const midpoint = (a: Point, b: Point): Point => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
const midpoints = transformed.map((p, i) => midpoint(p, transformed[(i + 1) % 3]));
function inside(p: Point, triangle: readonly Point[]) {
  const signs = triangle.map((a, i) => {
    const b = triangle[(i + 1) % 3];
    return (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
  });
  return signs.every((v) => v >= 0) || signs.every((v) => v <= 0);
}
const cells = Array.from({ length: 100 }, (_, i) => {
  const x = (i % 10) * 10;
  const y = Math.floor(i / 10) * 10;
  return { x, y, covered: triangles.some((t) => inside([x + 5, y + 5], t)) };
});

function Geometry({ stage }: { stage: number }) {
  const vertices = stage === 0 ? original : transformed;
  return (
    <g>
      <polygon points={points(vertices)} className="cg-pipeline-mesh" />
      {stage >= 2 && <polygon points={points(midpoints)} className="cg-pipeline-edge" />}
      {stage === 3 && <polygon points={points(triangles[1])} className="cg-pipeline-mesh" />}
      {[...vertices, ...(stage === 3 ? [extra] : [])].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="3" className="cg-pipeline-point" />
          <text x={x + (x > 85 ? -10 : 6)} y={y - 5} className="cg-pipeline-vertex">
            {i}
          </text>
        </g>
      ))}
    </g>
  );
}

function Samples({ stage }: { stage: number }) {
  return (
    <g>
      <rect
        width="100"
        height="100"
        className={stage === 6 ? 'cg-pipeline-buffer' : 'cg-pipeline-grid-bg'}
      />
      {cells.map(({ x, y, covered }) => (
        <g key={`${x}-${y}`}>
          {covered && (
            <rect
              x={x}
              y={y}
              width="10"
              height="10"
              className={stage === 4 ? 'cg-pipeline-coverage' : 'cg-pipeline-color'}
              opacity={stage === 4 ? 0.7 : (0.45 + x / 180) * (stage === 6 ? 0.65 : 1)}
            />
          )}
          <rect x={x} y={y} width="10" height="10" className="cg-pipeline-cell" />
        </g>
      ))}
    </g>
  );
}

function GraphicsPipelineFigure() {
  return (
    <figure className="cg-pipeline">
      <div
        className="cg-pipeline-scroll"
        tabIndex={0}
        role="region"
        aria-label="Graphics pipeline 示意图，可横向滚动"
      >
        <svg
          viewBox="0 0 640 940"
          width="640"
          height="940"
          role="img"
          aria-labelledby="cg-pipeline-title cg-pipeline-desc"
        >
          <title id="cg-pipeline-title">从顶点到 framebuffer 的图形流水线</title>
          <desc id="cg-pipeline-desc">
            输入顶点与索引，经 input assembler 组织连接关系，vertex shader 变换顶点。 可选
            tessellation 细分网格，geometry shader 可生成新图元。 Rasterization 将图元转换成
            fragments，fragment shader 计算颜色， color blending 与目标颜色混合后写入
            framebuffer。右侧用同一组几何形状和采样点展示变化。
          </desc>
          <defs>
            <marker
              id="cg-pipeline-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M0 0L10 5L0 10Z" className="cg-pipeline-point" />
            </marker>
          </defs>
          <text x="135" y="26" textAnchor="middle" className="cg-pipeline-heading">
            Vertex / index buffers
          </text>
          <text x="338" y="26" textAnchor="middle" className="cg-pipeline-label">
            数据的变化
          </text>
          <path d="M135 38V65" className="cg-pipeline-edge" markerEnd="url(#cg-pipeline-arrow)" />
          {stages.map(({ name, kind, tag, note, detail }, i) => {
            const y = 76 + i * 116;
            return (
              <g key={name}>
                <rect
                  x="20"
                  y={y}
                  width="230"
                  height="78"
                  rx="10"
                  className={`cg-pipeline-stage cg-pipeline-${kind}`}
                />
                <text x="135" y={y + 31} textAnchor="middle" className="cg-pipeline-heading">
                  {name}
                </text>
                <text x="135" y={y + 57} textAnchor="middle" className="cg-pipeline-label">
                  {tag}
                </text>
                <path
                  d={`M135 ${y + 82}V${y + 106}`}
                  className="cg-pipeline-edge"
                  markerEnd="url(#cg-pipeline-arrow)"
                />
                <path
                  d={`M258 ${y + 39}H277`}
                  className="cg-pipeline-edge"
                  markerEnd="url(#cg-pipeline-arrow)"
                />
                <g transform={`translate(288 ${y - 7})`}>
                  {i < 4 ? <Geometry stage={i} /> : <Samples stage={i} />}
                </g>
                <text x="416" y={y + 29}>
                  {note}
                </text>
                <text x="416" y={y + 55} className="cg-pipeline-label">
                  {detail}
                </text>
              </g>
            );
          })}
          <text x="135" y="910" textAnchor="middle" className="cg-pipeline-heading">
            Framebuffer
          </text>
        </svg>
      </div>
      <figcaption>
        图形流水线简图：几何图元先变换为 fragments，再计算颜色并写入 framebuffer。 Tessellation
        包含可编程 shader 和固定功能细分器；虚线框表示混合阶段。 图中省略
        clipping、透视除法、viewport 变换及深度／模板测试，fragment 不一定最终写入像素。
        最后两幅使用同一组颜色，以半透明混合示意颜色写入已有背景。 流程参考{' '}
        <a href="https://docs.vulkan.org/tutorial/latest/03_Drawing_a_triangle/02_Graphics_pipeline_basics/00_Introduction.html">
          Vulkan Tutorial
        </a>
        。
      </figcaption>
    </figure>
  );
}

export const POST_COMPONENTS = { GraphicsPipelineFigure };
