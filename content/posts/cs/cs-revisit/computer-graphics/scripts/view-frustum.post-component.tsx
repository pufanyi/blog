type Vec3 = readonly [number, number, number];
type Pt = readonly [number, number];

const ox = 220;
const oy = 144;

// Right-handed oblique 3D projection:
// +x goes down-left (camera right, toward viewer), +y goes up,
// +z goes left (behind the pinhole), so the camera looks down -z (to the right).
const xProjX = -0.48;
const xProjY = 0.32;

const fmt = (n: number) => n.toFixed(1);
const toSvg = ([x, y, z]: Vec3): Pt => [ox - z + xProjX * x, oy - y + xProjY * x];
const line = (a: Pt, b: Pt) => `M${fmt(a[0])} ${fmt(a[1])}L${fmt(b[0])} ${fmt(b[1])}`;
const polygonPoints = (pts: readonly Pt[]) => pts.map((p) => `${fmt(p[0])},${fmt(p[1])}`).join(' ');

// Pinhole sensor (+z) and view frustum (-z) geometry centered at (0, 0, 0).
const dSensor = 115;
const dNear = 150;
const dFar = 310;
const dRayEnd = 345;
const tanX = 0.21;
const tanY = 0.23;

interface PlaneCorners {
  readonly frontTop: Pt;
  readonly backTop: Pt;
  readonly backBot: Pt;
  readonly frontBot: Pt;
  readonly center: Pt;
}

const makePlane = (z: number): PlaneCorners => {
  const dist = Math.abs(z);
  const w = dist * tanX;
  const h = dist * tanY;
  return {
    frontTop: toSvg([w, h, z]),
    backTop: toSvg([-w, h, z]),
    backBot: toSvg([-w, -h, z]),
    frontBot: toSvg([w, -h, z]),
    center: toSvg([0, 0, z]),
  };
};

const origin = toSvg([0, 0, 0]);
const sensor = makePlane(dSensor);
const near = makePlane(-dNear);
const far = makePlane(-dFar);
const rayEnd = makePlane(-dRayEnd);

// Sample scene point inside the frustum and its inverted projection onto the sensor.
const dSample = 245;
const ySample = 28;
const samplePoint = toSvg([0, ySample, -dSample]);
const sampleAxis = toSvg([0, 0, -dSample]);
const sampleHit = toSvg([0, (-ySample * dSensor) / dSample, dSensor]);

// Right-angle bracket at sampleAxis showing perpendicular depth along -z.
const rightAngleSize = 6;
const rightAnglePath = `M${fmt(sampleAxis[0] - rightAngleSize)} ${fmt(sampleAxis[1])}L${fmt(
  sampleAxis[0] - rightAngleSize,
)} ${fmt(sampleAxis[1] - rightAngleSize)}L${fmt(sampleAxis[0])} ${fmt(
  sampleAxis[1] - rightAngleSize,
)}`;

// Right-handed coordinate axes at the pinhole.
const xAxisLen = 82;
const xAxisNorm = Math.hypot(xProjX, xProjY);
const xAxisEnd: Pt = [
  origin[0] + (xAxisLen * xProjX) / xAxisNorm,
  origin[1] + (xAxisLen * xProjY) / xAxisNorm,
];
const yAxisEnd: Pt = [ox, 24];
const zAxisEnd: Pt = [46, oy];
const negZAxisEnd: Pt = [596, oy];

