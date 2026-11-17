export interface Point2D {
  readonly x: number;
  readonly y: number;
}

export interface AxisAlignedBox {
  readonly xMin: number;
  readonly yMin: number;
  readonly xMax: number;
  readonly yMax: number;
}

export type BlockClassification = 'early-in' | 'early-out' | 'else';
export type EdgeName = 'AB' | 'BC' | 'CA';

export interface EdgeBoxExtrema {
  readonly edge: EdgeName;
  readonly minVal: number;
  readonly maxVal: number;
  readonly minCorner: Point2D;
  readonly maxCorner: Point2D;
}

export interface SamplePointInfo {
  readonly col: number;
  readonly row: number;
  readonly localCol: number;
  readonly localRow: number;
  readonly x: number;
  readonly y: number;
  readonly inside: boolean;
  readonly isCorner: boolean;
}

export interface BlockCoverageInfo {
  readonly bx: number;
  readonly by: number;
  readonly key: string;
  readonly x0: number;
  readonly y0: number;
  readonly pixelBox: AxisAlignedBox;
  readonly sampleBox: AxisAlignedBox;
  readonly classification: BlockClassification;
  readonly linearExtremaClassification: BlockClassification;
  readonly naivePixelBoxClassification: BlockClassification;
  readonly sampleBoxSavedTests: boolean;
  readonly edgeExtrema: readonly [EdgeBoxExtrema, EdgeBoxExtrema, EdgeBoxExtrema];
  readonly separatingEdge?: EdgeName;
  readonly cornersInside: number;
  readonly coveredCount: number;
  readonly samples: readonly SamplePointInfo[];
  readonly sampleBoxIntersections: readonly Point2D[];
  readonly canonicalLabel?: 'early out' | 'early in' | 'else';
}

export interface BlockPreset {
  readonly bx: number;
  readonly by: number;
  readonly label: string;
}

export const GRID_SIZE = 16;
export const BLOCK_SIZE = 4;
export const BLOCK_COUNT = GRID_SIZE / BLOCK_SIZE;

// Counter-clockwise triangle A -> B -> C in [0, 16]^2 (origin at bottom-left).
// Rational edge slopes (1/5, -2, 5/3) keep every half-integer sample center well clear
// of the three edges while reproducing Lecture 04's block coverage layout.
export const TRIANGLE_VERTICES = [
  { x: 0.45, y: 0.58 },
  { x: 15.65, y: 3.62 },
  { x: 9.57, y: 15.78 },
] as const satisfies readonly [Point2D, Point2D, Point2D];

export const DEFAULT_BLOCK = { bx: 2, by: 3 } as const;

export const CANONICAL_BLOCKS: readonly {
  readonly bx: number;
  readonly by: number;
  readonly label: 'early out' | 'early in' | 'else';
}[] = [
  { bx: 0, by: 3, label: 'early out' },
  { bx: 2, by: 1, label: 'early in' },
  { bx: 2, by: 3, label: 'else' },
];

export const BLOCK_PRESETS: readonly BlockPreset[] = [
  { bx: 2, by: 3, label: 'else 顶点块 (2, 3)' },
  { bx: 2, by: 1, label: 'early-in (2, 1)' },
  { bx: 0, by: 3, label: 'early-out (0, 3)' },
  { bx: 2, by: 2, label: '采样框省检 early-in (2, 2)' },
  { bx: 1, by: 3, label: '采样框省检 early-out (1, 3)' },
];

export const GLOBAL_PANEL_VIEW = {
  width: 384,
  height: 400,
  originX: 42,
  originY: 364,
  cell: 19,
} as const;

export const ZOOM_PANEL_VIEW = {
  width: 336,
  height: 400,
  originX: 48,
  originY: 270,
  cell: 50,
} as const;

export const fmt = (value: number): string => {
  const rounded = Number(value.toFixed(2));
  return Object.is(rounded, -0) ? '0' : String(rounded);
};

export const toGlobalSvgX = (x: number): number =>
  GLOBAL_PANEL_VIEW.originX + x * GLOBAL_PANEL_VIEW.cell;
export const toGlobalSvgY = (y: number): number =>
  GLOBAL_PANEL_VIEW.originY - y * GLOBAL_PANEL_VIEW.cell;

export const toZoomSvgX = (x: number, x0: number): number =>
  ZOOM_PANEL_VIEW.originX + (x - x0) * ZOOM_PANEL_VIEW.cell;
