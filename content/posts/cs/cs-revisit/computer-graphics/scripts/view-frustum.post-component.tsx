type Vec3 = readonly [number, number, number];
type Pt = readonly [number, number];

const ox = 128;
const oy = 138;

// Oblique 3D projection: +z goes right (optical axis), +y goes up, +x goes down-left.
const xProjX = -0.48;
const xProjY = 0.32;

const fmt = (n: number) => n.toFixed(1);
const toSvg = ([x, y, z]: Vec3): Pt => [ox + z + xProjX * x, oy - y + xProjY * x];
const line = (a: Pt, b: Pt) => `M${fmt(a[0])} ${fmt(a[1])}L${fmt(b[0])} ${fmt(b[1])}`;
const polygonPoints = (pts: readonly Pt[]) => pts.map((p) => `${fmt(p[0])},${fmt(p[1])}`).join(' ');

// Frustum geometry from the pinhole at (0, 0, 0).
const zNear = 185;
const zFar = 355;
const zRayEnd = 390;
const tanX = 0.185;
const tanY = 0.215;

interface PlaneCorners {
  readonly frontTop: Pt;
  readonly backTop: Pt;
  readonly backBot: Pt;
  readonly frontBot: Pt;
  readonly center: Pt;
}

const makePlane = (z: number): PlaneCorners => {
  const w = z * tanX;
  const h = z * tanY;
  return {
    frontTop: toSvg([w, h, z]),
    backTop: toSvg([-w, h, z]),
    backBot: toSvg([-w, -h, z]),
    frontBot: toSvg([w, -h, z]),
    center: toSvg([0, 0, z]),
  };
};

const origin = toSvg([0, 0, 0]);
const near = makePlane(zNear);
const far = makePlane(zFar);
const rayEnd = makePlane(zRayEnd);

// Coordinate axes at the pinhole.
const xAxisLen = 92;
const xAxisNorm = Math.hypot(xProjX, xProjY);
const xAxisEnd: Pt = [
  origin[0] + (xAxisLen * xProjX) / xAxisNorm,
  origin[1] + (xAxisLen * xProjY) / xAxisNorm,
];
const yAxisStart: Pt = [ox, 212];
const yAxisEnd: Pt = [ox, 26];
const zAxisStart: Pt = [52, oy];
const zAxisEnd: Pt = [568, oy];

// Half-FOV angle arc between the optical axis and the bottom-front ray.
const fovRadius = 66;
const fovAngle = Math.atan2(rayEnd.frontBot[1] - origin[1], rayEnd.frontBot[0] - origin[0]);
const fovArcStart: Pt = [origin[0] + fovRadius, origin[1]];
const fovArcEnd: Pt = [
  origin[0] + fovRadius * Math.cos(fovAngle),
  origin[1] + fovRadius * Math.sin(fovAngle),
];
const fovArcPath = `M${fmt(fovArcStart[0])} ${fmt(fovArcStart[1])}A${fovRadius} ${fovRadius} 0 0 1 ${fmt(fovArcEnd[0])} ${fmt(fovArcEnd[1])}`;
const fovLabelPos: Pt = [
  origin[0] + (fovRadius + 13) * Math.cos(fovAngle * 0.52),
  origin[1] + (fovRadius + 13) * Math.sin(fovAngle * 0.52) + 4,
];

function ViewFrustumFigure() {
  return (
    <figure className="cg-frustum">
      <div
        className="cg-frustum-scroll"
        tabIndex={0}
        role="region"
        aria-label="View frustum geometry diagram; scroll horizontally"
      >
        <svg
          viewBox="0 0 600 276"
          width={600}
          height={276}
          role="img"
          aria-labelledby="cg-frustum-title cg-frustum-desc"
        >
          <title id="cg-frustum-title">Perspective view frustum from the pinhole origin</title>
          <desc id="cg-frustum-desc">
            Four corner rays from the pinhole at (0, 0, 0) expand along the positive z-axis and
            intersect the near and far clipping planes at z_near and z_far. The truncated pyramid
            between those planes defines the visible region, with half-angle theta from the optical
            axis.
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

          {/* Coordinate axes at the pinhole */}
          <path
            d={line(yAxisStart, yAxisEnd)}
            className="cg-frustum-axis"
            markerEnd="url(#cg-frustum-axis-arrow)"
          />
          <path d={line(zAxisStart, origin)} className="cg-frustum-axis" />
          <path d={line(origin, far.center)} className="cg-frustum-axis-inner" />
          <path
            d={line(far.center, zAxisEnd)}
            className="cg-frustum-axis"
            markerEnd="url(#cg-frustum-axis-arrow)"
          />
          <path
            d={line(origin, xAxisEnd)}
            className="cg-frustum-axis"
            markerEnd="url(#cg-frustum-axis-arrow)"
          />

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

          {/* Half-FOV angle arc */}
          <path d={fovArcPath} className="cg-frustum-angle-arc" />
          <text x={fovLabelPos[0]} y={fovLabelPos[1]} className="cg-frustum-angle-label">
            θ
          </text>

          {/* Key points */}
          <circle cx={origin[0]} cy={origin[1]} r="4" className="cg-frustum-origin" />
          <circle cx={near.center[0]} cy={near.center[1]} r="3" className="cg-frustum-center-dot" />
          <circle cx={far.center[0]} cy={far.center[1]} r="3" className="cg-frustum-center-dot" />

          {/* Axis and point labels */}
          <text x={yAxisEnd[0] + 10} y={yAxisEnd[1] + 6} className="cg-frustum-symbol">
            y
          </text>
          <text
            x={zAxisEnd[0] - 4}
            y={zAxisEnd[1] - 11}
            textAnchor="end"
            className="cg-frustum-symbol"
          >
            z
          </text>
          <text x={xAxisEnd[0] - 12} y={xAxisEnd[1] + 10} className="cg-frustum-symbol">
            x
          </text>
          <text x={origin[0] - 10} y={origin[1] - 14} textAnchor="end" className="cg-frustum-label">
            Pinhole (0, 0, 0)
          </text>

          <text
            x={near.frontBot[0] - 4}
            y={near.frontBot[1] + 22}
            textAnchor="middle"
            className="cg-frustum-plane-label"
          >
            <tspan className="cg-frustum-symbol">z</tspan>
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
            <tspan className="cg-frustum-symbol">z</tspan>
            <tspan dy="3.5" className="cg-frustum-sub">
              far
            </tspan>
          </text>
        </svg>
      </div>
      <figcaption>
        Perspective view frustum: rays from the pinhole {String.raw`\((0, 0, 0)\)`} with half-angle{' '}
        {String.raw`\(\theta\)`} clip against the near plane {String.raw`\(z_{\mathrm{near}}\)`} and
        far plane {String.raw`\(z_{\mathrm{far}}\)`}, bounding the visible volume.
      </figcaption>
    </figure>
  );
}

export const POST_COMPONENTS = { ViewFrustumFigure };
