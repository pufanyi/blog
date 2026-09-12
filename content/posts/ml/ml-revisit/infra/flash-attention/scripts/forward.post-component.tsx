import type { ReactNode } from 'react';

function Math({ children }: { children: string }) {
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
        <b>parallel for</b> each query tile <Math>{String.raw`Q_i`}</Math> <b>do</b>
      </>
    ),
  },
  {
    id: 'load-query',
    depth: 1,
    content: (
      <>
        <b>load</b> <Math>{String.raw`Q_i`}</Math>
      </>
    ),
  },
  {
    id: 'initialize',
    depth: 1,
    content: (
      <>
        <Math>{String.raw`m \leftarrow -\infty,`}</Math>
        <Math>{String.raw`\ell \leftarrow 0,`}</Math>
        <Math>{String.raw`U \leftarrow 0`}</Math>
      </>
    ),
  },
  {
    id: 'keys',
    depth: 1,
    content: (
      <>
        <b>for</b> each KV tile <Math>{String.raw`K_j,V_j`}</Math> <b>do</b>
      </>
    ),
  },
  {
    id: 'load-kv',
    depth: 2,
    content: (
      <>
        <b>load</b> <Math>{String.raw`K_j,V_j`}</Math>
      </>
    ),
  },
  {
    id: 'scores',
    depth: 2,
    content: (
      <>
        <Math>{String.raw`S \leftarrow`}</Math>
        <Math>{String.raw`Q_iK_j^\top / \sqrt d`}</Math>
      </>
    ),
  },
  {
    id: 'mask',
    depth: 2,
    content: (
      <>
        <b>mask</b> <Math>{String.raw`S`}</Math>
        <span className="flash-algorithm-note">全被 mask 的行跳过本轮更新</span>
      </>
    ),
  },
  {
    id: 'maximum',
    depth: 2,
    content: (
      <>
        <Math>{String.raw`m' \leftarrow`}</Math>
        <Math>{String.raw`\max\!\left(m,\operatorname{rowmax}(S)\right)`}</Math>
      </>
    ),
  },
  {
    id: 'rescale',
    depth: 2,
    update: true,
    content: (
      <>
        <Math>{String.raw`\alpha \leftarrow`}</Math>
        <Math>{String.raw`\exp(m-m')`}</Math>
      </>
    ),
  },
  {
    id: 'weights',
    depth: 2,
    content: (
      <>
        <Math>{String.raw`W \leftarrow`}</Math>
        <Math>{String.raw`\exp(S-m')`}</Math>
      </>
    ),
  },
  {
    id: 'denominator',
    depth: 2,
    update: true,
    content: (
      <>
        <Math>{String.raw`\ell \leftarrow`}</Math>
        <Math>{String.raw`\alpha\ell +`}</Math>
        <Math>{String.raw`\operatorname{rowsum}(W)`}</Math>
      </>
    ),
  },
  {
    id: 'numerator',
    depth: 2,
    update: true,
    content: (
      <>
        <Math>{String.raw`U \leftarrow`}</Math>
        <Math>{String.raw`\alpha U + WV_j`}</Math>
      </>
    ),
  },
  { id: 'advance', depth: 2, content: <Math>{String.raw`m \leftarrow m'`}</Math> },
  { id: 'end-keys', depth: 1, content: <b>end for</b> },
  {
    id: 'normalize',
    depth: 1,
    content: (
      <>
        <Math>{String.raw`O_i \leftarrow`}</Math>
        <Math>{String.raw`U / \ell`}</Math>
        <span className="flash-algorithm-note">最后才归一化</span>
      </>
    ),
  },
  {
    id: 'normalizer',
    depth: 1,
    content: (
      <>
        <Math>{String.raw`L_i \leftarrow`}</Math>
        <Math>{String.raw`m + \log\ell`}</Math>
      </>
    ),
  },
  {
    id: 'store',
    depth: 1,
    content: (
      <>
        <b>store</b> <Math>{String.raw`O_i,L_i`}</Math>
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
          <b>Input</b> <Math>{String.raw`Q,K,V`}</Math> in HBM，按{' '}
          <Math>{String.raw`B_r,B_c`}</Math> 分块
        </p>
        <p>
          <b>Output</b> <Math>{String.raw`O`}</Math>，以及 backward 所需的{' '}
          <Math>{String.raw`L`}</Math>
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
