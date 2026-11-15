type Pt = readonly [number, number];

const ox = 220;
const oy = 110;
const unit = 110;
const fmt = (n: number) => n.toFixed(1);
const toSvg = ([z, x]: Pt): Pt => [ox + z * unit, oy - x * unit];
const line = (a: Pt, b: Pt) => `M${fmt(a[0])} ${fmt(a[1])}L${fmt(b[0])} ${fmt(b[1])}`;
const polygonPoints = (pts: readonly Pt[]) => pts.map((p) => `${fmt(p[0])},${fmt(p[1])}`).join(' ');

// Scene geometry in (z, x) coordinates with the pinhole at (0, 0).
const sensorZ = -1;
const sensorHalfHeight = 0.58;
const scenePoint: Pt = [2.2, 0.68];
const sensorHitPoint: Pt = [sensorZ, -scenePoint[1] / scenePoint[0]];

const originSvg = toSvg([0, 0]);
const sensorTopSvg = toSvg([sensorZ, sensorHalfHeight]);
const sensorBottomSvg = toSvg([sensorZ, -sensorHalfHeight]);
const sensorAxisSvg = toSvg([sensorZ, 0]);
const scenePointSvg = toSvg(scenePoint);
const sceneAxisSvg = toSvg([scenePoint[0], 0]);
const sensorHitSvg = toSvg(sensorHitPoint);

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
          viewBox="0 0 600 220"
          width={600}
          height={220}
          role="img"
          aria-labelledby="cg-pinhole-title cg-pinhole-desc"
        >
          <title id="cg-pinhole-title">Minimal pinhole camera projection geometry</title>
          <desc id="cg-pinhole-desc">
            In the (z, x) slice, a light ray from point (x, z) passes through the pinhole at (0, 0)
            and intersects the sensor plane at z = -1 at -x/z, forming two similar right triangles.
          </desc>
          <defs>
            <marker
              id="cg-pinhole-arrow"
              viewBox="0 0 10 10"
              refX="8.5"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M0 1L10 5L0 9Z" className="cg-pinhole-arrow" />
            </marker>
          </defs>

          <polygon
            points={polygonPoints([originSvg, sensorAxisSvg, sensorHitSvg])}
            className="cg-pinhole-triangle"
          />
          <polygon
            points={polygonPoints([originSvg, sceneAxisSvg, scenePointSvg])}
            className="cg-pinhole-triangle"
          />

          <path
            d={`M${fmt(ox)} 198L${fmt(ox)} 18`}
            className="cg-pinhole-axis"
            markerEnd="url(#cg-pinhole-arrow)"
          />
          <path
            d={`M56 ${fmt(oy)}L570 ${fmt(oy)}`}
            className="cg-pinhole-axis"
            markerEnd="url(#cg-pinhole-arrow)"
          />

          <path d={line(scenePointSvg, sceneAxisSvg)} className="cg-pinhole-drop" />
          <path d={line(sensorTopSvg, sensorBottomSvg)} className="cg-pinhole-sensor" />
          <path d={line(sensorHitSvg, scenePointSvg)} className="cg-pinhole-ray" />

          <circle cx={originSvg[0]} cy={originSvg[1]} r="4" className="cg-pinhole-origin" />
          <circle cx={scenePointSvg[0]} cy={scenePointSvg[1]} r="4" className="cg-pinhole-point" />
          <circle cx={sensorHitSvg[0]} cy={sensorHitSvg[1]} r="4" className="cg-pinhole-point" />

          <text x={ox + 12} y="26" className="cg-pinhole-symbol">
            x
          </text>
          <text x="568" y={oy - 11} textAnchor="end" className="cg-pinhole-symbol">
            z
          </text>

          <text x={sensorTopSvg[0]} y="32" textAnchor="middle" className="cg-pinhole-title-label">
            Sensor
          </text>
          <text
            x={sensorBottomSvg[0]}
            y="194"
            textAnchor="middle"
            className="cg-pinhole-axis-label"
          >
            <tspan className="cg-pinhole-symbol">z</tspan> = −1
          </text>

          <text x={ox + 10} y={oy + 22} className="cg-pinhole-axis-label">
            Pinhole (0, 0)
          </text>

          <text
            x={scenePointSvg[0] + 10}
            y={scenePointSvg[1] + 4}
            className="cg-pinhole-point-label"
          >
            (<tspan className="cg-pinhole-symbol">x</tspan>,{' '}
            <tspan className="cg-pinhole-symbol">z</tspan>)
          </text>
          <text
            x={sensorHitSvg[0] - 12}
            y={sensorHitSvg[1] + 4}
            textAnchor="end"
            className="cg-pinhole-point-label"
          >
            −<tspan className="cg-pinhole-symbol">x</tspan>/
            <tspan className="cg-pinhole-symbol">z</tspan>
          </text>
        </svg>
      </div>
      <figcaption>
        Pinhole projection in the {String.raw`\((z, x)\)`} slice: a ray from{' '}
        {String.raw`\((x, z)\)`} through the pinhole {String.raw`\((0, 0)\)`} hits the sensor at{' '}
        {String.raw`\(z = -1\)`} at {String.raw`\(-x/z\)`}.
      </figcaption>
    </figure>
  );
}

export const POST_COMPONENTS = { PinholeCameraFigure };
