type Pt = readonly [number, number];

interface Segment {
  p1: Pt;
  p2: Pt;
}

const ox = 252;
const oy = 170;
const unit = 172;
const fmt = (n: number) => n.toFixed(1);
const toSvg = ([z, x]: Pt): Pt => [ox + z * unit, oy - x * unit];
const line = (a: Pt, b: Pt) => `M${fmt(a[0])} ${fmt(a[1])}L${fmt(b[0])} ${fmt(b[1])}`;
const polygonPoints = (pts: readonly Pt[]) =>
  pts.map((p) => `${fmt(p[0])},${fmt(p[1])}`).join(' ');

const sensorZ = -1;
const frustumZMax = 2.65;
const halfSlope = 0.35;
const pixelCount = 14;
const sensorCellUnit = (2 * halfSlope) / pixelCount;
const sensorWidthPx = 11;

// Scene geometry in (z, x) coordinates with the pinhole at (0, 0).
const redSegment: Segment = {
  p1: [2.25, -0.3375],
  p2: [2.25, halfSlope * 2.25],
};

// Blue bar passes through [1.85, 0.4625] and crosses the red bar at [2.25, 0.04],
// continuing behind it down to ray slope x/z = -0.04.
const blueStart: Pt = [1.85, 0.4625];
const blueCross: Pt = [2.25, 0.04];
const blueDir: Pt = [blueCross[0] - blueStart[0], blueCross[1] - blueStart[1]];
const blueEndSlope = -0.04;
const blueEndT =
  (blueStart[1] - blueEndSlope * blueStart[0]) / (blueEndSlope * blueDir[0] - blueDir[1]);
const blueSegment: Segment = {
  p1: blueStart,
  p2: [blueStart[0] + blueEndT * blueDir[0], blueStart[1] + blueEndT * blueDir[1]],
};

function intersectSegments(a: Segment, b: Segment): Pt {
  const [az1, ax1] = a.p1;
  const [az2, ax2] = a.p2;
  const [bz1, bx1] = b.p1;
  const [bz2, bx2] = b.p2;
  const daz = az2 - az1;
  const dax = ax2 - ax1;
  const dbz = bz2 - bz1;
  const dbx = bx2 - bx1;
  const denom = daz * dbx - dax * dbz;
  const t = ((bz1 - az1) * dbx - (bx1 - ax1) * dbz) / denom;
  return [az1 + t * daz, ax1 + t * dax];
}

function intersectRayWithSegment(slope: number, seg: Segment): number | null {
  const [z1, x1] = seg.p1;
  const [z2, x2] = seg.p2;
  const dz = z2 - z1;
  const dx = x2 - x1;
  const denom = slope * dz - dx;
  if (Math.abs(denom) < 1e-9) {
    return null;
  }
  const u = (x1 - slope * z1) / denom;
  if (u < -1e-6 || u > 1 + 1e-6) {
    return null;
  }
  const z = z1 + u * dz;
  return z > 0 ? z : null;
}

const crossingPoint = intersectSegments(redSegment, blueSegment);

interface SensorPixel {
  index: number;
  xTop: number;
  xBottom: number;
  fill: 'empty' | 'red' | 'blue';
}

const sensorPixels: readonly SensorPixel[] = Array.from({ length: pixelCount }, (_, index) => {
  const xTop = halfSlope - index * sensorCellUnit;
  const xBottom = xTop - sensorCellUnit;
  const xMid = (xTop + xBottom) / 2;
  // Ray from (z = -1, x = xMid) through (0, 0) has slope x / z = -xMid for z > 0.
  const slope = -xMid;
  const zRed = intersectRayWithSegment(slope, redSegment);
  const zBlue = intersectRayWithSegment(slope, blueSegment);

  let fill: SensorPixel['fill'] = 'empty';
  if (zRed !== null && zBlue !== null) {
    fill = zRed <= zBlue ? 'red' : 'blue';
  } else if (zRed !== null) {
    fill = 'red';
  } else if (zBlue !== null) {
    fill = 'blue';
  }

  return { index, xTop, xBottom, fill };
});