export const toZoomSvgY = (y: number, y0: number): number =>
  ZOOM_PANEL_VIEW.originY - (y - y0) * ZOOM_PANEL_VIEW.cell;

// Matches the article's edge function:
// E_AB(x, y) = (x_B - x_A)(y - y_A) - (y_B - y_A)(x - x_A)
export function edgeFunction(from: Point2D, to: Point2D, p: Point2D): number {
  return (to.x - from.x) * (p.y - from.y) - (to.y - from.y) * (p.x - from.x);
}

export function pointInTriangle(
  point: Point2D,
  vertices: readonly [Point2D, Point2D, Point2D] = TRIANGLE_VERTICES,
): boolean {
  const [a, b, c] = vertices;
  const eAB = edgeFunction(a, b, point);
  const eBC = edgeFunction(b, c, point);
  const eCA = edgeFunction(c, a, point);
  return (eAB >= 0 && eBC >= 0 && eCA >= 0) || (eAB <= 0 && eBC <= 0 && eCA <= 0);
}

// O(1) extrema of a linear edge function E(x, y) = -(y_B - y_A)(x - x_A) + (x_B - x_A)(y - y_A)
// over an axis-aligned rectangle [x_l, x_r] x [y_l, y_r].
export function evaluateEdgeExtremaOnBox(
  edge: EdgeName,
  from: Point2D,
  to: Point2D,
  box: AxisAlignedBox,
): EdgeBoxExtrema {
  const coeffX = -(to.y - from.y);
  const coeffY = to.x - from.x;
  const minCorner: Point2D = {
    x: coeffX >= 0 ? box.xMin : box.xMax,
    y: coeffY >= 0 ? box.yMin : box.yMax,
  };
  const maxCorner: Point2D = {
    x: coeffX >= 0 ? box.xMax : box.xMin,
    y: coeffY >= 0 ? box.yMax : box.yMin,
  };
  return {
    edge,
    minVal: edgeFunction(from, to, minCorner),
    maxVal: edgeFunction(from, to, maxCorner),
    minCorner,
    maxCorner,
  };
}

export function classifyBoxByLinearEdgeFunctions(
  box: AxisAlignedBox,
  vertices: readonly [Point2D, Point2D, Point2D] = TRIANGLE_VERTICES,
): {
  readonly classification: BlockClassification;
  readonly edgeExtrema: readonly [EdgeBoxExtrema, EdgeBoxExtrema, EdgeBoxExtrema];
  readonly separatingEdge?: EdgeName;
} {
  const [a, b, c] = vertices;
  const edgeExtrema: readonly [EdgeBoxExtrema, EdgeBoxExtrema, EdgeBoxExtrema] = [
    evaluateEdgeExtremaOnBox('AB', a, b, box),
    evaluateEdgeExtremaOnBox('BC', b, c, box),
    evaluateEdgeExtremaOnBox('CA', c, a, box),
  ];

  if (edgeExtrema.every((item) => item.minVal >= 0)) {
    return { classification: 'early-in', edgeExtrema };
  }

  const sep = edgeExtrema.find((item) => item.maxVal < 0);
  if (sep) {
    return { classification: 'early-out', edgeExtrema, separatingEdge: sep.edge };
  }

  return { classification: 'else', edgeExtrema };
}

export function boxCorners(box: AxisAlignedBox): readonly [Point2D, Point2D, Point2D, Point2D] {
  return [
    { x: box.xMin, y: box.yMin },
    { x: box.xMax, y: box.yMin },
    { x: box.xMax, y: box.yMax },
    { x: box.xMin, y: box.yMax },
  ];
}

function segmentIntersection(
  p0: Point2D,
  p1: Point2D,
  q0: Point2D,
  q1: Point2D,
): Point2D | undefined {
  const rX = p1.x - p0.x;
  const rY = p1.y - p0.y;
  const sX = q1.x - q0.x;
  const sY = q1.y - q0.y;
  const denom = rX * sY - rY * sX;
  const qpX = q0.x - p0.x;
  const qpY = q0.y - p0.y;

  if (Math.abs(denom) < 1e-9) {
    const crossQpR = qpX * rY - qpY * rX;
    if (Math.abs(crossQpR) > 1e-9) return undefined;
    const rLenSq = rX * rX + rY * rY;
    if (rLenSq < 1e-12) return undefined;
    const t0 = (qpX * rX + qpY * rY) / rLenSq;
    const t1 = t0 + (sX * rX + sY * rY) / rLenSq;
    const tMin = Math.max(0, Math.min(t0, t1));
    const tMax = Math.min(1, Math.max(t0, t1));
    if (tMin > tMax + 1e-9) return undefined;
    return { x: p0.x + tMin * rX, y: p0.y + tMin * rY };
  }

  const t = (qpX * sY - qpY * sX) / denom;
  const u = (qpX * rY - qpY * rX) / denom;
  const eps = 1e-9;
  if (t >= -eps && t <= 1 + eps && u >= -eps && u <= 1 + eps) {
    const tc = Math.min(1, Math.max(0, t));
    return { x: p0.x + tc * rX, y: p0.y + tc * rY };
  }
  return undefined;
}

