import type { ReactNode } from 'react';

function InlineMath({ children }: { children: string }) {
  return <span className="math-inline">{`\\(${children}\\)`}</span>;
}

interface AlgorithmLine {
  id: string;
  depth: 0 | 1 | 2;
  content: ReactNode;
  update?: boolean;
}

const FORWARD_LINES: AlgorithmLine[] = [
  {
    id: 'queries',
    depth: 0,
    content: (
      <>
        <b>parallel for</b> each query tile <InlineMath>{String.raw`Q_i`}</InlineMath> <b>do</b>
      </>
    ),
  },
  {
    id: 'load-query',
    depth: 1,
    content: (
      <>
        <b>load</b> <InlineMath>{String.raw`Q_i`}</InlineMath>
      </>
    ),
  },
  {
    id: 'initialize',
    depth: 1,
    content: (
      <>
        <InlineMath>{String.raw`m \leftarrow -\infty,`}</InlineMath>
        <InlineMath>{String.raw`\ell \leftarrow 0,`}</InlineMath>
        <InlineMath>{String.raw`U \leftarrow 0`}</InlineMath>
      </>
    ),
  },
  {
    id: 'keys',
    depth: 1,
    content: (
      <>
        <b>for</b> each KV tile <InlineMath>{String.raw`K_j,V_j`}</InlineMath> <b>do</b>
      </>
    ),
  },
  {
    id: 'load-kv',
    depth: 2,
    content: (
      <>
        <b>load</b> <InlineMath>{String.raw`K_j,V_j`}</InlineMath>
      </>
    ),
  },
  {
    id: 'scores',
    depth: 2,
    content: (
      <>
        <InlineMath>{String.raw`S \leftarrow`}</InlineMath>
        <InlineMath>{String.raw`Q_iK_j^\top / \sqrt d`}</InlineMath>
      </>
    ),
  },
  {
    id: 'mask',
    depth: 2,
    content: (
      <>
        <b>mask</b> <InlineMath>{String.raw`S`}</InlineMath>
        <span className="flash-algorithm-note">全被 mask 的行跳过本轮更新</span>
      </>
    ),
  },
  {
    id: 'maximum',
    depth: 2,
    content: (
      <>
        <InlineMath>{String.raw`m' \leftarrow`}</InlineMath>
        <InlineMath>{String.raw`\max\!\left(m,\operatorname{rowmax}(S)\right)`}</InlineMath>
      </>
    ),
  },
  {
    id: 'rescale',
    depth: 2,
    update: true,
    content: (
      <>
        <InlineMath>{String.raw`\alpha \leftarrow`}</InlineMath>
        <InlineMath>{String.raw`\exp(m-m')`}</InlineMath>
      </>
    ),
  },
  {
    id: 'weights',
    depth: 2,
    content: (
      <>
        <InlineMath>{String.raw`W \leftarrow`}</InlineMath>
        <InlineMath>{String.raw`\exp(S-m')`}</InlineMath>
      </>
    ),
  },
  {
    id: 'denominator',
    depth: 2,
    update: true,
    content: (
      <>
        <InlineMath>{String.raw`\ell \leftarrow`}</InlineMath>
        <InlineMath>{String.raw`\alpha\ell +`}</InlineMath>
        <InlineMath>{String.raw`\operatorname{rowsum}(W)`}</InlineMath>
      </>
    ),
  },
  {
    id: 'numerator',
    depth: 2,
    update: true,
    content: (
      <>
        <InlineMath>{String.raw`U \leftarrow`}</InlineMath>
        <InlineMath>{String.raw`\alpha U + WV_j`}</InlineMath>
      </>
    ),
  },
  { id: 'advance', depth: 2, content: <InlineMath>{String.raw`m \leftarrow m'`}</InlineMath> },
  { id: 'end-keys', depth: 1, content: <b>end for</b> },
  {
    id: 'normalize',
    depth: 1,
    content: (
      <>
        <InlineMath>{String.raw`O_i \leftarrow`}</InlineMath>
        <InlineMath>{String.raw`U / \ell`}</InlineMath>
        <span className="flash-algorithm-note">最后才归一化</span>
      </>
    ),
  },
  {
    id: 'normalizer',
    depth: 1,
    content: (
      <>
        <InlineMath>{String.raw`L_i \leftarrow`}</InlineMath>
        <InlineMath>{String.raw`m + \log\ell`}</InlineMath>
      </>
    ),
  },
  {
    id: 'store',
    depth: 1,
    content: (
      <>
        <b>store</b> <InlineMath>{String.raw`O_i,L_i`}</InlineMath>
      </>
    ),
  },
  { id: 'end-queries', depth: 0, content: <b>end for</b> },
];

function FlashForwardAlgorithm() {
  return (
    <figure
      className="flash-algorithm"
      id="flash-forward-algorithm"
      aria-labelledby="flash-forward-title"
    >
      <figcaption id="flash-forward-title">
        <span className="flash-algorithm-number">Algorithm 1</span>
        <strong>FlashAttention forward</strong>
      </figcaption>
      <div className="flash-algorithm-contract">
        <p>
          <b>Input</b> <InlineMath>{String.raw`Q,K,V`}</InlineMath> in HBM，按{' '}
          <InlineMath>{String.raw`B_r,B_c`}</InlineMath> 分块
        </p>
        <p>
          <b>Output</b> <InlineMath>{String.raw`O`}</InlineMath>，以及 backward 所需的{' '}
          <InlineMath>{String.raw`L`}</InlineMath>
        </p>
      </div>
      <ol className="flash-algorithm-lines">
        {FORWARD_LINES.map((line, index) => (
          <li key={line.id} value={index + 1} id={`flash-forward-${line.id}`}>
            <div
              className={`flash-algorithm-line flash-algorithm-depth-${line.depth}${line.update ? ' flash-algorithm-update' : ''}`}
            >
              {line.content}
            </div>
          </li>
        ))}
      </ol>
      <p className="flash-algorithm-legend">标记行：计算重缩放系数，并用它同时调整分母与加权和。</p>
    </figure>
  );
}

export const POST_COMPONENTS = { FlashForwardAlgorithm };