interface RayGuide {
  id: string;
  scenePoint: Pt;
  role: 'red' | 'blue' | 'crossing';
}

const rayGuides: readonly RayGuide[] = [
  { id: 'red-top', scenePoint: redSegment.p2, role: 'red' },
  { id: 'blue-top', scenePoint: blueSegment.p1, role: 'blue' },
  { id: 'crossing', scenePoint: crossingPoint, role: 'crossing' },
  { id: 'blue-bottom', scenePoint: blueSegment.p2, role: 'blue' },
  { id: 'red-bottom', scenePoint: redSegment.p1, role: 'red' },
];

const sensorTopSvg = toSvg([sensorZ, halfSlope]);
const sensorBottomSvg = toSvg([sensorZ, -halfSlope]);
const originSvg = toSvg([0, 0]);
const frustumTopSvg = toSvg([frustumZMax, halfSlope * frustumZMax]);
const frustumBottomSvg = toSvg([frustumZMax, -halfSlope * frustumZMax]);

const samplePoint = redSegment.p1;
const sampleSensorHitSvg = toSvg([sensorZ, -samplePoint[1] / samplePoint[0]]);
const sampleSceneSvg = toSvg(samplePoint);

function PinholeCameraFigure() {
  return (
    <figure className="cg-pinhole">
      <div
        className="cg-pinhole-scroll"
        tabIndex={0}
        role="region"
        aria-label="Pinhole camera projection diagram; scroll horizontally"
      >
        <svg
          viewBox="0 0 760 340"
          width={760}
          height={340}
          role="img"
          aria-labelledby="cg-pinhole-title cg-pinhole-desc"
        >
          <title id="cg-pinhole-title">
            Pinhole camera projection and depth occlusion on a virtual sensor
          </title>
          <desc id="cg-pinhole-desc">
            A pinhole at the origin (0, 0) projects a vertical red bar and a tilted crossing blue
            bar onto a 14-pixel virtual sensor at z = -1. Rays from (x, z) pass straight through
            (0, 0) to (-1, -x/z). Where the two bars overlap along a ray, each sensor pixel records
            only the closer surface, yielding 4 empty, 3 red, 5 blue, and 2 red pixels from top
            to bottom.
          </desc>
          <defs>
            <marker
              id="cg-pinhole-arrow"
              viewBox="0 0 10 10"
              refX="8.5"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M0 1L10 5L0 9Z" className="cg-pinhole-arrow" />
            </marker>
            <linearGradient id="cg-pinhole-cone-right" x1="0" y1="0.5" x2="1" y2="0.5">
              <stop offset="0" className="cg-pinhole-cone-near" />
              <stop offset="1" className="cg-pinhole-cone-far" />
            </linearGradient>
            <linearGradient id="cg-pinhole-cone-left" x1="1" y1="0.5" x2="0" y2="0.5">
              <stop offset="0" className="cg-pinhole-cone-near" />
              <stop offset="1" className="cg-pinhole-cone-far" />
            </linearGradient>
          </defs>

          <polygon
            points={polygonPoints([sensorTopSvg, originSvg, sensorBottomSvg])}
            fill="url(#cg-pinhole-cone-left)"
          />
          <polygon
            points={polygonPoints([originSvg, frustumTopSvg, frustumBottomSvg])}
            fill="url(#cg-pinhole-cone-right)"
          />

          <path d={line(sensorTopSvg, frustumBottomSvg)} className="cg-pinhole-frustum" />
          <path d={line(sensorBottomSvg, frustumTopSvg)} className="cg-pinhole-frustum" />

          <path
            d={`M${fmt(ox)} 326L${fmt(ox)} 16`}
            className="cg-pinhole-axis"
            markerStart="url(#cg-pinhole-arrow)"
            markerEnd="url(#cg-pinhole-arrow)"
          />
          <path
            d={`M${fmt(sensorTopSvg[0])} ${fmt(oy)}L742 ${fmt(oy)}`}
            className="cg-pinhole-axis"
            markerEnd="url(#cg-pinhole-arrow)"
          />

          {rayGuides.map(({ id, scenePoint, role }) => {
            const sensorHit = toSvg([sensorZ, -scenePoint[1] / scenePoint[0]]);
            const sceneSvg = toSvg(scenePoint);
            return (
              <path
                key={id}
                d={line(sensorHit, sceneSvg)}
                className={`cg-pinhole-ray cg-pinhole-ray-${role}`}
              />
            );
          })}

          <path
            d={line(toSvg(redSegment.p1), toSvg(redSegment.p2))}
            className="cg-pinhole-bar cg-pinhole-bar-red"
          />
          <path
            d={line(toSvg(blueSegment.p1), toSvg(blueSegment.p2))}
            className="cg-pinhole-bar cg-pinhole-bar-blue"
          />

          <g>
            {sensorPixels.map(({ index, xTop, xBottom, fill }) => {
              const [, yTop] = toSvg([sensorZ, xTop]);
              const [, yBottom] = toSvg([sensorZ, xBottom]);
              return (
                <rect
                  key={index}
                  x={sensorTopSvg[0] - sensorWidthPx}
                  y={yTop}
                  width={sensorWidthPx}
                  height={yBottom - yTop}
                  className={`cg-pinhole-pixel cg-pinhole-pixel-${fill}`}
                />
              );
            })}
            <rect
              x={sensorTopSvg[0] - sensorWidthPx}
              y={sensorTopSvg[1]}
              width={sensorWidthPx}
              height={sensorBottomSvg[1] - sensorTopSvg[1]}
              className="cg-pinhole-sensor-frame"
            />
          </g>

          <circle cx={originSvg[0]} cy={originSvg[1]} r="4.5" className="cg-pinhole-origin" />

          <text x={ox + 10} y="27" className="cg-pinhole-axis-label">
            <tspan className="cg-pinhole-symbol">x</tspan>-axis
          </text>
          <text x="738" y={oy - 11} textAnchor="end" className="cg-pinhole-axis-label">
            <tspan className="cg-pinhole-symbol">z</tspan>-axis
          </text>

          <text x={(sensorTopSvg[0] + ox) / 2} y={oy + 18} textAnchor="middle" className="cg-pinhole-label">
            1
          </text>

          <text x={ox} y={oy + 28} textAnchor="middle" className="cg-pinhole-title-label">
            Pinhole Camera
          </text>
          <text x={ox} y={oy + 45} textAnchor="middle" className="cg-pinhole-coord">
            (0, 0)
          </text>

          <text
            x={sensorTopSvg[0] - sensorWidthPx / 2}
            y={sensorBottomSvg[1] + 22}
            textAnchor="middle"
            className="cg-pinhole-title-label"
          >
            Virtual
          </text>
          <text
            x={sensorTopSvg[0] - sensorWidthPx / 2}
            y={sensorBottomSvg[1] + 39}
            textAnchor="middle"
            className="cg-pinhole-title-label"
          >
            Sensor
          </text>

          <text
            x={sensorTopSvg[0] - sensorWidthPx - 8}
            y={sampleSensorHitSvg[1] + 4}
            textAnchor="end"
            className="cg-pinhole-symbol"
          >
            −x/z
          </text>
          <text
            x={sampleSceneSvg[0] + 10}
            y={sampleSceneSvg[1] + 16}
            textAnchor="start"
            className="cg-pinhole-symbol"
          >
            (x, z)
          </text>
        </svg>
      </div>
      <figcaption>
        Pinhole projection in the {String.raw`\((z, x)\)`} slice. Each point{' '}
        {String.raw`\((x, z)\)`} casts a ray through {String.raw`\((0, 0)\)`} onto the sensor at{' '}
        {String.raw`\(z = -1\)`}, landing at {String.raw`\(-x/z\)`} (inverted; a virtual image
        plane at {String.raw`\(z = 1\)`} gives {String.raw`\(x/z\)`}). Along overlapping rays, each
        pixel takes the smaller-{String.raw`\(z\)`} surface.
      </figcaption>
    </figure>
  );
}

export const POST_COMPONENTS = { PinholeCameraFigure };
