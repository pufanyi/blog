export interface BresenhamStep {
  readonly index: number;
  readonly x: number;
  readonly sampleX: number;
  readonly exactY: number;
  readonly prevExactY: number;
  readonly y: number;
  readonly centerY: number;
  readonly baseRow: number;
  readonly upperRow: number;
  readonly boundaryY: number;
  readonly steppedUp: boolean;
  readonly decision: number;
}

export const GRID_COLS = 11;
export const GRID_ROWS = 6;
export const START_POINT = { x: 0.5, y: 0.5 } as const;
export const END_POINT = { x: 10.5, y: 4.5 } as const;
export const DELTA_X = END_POINT.x - START_POINT.x;
export const DELTA_Y = END_POINT.y - START_POINT.y;
export const SLOPE = DELTA_Y / DELTA_X;
export const DEFAULT_STEP = 2;

export const GLOBAL_VIEW = {
  width: 384,
  height: 272,
  originX: 42,
  originY: 214,
  cell: 28,
} as const;

export const ZOOM_VIEW = {
  width: 312,
  height: 272,
  originX: 46,
  originY: 204,
  cell: 78,
} as const;

export const fmt = (value: number): string => {
  const rounded = Number(value.toFixed(2));
  return Object.is(rounded, -0) ? '0' : String(rounded);
};

export const toGlobalX = (x: number): number => GLOBAL_VIEW.originX + x * GLOBAL_VIEW.cell;
export const toGlobalY = (y: number): number => GLOBAL_VIEW.originY - y * GLOBAL_VIEW.cell;

function buildSteps(): readonly BresenhamStep[] {
  const result: BresenhamStep[] = [];
  let decision = 2 * DELTA_Y - DELTA_X;
  for (let i = 0; i < GRID_COLS; i++) {
    const x = i;
    const sampleX = x + 0.5;
    const exactY = Number((START_POINT.y + SLOPE * (sampleX - START_POINT.x)).toFixed(4));
    const y = Math.floor(exactY);
    const prev = result[i - 1];
    const baseRow = prev ? prev.y : y;
    const upperRow = baseRow + 1;
    const boundaryY = baseRow + 1;
    const steppedUp = i > 0 && y > baseRow;
    const currentDecision = decision;
    result.push({
      index: i,
      x,
      sampleX,
      exactY,
      prevExactY: prev ? prev.exactY : exactY,
      y,
      centerY: y + 0.5,
      baseRow,
      upperRow,
      boundaryY,
      steppedUp,
      decision: currentDecision,
    });
    if (decision >= 0) decision -= 2 * DELTA_X;
    decision += 2 * DELTA_Y;
  }
  return result;
}

export const BRESENHAM_STEPS: readonly BresenhamStep[] = buildSteps();

export type CellRole = 'empty' | 'scanned' | 'active-selected' | 'active-candidate' | 'upcoming';

export function getGlobalCellRole(col: number, row: number, activeStep: number): CellRole {
  const step = BRESENHAM_STEPS[activeStep] ?? BRESENHAM_STEPS[DEFAULT_STEP];
  if (col === step.x) {
    if (row === step.y) return 'active-selected';
    if (row === step.baseRow || row === step.upperRow) return 'active-candidate';
    return 'empty';
  }
  const colStep = BRESENHAM_STEPS[col];
  if (colStep && colStep.y === row) {
    return col < step.x ? 'scanned' : 'upcoming';
  }
  return 'empty';
}

export interface ZoomGeometry {
  readonly step: BresenhamStep;
  readonly winX0: number;
  readonly winY0: number;
  readonly activeColIndex: 0 | 1;
  readonly activeCenterX: number;
  readonly prevCenterX: number;
  readonly upperCenterY: number;
  readonly boundarySvgY: number;
  readonly lowerCenterY: number;
  readonly exactSvgY: number;
  readonly prevExactSvgY: number;
  readonly chosenCenterSvgY: number;
  readonly idealLine: {
    readonly x1: number;
    readonly y1: number;
    readonly x2: number;
    readonly y2: number;
  };
  readonly riseX: number;
  readonly exactLabelX: number;
  readonly exactLabelY: number;
  readonly exactLabelAnchor: 'start' | 'end';
  readonly cellRoles: readonly [
    readonly [CellRole, CellRole], // col 0: [row 0 (lower), row 1 (upper)]
    readonly [CellRole, CellRole], // col 1: [row 0 (lower), row 1 (upper)]
  ];
  readonly upperStatus: string;
  readonly lowerStatus: string;
  readonly decisionSummary: string;
}