export function findBoxTriangleIntersections(
  box: AxisAlignedBox,
  vertices: readonly [Point2D, Point2D, Point2D] = TRIANGLE_VERTICES,
): readonly Point2D[] {
  const corners = boxCorners(box);
  const boxEdges: readonly [Point2D, Point2D][] = [
    [corners[0], corners[1]],
    [corners[1], corners[2]],
    [corners[2], corners[3]],
    [corners[3], corners[0]],
  ];
  const triEdges: readonly [Point2D, Point2D][] = [
    [vertices[0], vertices[1]],
    [vertices[1], vertices[2]],
    [vertices[2], vertices[0]],
  ];

  const hits: Point2D[] = [];
  for (const [p0, p1] of triEdges) {
    for (const [q0, q1] of boxEdges) {
      const hit = segmentIntersection(p0, p1, q0, q1);
      if (hit && !hits.some((prev) => Math.hypot(prev.x - hit.x, prev.y - hit.y) < 1e-5)) {
        hits.push(hit);
      }
    }
  }
  return hits;
}

export function classifyBoxAgainstTriangle(
  box: AxisAlignedBox,
  vertices: readonly [Point2D, Point2D, Point2D] = TRIANGLE_VERTICES,
): {
  readonly classification: BlockClassification;
  readonly cornersInside: number;
  readonly intersections: readonly Point2D[];
} {
  const corners = boxCorners(box);
  const cornersInside = corners.filter((corner) => pointInTriangle(corner, vertices)).length;
  const intersections = findBoxTriangleIntersections(box, vertices);

  if (cornersInside === 4) {
    return { classification: 'early-in', cornersInside, intersections };
  }

  const hasVertexInsideBox = vertices.some(
    (v) => v.x >= box.xMin && v.x <= box.xMax && v.y >= box.yMin && v.y <= box.yMax,
  );
  if (intersections.length > 0 || hasVertexInsideBox) {
    return { classification: 'else', cornersInside, intersections };
  }

  return { classification: 'early-out', cornersInside, intersections };
}

function buildAllBlocks(): readonly BlockCoverageInfo[] {
  const blocks: BlockCoverageInfo[] = [];
  for (let by = 0; by < BLOCK_COUNT; by++) {
    for (let bx = 0; bx < BLOCK_COUNT; bx++) {
      const x0 = bx * BLOCK_SIZE;
      const y0 = by * BLOCK_SIZE;
      const pixelBox: AxisAlignedBox = {
        xMin: x0,
        yMin: y0,
        xMax: x0 + BLOCK_SIZE,
        yMax: y0 + BLOCK_SIZE,
      };
      const sampleBox: AxisAlignedBox = {
        xMin: x0 + 0.5,
        yMin: y0 + 0.5,
        xMax: x0 + BLOCK_SIZE - 0.5,
        yMax: y0 + BLOCK_SIZE - 0.5,
      };

      const sampleTest = classifyBoxAgainstTriangle(sampleBox);
      const linearTest = classifyBoxByLinearEdgeFunctions(sampleBox);
      const pixelTest = classifyBoxAgainstTriangle(pixelBox);

      const samples: SamplePointInfo[] = [];
      let coveredCount = 0;
      for (let localRow = 0; localRow < BLOCK_SIZE; localRow++) {
        for (let localCol = 0; localCol < BLOCK_SIZE; localCol++) {
          const col = x0 + localCol;
          const row = y0 + localRow;
          const x = col + 0.5;
          const y = row + 0.5;
          const inside = pointInTriangle({ x, y });
          if (inside) coveredCount += 1;
          const isCorner =
            (localCol === 0 || localCol === BLOCK_SIZE - 1) &&
            (localRow === 0 || localRow === BLOCK_SIZE - 1);
          samples.push({ col, row, localCol, localRow, x, y, inside, isCorner });
        }
      }

      const canonical = CANONICAL_BLOCKS.find((item) => item.bx === bx && item.by === by);
      blocks.push({
        bx,
        by,
        key: `${bx},${by}`,
        x0,
        y0,
        pixelBox,
        sampleBox,
        classification: sampleTest.classification,
        linearExtremaClassification: linearTest.classification,
        naivePixelBoxClassification: pixelTest.classification,
        sampleBoxSavedTests:
          sampleTest.classification !== 'else' && pixelTest.classification === 'else',
        edgeExtrema: linearTest.edgeExtrema,
        separatingEdge: linearTest.separatingEdge,
        cornersInside: sampleTest.cornersInside,
        coveredCount,
        samples,
        sampleBoxIntersections: sampleTest.intersections,
        canonicalLabel: canonical?.label,
      });
    }
  }
  return blocks;
}

