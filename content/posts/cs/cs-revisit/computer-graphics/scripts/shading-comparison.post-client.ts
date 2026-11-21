import {
  DEFAULT_TILT_DEG,
  projectTiltedQuad,
  RASTER_HEIGHT,
  RASTER_WIDTH,
  rasterizeQuad,
  type ShadingMode,
} from './shading-rasterizer';

const MODES: readonly ShadingMode[] = ['flat', 'smooth', 'perspective'];

function fmt(n: number): string {
  return n.toFixed(1);
}

export function enhancePost(container: HTMLElement): () => void {
  const cleanups: (() => void)[] = [];

  for (const root of container.querySelectorAll<HTMLElement>('[data-shading-comparison]')) {
    const controls = root.querySelector<HTMLElement>('.cg-shade-controls');
    const tiltInput = root.querySelector<HTMLInputElement>('[data-shade-tilt]');
    const tiltOut = root.querySelector<HTMLOutputElement>('[data-shade-tilt-out]');
    const meta = root.querySelector<HTMLElement>('[data-shade-meta]');
    const wireToggle = root.querySelector<HTMLInputElement>('[data-shade-wire-toggle]');
    if (!controls || !tiltInput || !tiltOut || !wireToggle) continue;

    const canvases = new Map<ShadingMode, HTMLCanvasElement>();
    const images = new Map<ShadingMode, HTMLImageElement>();
    for (const mode of MODES) {
      const canvas = root.querySelector<HTMLCanvasElement>(`[data-shade-canvas="${mode}"]`);
      const img = root.querySelector<HTMLImageElement>(`[data-shade-img="${mode}"]`);
      if (canvas && img) {
        canvases.set(mode, canvas);
        images.set(mode, img);
      }
    }
    if (canvases.size !== MODES.length) continue;

    const wireSvgs = Array.from(root.querySelectorAll<SVGSVGElement>('[data-shade-wire]'));
    const events = new AbortController();
    let canvasesActivated = false;

    function updateWireframe(tiltDeg: number) {
      const { corners, zNear, zFar } = projectTiltedQuad(tiltDeg, RASTER_WIDTH, RASTER_HEIGHT);
      const [bl, br, tr, tl] = corners;
      const outlinePoints = [bl, br, tr, tl].map((p) => `${fmt(p.x)},${fmt(p.y)}`).join(' ');
      const showWire = wireToggle?.checked ?? true;

      for (const svg of wireSvgs) {
        svg.style.display = showWire ? '' : 'none';
        svg.querySelector('[data-shade-outline]')?.setAttribute('points', outlinePoints);
        const diag = svg.querySelector('[data-shade-diag]');
        if (diag) {
          diag.setAttribute('x1', fmt(bl.x));
          diag.setAttribute('y1', fmt(bl.y));
          diag.setAttribute('x2', fmt(tr.x));
          diag.setAttribute('y2', fmt(tr.y));
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

    function renderCanvases(tiltDeg: number) {
      if (!canvasesActivated) {
        for (const mode of MODES) {
          const img = images.get(mode);
          const canvas = canvases.get(mode);
          if (img && canvas) {
            img.hidden = true;
            canvas.hidden = false;
          }
        }
        canvasesActivated = true;
      }

      for (const mode of MODES) {
        const canvas = canvases.get(mode);
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) continue;
        const pixels = rasterizeQuad(mode, tiltDeg, RASTER_WIDTH, RASTER_HEIGHT);
        const imageData = ctx.createImageData(RASTER_WIDTH, RASTER_HEIGHT);
        imageData.data.set(pixels);
        ctx.putImageData(imageData, 0, 0);
      }
    }

    const opts = { signal: events.signal };

    tiltInput.addEventListener(
      'input',
      () => {
        const tiltDeg = Number(tiltInput.value);
        updateWireframe(tiltDeg);
        renderCanvases(tiltDeg);
      },
      opts,
    );

    wireToggle.addEventListener(
      'change',
      () => {
        updateWireframe(Number(tiltInput.value));
      },
      opts,
    );

    controls.hidden = false;
    updateWireframe(DEFAULT_TILT_DEG);
    root.dataset['shadeReady'] = 'true';

    cleanups.push(() => {
      events.abort();
    });
  }

  return () => {
    for (const cleanup of cleanups) cleanup();
  };
}
