import type { CSSProperties } from 'react';

const POST_IMAGE_ROOT = '/posts/ml-revisit-umm/images';
const CLEAN_CAT = `${POST_IMAGE_ROOT}/cat-clean.avif`;
const NOISY_CAT = `${POST_IMAGE_ROOT}/cat-noisy.avif`;
const PATCHES = [
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: 1, y: 1 },
] as const;

interface ImagePatchProps {
  href: string;
  index: number;
  x: number;
  y: number;
  size: number;
}

function ImagePatch({ href, index, x, y, size }: ImagePatchProps) {
  const sourceSize = href === CLEAN_CAT ? 1280 : 640;
  const patchSize = sourceSize / 2;
  const patch = PATCHES[index];
  if (!patch) throw new Error(`Invalid image patch index: ${index}`);

  return (
    <svg
      x={x}
      y={y}
      width={size}
      height={size}
      viewBox={`${patch.x * patchSize} ${patch.y * patchSize} ${patchSize} ${patchSize}`}
      aria-hidden="true"
    >
      <image href={href} width={sourceSize} height={sourceSize} />
    </svg>
  );
}

function TransfusionDiagram() {
  const inputs: Array<string | null> = [
    'A',
    'cute',
    'cat',
    '.',
    '<BOI>',
    null,
    null,
    null,
    null,
    '<EOI>',
    'What',
    'color',
    'is',
    'its',
    'nose',
  ];
  const outputs: Array<string | null> = [
    'cute',
    'cat',
    '.',
    '<BOI>',
    null,
    null,
    null,
    null,
    null,
    'What',
    'color',
    'is',
    'its',
    'nose',
    '?',
  ];
  const cellWidth = 88;
  const step = 96;
  const left = 20;
  const center = (index: number) => left + index * step + cellWidth / 2;

  return (
    <figure className="transfusion-diagram-shell">
      <svg
        className="transfusion-diagram"
        viewBox="0 0 1476 330"
        role="img"
        aria-labelledby="transfusion-diagram-title transfusion-diagram-description"
      >
        <title id="transfusion-diagram-title">Transfusion model diagram</title>
        <desc id="transfusion-diagram-description">
          A single Transformer predicts text tokens autoregressively and denoises a sequence of four
          image patches.
        </desc>
        <defs>
          <marker
            id="transfusion-arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" className="transfusion-diagram-arrowhead" />
          </marker>
        </defs>
        <rect
          x="10"
          y="124"
          width="1456"
          height="96"
          rx="3"
          className="transfusion-diagram-transformer"
        />
        <text
          x="738"
          y="172"
          textAnchor="middle"
          dominantBaseline="middle"
          className="transfusion-diagram-transformer-label"
        >
          Transformer
        </text>

        {inputs.map((input, index) => {
          const isImagePatch = index >= 5 && index <= 8;
          return (
            <g key={`token-${index}`}>
              <line
                x1={center(index)}
                y1="124"
                x2={center(index)}
                y2="77"
                className="transfusion-diagram-arrow"
              />
              <line
                x1={center(index)}
                y1="271"
                x2={center(index)}
                y2="223"
                className="transfusion-diagram-arrow"
              />
              {isImagePatch ? (
                <>
                  <ImagePatch
                    href={NOISY_CAT}
                    index={index - 5}
                    x={center(index) - 24}
                    y={276}
                    size={48}
                  />
                  <ImagePatch
                    href={CLEAN_CAT}
                    index={index - 5}
                    x={center(index) - 25}
                    y={18}
                    size={50}
                  />
                </>
              ) : (
                <>
                  <text
                    x={center(index)}
                    y="304"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="transfusion-diagram-token-label"
                  >
                    {input}
                  </text>
                  {index !== 4 && (
                    <>
                      <rect
                        x={left + index * step}
                        y="14"
                        width={cellWidth}
                        height="58"
                        rx="2"
                        className="transfusion-diagram-token-box"
                      />
                      <text
                        x={center(index)}
                        y="43"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="transfusion-diagram-token-label"
                      >
                        {outputs[index]}
                      </text>
                    </>
                  )}
                </>
              )}
            </g>
          );
        })}

        <rect
          x={left + 4 * step}
          y="14"
          width={cellWidth}
          height="58"
          rx="2"
          className="transfusion-diagram-blank-box"
        />
        <rect
          x={left + 5 * step - 4}
          y="12"
          width={4 * step}
          height="62"
          rx="2"
          className="transfusion-diagram-image-group"
        />
      </svg>
    </figure>
  );
}

function PatchLabel({ index }: { index: number }) {
  return (
    <span
      className={`attention-mask-patch attention-mask-patch-${index}`}
      role="img"
      aria-label={`noisy image patch ${index + 1}`}
    />
  );
}

function AttentionMask({ width = 'min(100%, 32rem)' }: { width?: string }) {
  const tokens: Array<string | number> = ['A', 'cute', 'cat', '<BOI>', 0, 1, 2, 3, '<EOI>', 'What'];
  const label = (token: string | number) =>
    typeof token === 'number' ? <PatchLabel index={token} /> : token;
  const isAllowed = (row: number, column: number) => {
    if (row < 4) return column <= row;
    if (row < 8) return column < 8;
    return column <= row;
  };
  const style = {
    '--attention-mask-width': width,
    '--attention-mask-image': `url("${NOISY_CAT}")`,
  } as CSSProperties;

  return (
    <figure className="attention-mask-shell" style={style}>
      <table className="attention-mask-table">
        <caption className="post-visually-hidden">
          Transfusion causal and bidirectional attention mask
        </caption>
        <thead>
          <tr>
            <td aria-hidden="true" />
            {tokens.map((token, index) => (
              <th scope="col" key={`column-${index}`}>
                {label(token)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tokens.map((token, row) => (
            <tr key={`row-${row}`}>
              <th scope="row">{label(token)}</th>
              {tokens.map((_, column) => {
                const allowed = isAllowed(row, column);
                return (
                  <td
                    className={allowed ? 'attention-allowed' : 'attention-masked'}
                    key={`cell-${column}`}
                  >
                    <span className="post-visually-hidden">{allowed ? 'Allowed' : 'Masked'}</span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

export const POST_COMPONENTS = {
  AttentionMask,
  TransfusionDiagram,
};