export const ALL_BLOCKS: readonly BlockCoverageInfo[] = buildAllBlocks();

export function getBlockInfo(bx: number, by: number): BlockCoverageInfo {
  const match =
    ALL_BLOCKS.find((block) => block.bx === bx && block.by === by) ??
    ALL_BLOCKS.find((block) => block.bx === DEFAULT_BLOCK.bx && block.by === DEFAULT_BLOCK.by) ??
    ALL_BLOCKS[0];
  if (!match) {
    throw new Error('ALL_BLOCKS must not be empty');
  }
  return match;
}

export function describeBlockDecision(block: BlockCoverageInfo): {
  readonly badgeText: string;
  readonly step1: string;
  readonly step2: string;
  readonly verdict: string;
  readonly readoutTitle: string;
  readonly boxDiffNote: string;
} {
  if (block.classification === 'early-in') {
    return {
      badgeText: 'early-in',
      step1: '① 三条边在 [xₗ,xᵣ]×[yₗ,yᵣ] 上 min E ≥ 0',
      step2: '② 四角采样点 4 / 4 在内，凸性覆盖全块',
      verdict: '⇒ early-in：O(1) 判定 16 / 16 像素覆盖',
      readoutTitle: `区块 (${block.bx}, ${block.by}) · early-in（覆盖 16 / 16）`,
      boxDiffNote: block.sampleBoxSavedTests
        ? '像素 4×4 外框右上角落在三角形外，若按外框会误入 else；改用紧贴采样中心的 [xₗ, xᵣ]×[yₗ, yᵣ] 包围盒后，三边 min E ≥ 0，直接 early-in 免测其余 12 点。'
        : '线性函数 E_AB、E_BC、E_CA 在 [xₗ, xᵣ]×[yₗ, yᵣ] 上的最小值均 ≥ 0（等价于四角均在内），O(1) 确认块内 16 个采样点全部命中。',
    };
  }

  if (block.classification === 'early-out') {
    const edgeLabel = block.separatingEdge ?? 'CA';
    return {
      badgeText: 'early-out',
      step1: `① 边 ${edgeLabel} 在 [xₗ,xᵣ]×[yₗ,yᵣ] 上 max E_${edgeLabel} < 0`,
      step2: '② 整块位于该有向边外侧（与边 0 交点）',
      verdict: '⇒ early-out：O(1) 跳过 0 / 16 像素',
      readoutTitle: `区块 (${block.bx}, ${block.by}) · early-out（覆盖 0 / 16）`,
      boxDiffNote: block.sampleBoxSavedTests
        ? `三角形边擦过像素 4×4 外框右下角却未触及任何采样中心；在采样包围盒 [xₗ, xᵣ]×[yₗ, yᵣ] 上 max E_${edgeLabel} < 0，O(1) 直接排除整块。`
        : `线性函数 E_${edgeLabel} 在采样包围盒极值角点处仍 < 0（max E_${edgeLabel} < 0），整块位于有向边外侧，16 个像素一次性跳过。`,
    };
  }

  return {
    badgeText: 'else',
    step1: `① 存在边 min E < 0（仅 ${block.cornersInside} / 4 角在三角形内）`,
    step2: `② 但三边 max E ≥ 0，边穿采样框 ${block.sampleBoxIntersections.length} 处`,
    verdict: `⇒ else：细测 16 个像素中心，命中 ${block.coveredCount} / 16`,
    readoutTitle: `区块 (${block.bx}, ${block.by}) · else（覆盖 ${block.coveredCount} / 16）`,
    boxDiffNote:
      '至少一条边在 [xₗ, xᵣ]×[yₗ, yᵣ] 上变号（min E < 0 且 max E ≥ 0），三角形边界穿过采样包围盒，需逐像素测试或继续细分子块。',
  };
}
