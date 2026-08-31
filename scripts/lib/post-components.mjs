import { createElement as h } from 'react';

const CLEAN_CAT = '/posts/transfusion/images/cat-clean.avif';
const NOISY_CAT = '/posts/transfusion/images/cat-noisy.avif';
const PATCHES = [
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: 1, y: 1 },
];

function ImagePatch({ href, index, x, y, size }) {
  const sourceSize = href === CLEAN_CAT ? 1280 : 640;
  const patchSize = sourceSize / 2;
  const patch = PATCHES[index];
  return h(
    'svg',
    {
      x,
      y,
      width: size,
      height: size,
      viewBox: `${patch.x * patchSize} ${patch.y * patchSize} ${patchSize} ${patchSize}`,
      'aria-hidden': 'true',
    },
    h('image', { href, width: sourceSize, height: sourceSize }),
  );
}

function TransfusionDiagram() {
  const inputs = [
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
  const outputs = [
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
  const center = (index) => left + index * step + cellWidth / 2;

  const children = [
    h('title', { id: 'transfusion-diagram-title', key: 'title' }, 'Transfusion model diagram'),
    h(
      'desc',
      { id: 'transfusion-diagram-description', key: 'description' },
      'A single Transformer predicts text tokens autoregressively and denoises a sequence of four image patches.',
    ),
    h(
      'defs',
      { key: 'defs' },
      h(
        'marker',
        {
          id: 'transfusion-arrow',
          viewBox: '0 0 10 10',
          refX: 8,
          refY: 5,
          markerWidth: 7,
          markerHeight: 7,
          orient: 'auto-start-reverse',
        },
        h('path', { d: 'M 0 0 L 10 5 L 0 10 z', className: 'transfusion-diagram-arrowhead' }),
      ),
    ),
    h('rect', {
      key: 'transformer',
      x: 10,
      y: 124,
      width: 1456,
      height: 96,
      rx: 3,
      className: 'transfusion-diagram-transformer',
    }),
    h(
      'text',
      {
        key: 'transformer-label',
        x: 738,
        y: 172,
        textAnchor: 'middle',
        dominantBaseline: 'middle',
        className: 'transfusion-diagram-transformer-label',
      },
      'Transformer',
    ),
  ];

  for (let index = 0; index < inputs.length; index += 1) {
    children.push(
      h('line', {
        key: `output-arrow-${index}`,
        x1: center(index),
        y1: 124,
        x2: center(index),
        y2: 77,
        className: 'transfusion-diagram-arrow',
      }),
      h('line', {
        key: `input-arrow-${index}`,
        x1: center(index),
        y1: 271,
        x2: center(index),
        y2: 223,
        className: 'transfusion-diagram-arrow',
      }),
    );

    if (index >= 5 && index <= 8) {
      children.push(
        h(ImagePatch, {
          key: `input-patch-${index}`,
          href: NOISY_CAT,
          index: index - 5,
          x: center(index) - 24,
          y: 276,
          size: 48,
        }),
        h(ImagePatch, {
          key: `output-patch-${index}`,
          href: CLEAN_CAT,
          index: index - 5,
          x: center(index) - 25,
          y: 18,
          size: 50,
        }),
      );
    } else {
      children.push(
        h(
          'text',
          {
            key: `input-${index}`,
            x: center(index),
            y: 304,
            textAnchor: 'middle',
            dominantBaseline: 'middle',
            className: 'transfusion-diagram-token-label',
          },
          inputs[index],
        ),
      );

      if (index !== 4) {
        children.push(
          h('rect', {
            key: `output-box-${index}`,
            x: left + index * step,
            y: 14,
            width: cellWidth,
            height: 58,
            rx: 2,
            className: 'transfusion-diagram-token-box',
          }),
          h(
            'text',
            {
              key: `output-${index}`,
              x: center(index),
              y: 43,
              textAnchor: 'middle',
              dominantBaseline: 'middle',
              className: 'transfusion-diagram-token-label',
            },
            outputs[index],
          ),
        );
      }
    }
  }

  children.push(
    h('rect', {
      key: 'blank-output',
      x: left + 4 * step,
      y: 14,
      width: cellWidth,
      height: 58,
      rx: 2,
      className: 'transfusion-diagram-blank-box',
    }),
    h('rect', {
      key: 'image-output-group',
      x: left + 5 * step - 4,
      y: 12,
      width: 4 * step,
      height: 62,
      rx: 2,
      className: 'transfusion-diagram-image-group',
    }),
  );

  return h(
    'figure',
    { className: 'transfusion-diagram-shell' },
    h(
      'svg',
      {
        className: 'transfusion-diagram',
        viewBox: '0 0 1476 330',
        role: 'img',
        'aria-labelledby': 'transfusion-diagram-title transfusion-diagram-description',
      },
      children,
    ),
  );
}

function PatchLabel({ index }) {
  return h('span', {
    className: `attention-mask-patch attention-mask-patch-${index}`,
    role: 'img',
    'aria-label': `noisy image patch ${index + 1}`,
  });
}

function AttentionMask({ width = '100%' }) {
  const tokens = ['A', 'cute', 'cat', '<BOI>', 0, 1, 2, 3, '<EOI>', 'What'];
  const isPatch = (token) => typeof token === 'number';
  const label = (token) => (isPatch(token) ? h(PatchLabel, { index: token }) : token);
  const isAllowed = (row, column) => {
    if (row < 4) return column <= row;
    if (row < 8) return column < 8;
    return column <= row;
  };

  return h(
    'figure',
    { className: 'attention-mask-shell', style: { '--attention-mask-width': width } },
    h(
      'table',
      { className: 'attention-mask-table' },
      h(
        'caption',
        { className: 'post-visually-hidden' },
        'Transfusion causal and bidirectional attention mask',
      ),
      h(
        'thead',
        null,
        h(
          'tr',
          null,
          h('td', { 'aria-hidden': 'true' }),
          ...tokens.map((token, index) =>
            h('th', { scope: 'col', key: `column-${index}` }, label(token)),
          ),
        ),
      ),
      h(
        'tbody',
        null,
        ...tokens.map((token, row) =>
          h(
            'tr',
            { key: `row-${row}` },
            h('th', { scope: 'row' }, label(token)),
            ...tokens.map((_, column) => {
              const allowed = isAllowed(row, column);
              return h(
                'td',
                {
                  className: allowed ? 'attention-allowed' : 'attention-masked',
                  key: `cell-${column}`,
                },
                h('span', { className: 'post-visually-hidden' }, allowed ? 'Allowed' : 'Masked'),
              );
            }),
          ),
        ),
      ),
    ),
  );
}

export const POST_COMPONENTS = {
  AttentionMask,
  TransfusionDiagram,
};
