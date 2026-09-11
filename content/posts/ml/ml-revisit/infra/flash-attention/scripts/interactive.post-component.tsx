import { buildFrames, EXAMPLE, formatNumber, PHASES, referenceResult } from '../../../../../../../src/app/utils/flash-forward/model';

const INITIAL_FRAMES = buildFrames();

function Math({ children }: { children: string }) {
  return <span className="math-inline">{`\\(${children}\\)`}</span>;
}

function FlashForwardInteractive() {
  return (
    <figure className="flash-player" id="flash-forward-interactive" data-flash-forward="" aria-labelledby="flash-player-title">
      <figcaption id="flash-player-title"><span className="flash-player-eyebrow">交互演示</span><strong>跟着一个 query tile 跑一遍</strong></figcaption>
      <p className="flash-player-intro">
        取 <Math>{String.raw`N=4,\ d=1,\ B_r=B_c=2`}</Math>，只跟踪 <Math>{String.raw`Q_1=(1,2)^\top`}</Math>。
        第一行沿用上面的例子；第二行展示同一块内独立的 softmax 状态。其余 query tile 独立执行。
      </p>
      <div data-agent-omit="">
      <div className="flash-player-controls" hidden data-controls="">
        <div className="flash-player-buttons">
          <button type="button" data-action="play" aria-pressed="false">播放</button>
          <button type="button" data-action="previous" disabled>上一步</button>
          <button type="button" data-action="next">下一步</button>
          <button type="button" data-action="reset">重置</button>
        </div>
        <label className="flash-player-order"><input type="checkbox" data-order="" />反向扫描 KV</label>
        <label className="flash-player-timeline">进度<input type="range" min="0" max={INITIAL_FRAMES.length - 1} defaultValue="0" aria-label="Forward 动画进度" data-progress="" /><span data-field="progress">1 / {INITIAL_FRAMES.length}</span></label>
      </div>
      <div className="flash-player-stage" aria-live="polite" aria-atomic="true" data-stage="">
        <span className="flash-player-eyebrow" data-field="round">准备</span>
        <strong data-field="title">{PHASES.initialize.title}</strong>
        <a href="#flash-forward-initialize" data-line-link="">伪代码 <span data-field="lines">02–03</span> 行</a>
      </div>
      <p className="flash-player-explanation" data-field="explanation">{INITIAL_FRAMES[0].explanation}</p>
      <div className="flash-player-formulas">
        {Object.entries(PHASES).map(([phase, info]) => <div key={phase} data-formula={phase} hidden={phase !== 'initialize'}><Math>{info.formula}</Math></div>)}
      </div>
      <div className="flash-player-hbm">
        <div className="flash-player-region-title"><strong>HBM · 输入</strong><span>每次只读一块 KV</span></div>
        <div className="flash-player-tiles">
          {[0, 1].map(tile => <div key={tile} className="flash-player-tile" data-tile={tile}>
            <div><Math>{`K_${tile + 1},V_${tile + 1}`}</Math><span data-tile-status={tile}>待读取</span></div>
            <p><Math>{`K_${tile + 1}=(${EXAMPLE.exponentials.slice(tile * 2, tile * 2 + 2).map(n => `\\log ${n}`).join(',')})^\\top`}</Math></p>
            <p><Math>{`V_${tile + 1}=(${EXAMPLE.values.slice(tile * 2, tile * 2 + 2).join(',')})^\\top`}</Math></p>
          </div>)}
        </div>
      </div>
      <div className="flash-player-transfer" data-field="transfer">↓ 加载 query；KV 尚未读取</div>
      <div className="flash-player-chip">
        <div className="flash-player-region-title"><strong>片上 · 计算与累加</strong><span><Math>{String.raw`Q_1=(1,2)^\top`}</Math> 常驻</span></div>
        <div className="flash-player-workspace">
          <div className="flash-player-scratch">
            <strong>临时 tile · <span data-field="scratch">空闲</span></strong>
            <div className="flash-player-matrix" aria-label="当前临时 tile，按行排列">
              {[0, 1, 2, 3].map(cell => <span key={cell} data-cell={cell}>—</span>)}
            </div>
            <p data-field="scratch-note">只为当前块使用临时空间</p>
          </div>
          <div className="flash-player-state">
            <strong>跨块保留的状态</strong>
            <table aria-label="各 query 行的累加状态">
              <thead><tr><th scope="col">行</th>{['m', String.raw`\ell`, 'U'].map(label => <th key={label} scope="col"><Math>{label}</Math></th>)}</tr></thead>
              <tbody>{EXAMPLE.queries.map((query, row) => <tr key={query} data-state-row={row}><th scope="row"><Math>{`q_${row + 1}`}</Math></th><td data-state="m">−∞</td><td data-state="ell">0</td><td data-state="u">0</td></tr>)}</tbody>
            </table>
            <p>每行两个标量和一个 <Math>{String.raw`d`}</Math> 维加权和；本例 <Math>{String.raw`d=1`}</Math>。</p>
          </div>
        </div>
        <div className="flash-player-merge" data-merge="" hidden>
          <div className="flash-player-region-title"><strong>旧贡献与本块贡献</strong><span>先乘同一个 <Math>{String.raw`\alpha`}</Math>，再相加</span></div>
          {EXAMPLE.queries.map((query, row) => <div className="flash-player-merge-row" key={query} data-merge-row={row}>
            <div className="flash-player-merge-heading"><Math>{`q_${row + 1}`}</Math><span><Math>{String.raw`m'`}</Math> = <span data-merge-value="maximum" />，<Math>{String.raw`\alpha`}</Math> = <span data-merge-value="alpha" /></span></div>
            <div className="flash-player-equation"><Math>{String.raw`\ell`}</Math><span data-merge-value="ell" /></div>
            <div className="flash-player-equation"><Math>{String.raw`U`}</Math><span data-merge-value="u" /></div>
            <div className="flash-player-bar" aria-hidden="true"><span data-old-bar="" /><span data-new-bar="" /></div>
          </div>)}
          <p className="flash-player-bar-legend"><span>实线：缩放后的旧分母</span><span>斜线：本块的指数和</span></p>
        </div>
        <div className="flash-player-output" data-output="" hidden>
          <strong>写回 HBM</strong>
          {EXAMPLE.queries.map((query, row) => <p key={query}><Math>{`q_${row + 1}:`}</Math> <Math>{'O'}</Math> = <span data-output-row={row} />；<Math>{'L'}</Math> = <span data-normalizer-row={row} /></p>)}
        </div>
      </div>
      </div>
      <p className="flash-player-reference">完整 attention 核对：{EXAMPLE.queries.map((query, row) => {
        const result = referenceResult(query);
        return <span key={query}><Math>{`q_${row + 1}:\\quad O=\\frac{${result.numerator}}{${result.denominator}}\\approx ${(result.numerator / result.denominator).toFixed(4)}`}</Math>{row === 0 ? '；' : '。'}</span>;
      })}可以反向扫描，再比较最终结果。</p>
      <details className="flash-player-transcript">
        <summary>逐块数值核对</summary>
        <p>正向扫描时，每块都按 <Math>{String.raw`\ell\leftarrow\alpha\ell+\operatorname{rowsum}(W)`}</Math>、<Math>{String.raw`U\leftarrow\alpha U+WV_j`}</Math> 合并。下表是每次合并后的状态。</p>
        <table>
          <thead><tr><th scope="col">KV 块</th><th scope="col">行</th>{[String.raw`\alpha`, 'm', String.raw`\ell`, 'U'].map(label => <th key={label} scope="col"><Math>{label}</Math></th>)}</tr></thead>
          <tbody>{INITIAL_FRAMES.filter(frame => frame.phase === 'accumulate').flatMap(frame => frame.merge.map((row, rowIndex) => <tr key={`${frame.tile}-${rowIndex}`}>
            <td>{(frame.tile ?? 0) + 1}</td><th scope="row"><Math>{`q_${rowIndex + 1}`}</Math></th>
            {[row.alpha, row.after.m, row.after.ell, row.after.u].map((value, column) => <td key={column}>{formatNumber(value)}</td>)}
          </tr>))}</tbody>
        </table>
        <p>第一行的旧分母与旧加权和乘 1/4，第二行乘 1/16；两行各自合并，最后分别计算 <Math>{String.raw`U/\ell`}</Math>。反向扫描的第二块都使用 <Math>{String.raw`\alpha=1`}</Math>，输出相同。</p>
      </details>
      <p className="flash-player-footnote">演示不加 mask 或 dropout；显示值最多保留 4 位小数，内部计算不做这一步舍入。播放节奏不代表 GPU 耗时。</p>
    </figure>
  );
}

export const POST_COMPONENTS = { FlashForwardInteractive };