function ViewFrustumFigure() {
  return (
    <figure className="cg-frustum">
      <div
        className="cg-frustum-scroll"
        tabIndex={0}
        role="region"
        aria-label="Pinhole camera and view frustum geometry diagram; scroll horizontally"
      >
        <svg
          viewBox="0 0 640 280"
          width={640}
          height={280}
          role="img"
          aria-labelledby="cg-frustum-title cg-frustum-desc"
        >
          <title id="cg-frustum-title">
            Pinhole camera and perspective view frustum in right-handed camera space
          </title>
          <desc id="cg-frustum-desc">
            Right-handed coordinate axes at the pinhole origin (0, 0, 0) with +x down-left, +y up,
            and +z left behind the pinhole so the camera looks down -z. Four corner rays connect the
            sensor plane on the +z side through the pinhole to the view frustum on the -z side,
            clipped between the near plane -z_near and far plane -z_far. A ray from scene point P
            passes through (0, 0, 0) to the inverted point P prime on the sensor, with a
            perpendicular drop from P to the optical axis showing planar depth.
          </desc>
          <defs>
            <marker
              id="cg-frustum-axis-arrow"
              viewBox="0 0 10 10"
              refX="8.5"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M0 1L10 5L0 9Z" className="cg-frustum-axis-arrow" />
            </marker>
            <marker
              id="cg-frustum-ray-arrow"
              viewBox="0 0 10 10"
              refX="8.5"
              refY="5"
              markerWidth="5.5"
              markerHeight="5.5"
              orient="auto"
            >
              <path d="M0 1.2L10 5L0 8.8Z" className="cg-frustum-ray-arrow" />
            </marker>
          </defs>

          {/* Sensor plane behind the pinhole (+z) */}
          <polygon
            points={polygonPoints([
              sensor.frontTop,
              sensor.backTop,
              sensor.backBot,
              sensor.frontBot,
            ])}
            className="cg-frustum-sensor"
          />
          <path
            d={`M${polygonPoints([sensor.frontTop, sensor.backTop, sensor.backBot, sensor.frontBot]).replaceAll(' ', 'L')}Z`}
            className="cg-frustum-sensor-edge"
          />

          {/* Sensor-to-pinhole corner rays */}
          <path d={line(sensor.backBot, origin)} className="cg-frustum-ray-occluded" />
          <path d={line(sensor.backTop, origin)} className="cg-frustum-ray" />
          <path d={line(sensor.frontTop, origin)} className="cg-frustum-ray" />
          <path d={line(sensor.frontBot, origin)} className="cg-frustum-ray" />

          {/* Optical axis (+z left, -z right) */}
          <path d={line(origin, sensor.center)} className="cg-frustum-axis-inner" />
          <path
            d={line(sensor.center, zAxisEnd)}
            className="cg-frustum-axis"
            markerEnd="url(#cg-frustum-axis-arrow)"
          />
          <path d={line(origin, far.center)} className="cg-frustum-axis-inner" />
          <path d={line(far.center, negZAxisEnd)} className="cg-frustum-axis-neg" />

          {/* Pre-frustum segments of the four corner rays */}
          <path d={line(origin, near.backTop)} className="cg-frustum-ray" />
          <path d={line(origin, near.frontTop)} className="cg-frustum-ray" />
          <path d={line(origin, near.backBot)} className="cg-frustum-ray" />
          <path d={line(origin, near.frontBot)} className="cg-frustum-ray" />

          {/* Far clipping plane */}
          <polygon
            points={polygonPoints([far.frontTop, far.backTop, far.backBot, far.frontBot])}
            className="cg-frustum-plane"
          />
          <path d={line(far.backTop, far.backBot)} className="cg-frustum-plane-edge-hidden" />
          <path d={line(far.frontBot, far.backBot)} className="cg-frustum-plane-edge-hidden" />
          <path d={line(far.frontTop, far.backTop)} className="cg-frustum-plane-edge" />
          <path d={line(far.frontTop, far.frontBot)} className="cg-frustum-plane-edge" />

          {/* Visible frustum side faces and occluded back-bottom edge */}
          <polygon
            points={polygonPoints([near.backTop, far.backTop, far.frontTop, near.frontTop])}
            className="cg-frustum-face-top"
          />
          <polygon
            points={polygonPoints([near.frontTop, far.frontTop, far.frontBot, near.frontBot])}
            className="cg-frustum-face-front"
          />
          <path d={line(near.backBot, far.backBot)} className="cg-frustum-ray-hidden" />
          <path d={line(near.backTop, far.backTop)} className="cg-frustum-ray-volume" />
          <path d={line(near.frontTop, far.frontTop)} className="cg-frustum-ray-volume" />
          <path d={line(near.frontBot, far.frontBot)} className="cg-frustum-ray-volume" />

          {/* Ray extensions past the far plane */}
          <path
            d={line(far.backTop, rayEnd.backTop)}
            className="cg-frustum-ray"
            markerEnd="url(#cg-frustum-ray-arrow)"
          />
          <path
            d={line(far.frontTop, rayEnd.frontTop)}
            className="cg-frustum-ray"
            markerEnd="url(#cg-frustum-ray-arrow)"
          />
          <path
            d={line(far.backBot, rayEnd.backBot)}
            className="cg-frustum-ray"
            markerEnd="url(#cg-frustum-ray-arrow)"
          />
          <path
            d={line(far.frontBot, rayEnd.frontBot)}
            className="cg-frustum-ray"
            markerEnd="url(#cg-frustum-ray-arrow)"
          />

          {/* Near clipping plane */}
          <polygon
            points={polygonPoints([near.frontTop, near.backTop, near.backBot, near.frontBot])}
            className="cg-frustum-plane"
          />
          <path
            d={`M${polygonPoints([near.frontTop, near.backTop, near.backBot, near.frontBot]).replaceAll(' ', 'L')}Z`}
            className="cg-frustum-plane-edge"
          />

          {/* Pinhole projection ray and planar depth drop */}
          <path d={line(samplePoint, sampleAxis)} className="cg-frustum-sample-drop" />
          <path d={rightAnglePath} className="cg-frustum-sample-angle" />
          <path d={line(sensor.center, sampleHit)} className="cg-frustum-sample-drop" />
          <path d={line(sampleHit, samplePoint)} className="cg-frustum-sample-ray" />

          {/* Remaining coordinate axes at the pinhole (+y, +x) */}
          <path
            d={line(origin, yAxisEnd)}
            className="cg-frustum-axis"
            markerEnd="url(#cg-frustum-axis-arrow)"
          />
          <path
            d={line(origin, xAxisEnd)}
            className="cg-frustum-axis"
            markerEnd="url(#cg-frustum-axis-arrow)"
          />

          {/* Key points */}
          <circle cx={origin[0]} cy={origin[1]} r="4" className="cg-frustum-origin" />
          <circle
            cx={sensor.center[0]}
            cy={sensor.center[1]}
            r="2.8"
            className="cg-frustum-sensor-dot"
          />
          <circle
            cx={near.center[0]}
            cy={near.center[1]}
            r="2.8"
            className="cg-frustum-center-dot"
          />
          <circle cx={far.center[0]} cy={far.center[1]} r="2.8" className="cg-frustum-center-dot" />
          <circle
            cx={samplePoint[0]}
            cy={samplePoint[1]}
            r="3.6"
            className="cg-frustum-sample-dot"
          />
          <circle cx={sampleHit[0]} cy={sampleHit[1]} r="3.6" className="cg-frustum-sample-dot" />

          {/* Axis, plane, and point labels */}
          <text x={yAxisEnd[0] + 10} y={yAxisEnd[1] + 6} className="cg-frustum-symbol">
            y
          </text>
          <text x={zAxisEnd[0] - 6} y={zAxisEnd[1] - 11} className="cg-frustum-symbol">
            z
          </text>
          <text x={negZAxisEnd[0] + 6} y={negZAxisEnd[1] + 5} className="cg-frustum-axis-label">
            −<tspan className="cg-frustum-symbol">z</tspan>
          </text>
          <text x={xAxisEnd[0] - 12} y={xAxisEnd[1] + 10} className="cg-frustum-symbol">
            x
          </text>

          <text x={sensor.center[0]} y={94} textAnchor="middle" className="cg-frustum-sensor-label">
            Sensor
          </text>
          <text
            x={origin[0] + 16}
            y={origin[1] + 34}
            textAnchor="middle"
            className="cg-frustum-label"
          >
            Pinhole (0, 0, 0)
          </text>

          <text x={samplePoint[0] + 8} y={samplePoint[1] - 6} className="cg-frustum-sample-label">
            P
          </text>
          <text x={86} y={sampleHit[1] + 5} textAnchor="end" className="cg-frustum-sample-label">
            P′
          </text>

          <text
            x={near.frontBot[0]}
            y={near.frontBot[1] + 22}
            textAnchor="middle"
            className="cg-frustum-plane-label"
          >
            −<tspan className="cg-frustum-symbol">z</tspan>
            <tspan dy="3.5" className="cg-frustum-sub">
              near
            </tspan>
          </text>
          <text
            x={far.frontBot[0]}
            y={far.frontBot[1] + 22}
            textAnchor="middle"
            className="cg-frustum-plane-label"
          >
            −<tspan className="cg-frustum-symbol">z</tspan>
            <tspan dy="3.5" className="cg-frustum-sub">
              far
            </tspan>
          </text>
        </svg>
      </div>
      <figcaption>
        Pinhole camera and view frustum in right-handed camera space (looking along{' '}
        {String.raw`\(-z\)`}): a ray from {String.raw`\(P\)`} passes through the pinhole{' '}
        {String.raw`\((0, 0, 0)\)`} onto the inverted sensor at {String.raw`\(P'\)`}, with planar
        depth measured along {String.raw`\(-z\)`}. Corner rays from the sensor bound the visible
        frustum between {String.raw`\(-z_{\mathrm{near}}\)`} and {String.raw`\(-z_{\mathrm{far}}\)`}
        .
      </figcaption>
    </figure>
  );
}

export const POST_COMPONENTS = { ViewFrustumFigure };