export function computeZoomGeometry(stepIndex: number): ZoomGeometry {
  const step = BRESENHAM_STEPS[stepIndex] ?? BRESENHAM_STEPS[DEFAULT_STEP];
  const winX0 = step.index === 0 ? 0 : step.x - 1;
  const winY0 = step.baseRow;
  const toZoomX = (x: number) => ZOOM_VIEW.originX + (x - winX0) * ZOOM_VIEW.cell;
  const toZoomY = (y: number) => ZOOM_VIEW.originY - (y - winY0) * ZOOM_VIEW.cell;

  const col0CenterX = toZoomX(winX0 + 0.5);
  const col1CenterX = toZoomX(winX0 + 1.5);
  const activeColIndex: 0 | 1 = step.index === 0 ? 0 : 1;
  const activeCenterX = activeColIndex === 0 ? col0CenterX : col1CenterX;
  const prevCenterX = col0CenterX;

  const lowerCenterY = toZoomY(winY0 + 0.5);
  const boundarySvgY = toZoomY(winY0 + 1);
  const upperCenterY = toZoomY(winY0 + 1.5);
  const exactSvgY = toZoomY(step.exactY);
  const prevExactSvgY = toZoomY(step.prevExactY);
  const chosenCenterSvgY = step.steppedUp ? upperCenterY : lowerCenterY;

  const lineStartX = Math.max(START_POINT.x, winX0);
  const lineEndX = Math.min(END_POINT.x, winX0 + 2);
  const lineStartY = START_POINT.y + SLOPE * (lineStartX - START_POINT.x);
  const lineEndY = START_POINT.y + SLOPE * (lineEndX - START_POINT.x);

  const riseX = activeCenterX - 22;
  const exactLabelX = step.index === 0 ? activeCenterX + 8 : activeCenterX - 8;
  const exactLabelAnchor: 'start' | 'end' = step.index === 0 ? 'start' : 'end';
  // Keep label clear of the y = winY0 + 1 boundary line at boundarySvgY.
  const rawLabelY = exactSvgY - 9;
  const exactLabelY = Math.abs(rawLabelY - boundarySvgY) < 10 ? boundarySvgY - 10 : rawLabelY;

  const cellRoles: readonly [readonly [CellRole, CellRole], readonly [CellRole, CellRole]] = [
    [getGlobalCellRole(winX0, winY0, step.index), getGlobalCellRole(winX0, winY0 + 1, step.index)],
    [
      getGlobalCellRole(winX0 + 1, winY0, step.index),
      getGlobalCellRole(winX0 + 1, winY0 + 1, step.index),
    ],
  ];

  const upperStatus = step.steppedUp ? '✓ 上移选中' : '候选（上移）';
  const lowerStatus =
    step.index === 0 ? '✓ 起点像素' : step.steppedUp ? '候选（同行）' : '✓ 同行选中';

  const decisionSummary =
    step.index === 0
      ? `起点落在像素 (0, 0)，中心 (0.5, 0.5)`
      : step.steppedUp
        ? `越过分界：${fmt(step.exactY)} ≥ ${step.boundaryY} → 上移选 (${step.x}, ${step.y})`
        : `未越分界：${fmt(step.exactY)} < ${step.boundaryY} → 同行选 (${step.x}, ${step.y})`;

  return {
    step,
    winX0,
    winY0,
    activeColIndex,
    activeCenterX,
    prevCenterX,
    upperCenterY,
    boundarySvgY,
    lowerCenterY,
    exactSvgY,
    prevExactSvgY,
    chosenCenterSvgY,
    idealLine: {
      x1: toZoomX(lineStartX),
      y1: toZoomY(lineStartY),
      x2: toZoomX(lineEndX),
      y2: toZoomY(lineEndY),
    },
    riseX,
    exactLabelX,
    exactLabelY,
    exactLabelAnchor,
    cellRoles,
    upperStatus,
    lowerStatus,
    decisionSummary,
  };
}
