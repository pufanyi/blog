import {
  buildVectorScene,
  DEFAULT_TILT_DEG,
  fmt,
  type ShadingMode,
  VIEW_HEIGHT,
  VIEW_WIDTH,
} from './shading-rasterizer';

const MODES: readonly ShadingMode[] = ['flat', 'smooth', 'perspective'];

export function enhancePost(container: HTMLElement): () => void {
  const cleanups: (() => void)[] = [];

  for (const root of container.querySelectorAll<HTMLElement>('[data-shading-comparison]')) {
    const controls = root.querySelector<HTMLElement>('.cg-shade-controls');
    const tiltInput = root.querySelector<HTMLInputElement>('[data-shade-tilt]');
    const tiltOut = root.querySelector<HTMLOutputElement>('[data-shade-tilt-out]');
    const meta = root.querySelector<HTMLElement>('[data-shade-meta]');
    const wireToggle = root.querySelector<HTMLInputElement>('[data-shade-wire-toggle]');
    if (!controls || !tiltInput || !tiltOut || !wireToggle) continue;

    const svgs = new Map<ShadingMode, SVGSVGElement>();
    for (const mode of MODES) {
      const svg = root.querySelector<SVGSVGElement>(`[data-shade-svg="${mode}"]`);
      if (svg) svgs.set(mode, svg);
    }
    if (svgs.size !== MODES.length) continue;

    const events = new AbortController();

    function render(tiltDeg: number) {
      const showWire = wireToggle?.checked ?? true;
      let zNear = 1;
      let zFar = 1;

      for (const mode of MODES) {
        const svg = svgs.get(mode);
        if (!svg) continue;
        const scene = buildVectorScene(mode, tiltDeg, VIEW_WIDTH, VIEW_HEIGHT);
        zNear = scene.zNear;
        zFar = scene.zFar;

        const polygons = svg.querySelectorAll<SVGPolygonElement>('[data-shade-tiles] polygon');
        scene.tiles.forEach((tile, idx) => {
          polygons[idx]?.setAttribute('points', tile.points);
        });

        const ring = svg.querySelector<SVGPathElement>('[data-shade-ring]');
        if (ring && scene.ringPath) {
          ring.setAttribute('d', scene.ringPath);
        }

        const wire = svg.querySelector<SVGGElement>('[data-shade-wire]');
        if (wire) {
          wire.style.display = showWire ? '' : 'none';
        }
        svg.querySelector('[data-shade-outline]')?.setAttribute('points', scene.outline);
        const diag = svg.querySelector('[data-shade-diag]');
        if (diag) {
          const [d0, d1] = scene.diag;
          diag.setAttribute('x1', fmt(d0.x));
          diag.setAttribute('y1', fmt(d0.y));
          diag.setAttribute('x2', fmt(d1.x));
          diag.setAttribute('y2', fmt(d1.y));
        }
      }

      const ratio = (zFar / zNear).toFixed(2);
      if (tiltOut) {
        tiltOut.textContent = tiltDeg === 0 ? '0° (等深)' : `${tiltDeg}° (${ratio}×)`;
      }
      if (meta) {
        meta.textContent =
          tiltDeg === 0
            ? '倾斜角 0° · 所有顶点等深 (z_far / z_near = 1.00×) · 2 个三角形'
            : `倾斜角 ${tiltDeg}° · 深度比 z_far / z_near ≈ ${ratio}× · 2 个三角形`;
      }
    }

    const opts = { signal: events.signal };

    tiltInput.addEventListener(
      'input',
      () => {
        render(Number(tiltInput.value));
      },
      opts,
    );

    wireToggle.addEventListener(
      'change',
      () => {
        render(Number(tiltInput.value));
      },
      opts,
    );

    controls.hidden = false;
    render(DEFAULT_TILT_DEG);
    root.dataset['shadeReady'] = 'true';

    cleanups.push(() => {
      events.abort();
    });
  }

  return () => {
    for (const cleanup of cleanups) cleanup();
  };
}
