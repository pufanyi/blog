import type { ReactNode } from 'react';

function ProtocolFigure({
  id,
  title,
  description,
  height,
  caption,
  children,
}: {
  id: string;
  title: string;
  description: string;
  height: number;
  caption: ReactNode;
  children: ReactNode;
}) {
  return (
    <figure className="mcp-figure">
      <div className="mcp-scroll">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="800"
          height={height}
          viewBox={`0 0 800 ${height}`}
          role="img"
          aria-labelledby={`${id}-title ${id}-desc`}
        >
          <title id={`${id}-title`}>{title}</title>
          <desc id={`${id}-desc`}>{description}</desc>
          {children}
        </svg>
      </div>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

function ArrowMarker({ id, className = 'mcp-arrow-head' }: { id: string; className?: string }) {
  return (
    <marker
      id={id}
      viewBox="0 0 10 10"
      refX="9"
      refY="5"
      markerWidth="6"
      markerHeight="6"
      orient="auto-start-reverse"
    >
      <path d="M0 0L10 5L0 10Z" className={className} />
    </marker>
  );
}

const receivedChunks = [
  { id: 'A1', stream: 'A', received: false },
  { id: 'A2', stream: 'A', received: true },
  { id: 'B1', stream: 'B', received: true },
] as const;

function Chunk({
  id,
  x,
  y,
  state,
}: {
  id: string;
  x: number;
  y: number;
  state: 'missing' | 'waiting' | 'ready';
}) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width="82" height="40" rx="5" className={`mcp-chunk mcp-${state}`} />
      <text x="41" y="25" textAnchor="middle" className="mcp-chunk-label">
        {id}
      </text>
      {state === 'missing' ? <path d="M65 7L75 17M75 7L65 17" className="mcp-cross" /> : null}
    </g>
  );
}

function TransportHeadOfLine() {
  return (
    <ProtocolFigure
      id="mcp-hol"
      title="同一个丢包，在 TCP 与 QUIC 中阻塞不同的交付范围"
      description="两个流分别有 A1、A2 和 B1 三段数据。A1 丢失，A2 与 B1 已到达。HTTP/2 的这些数据共用一个 TCP byte stream，A1 形成的缺口让后面的 A2 与 B1 都不能交给 HTTP/2。QUIC 按流分别交付，A2 仍等待 A1，而 B1 可以交付。各条 QUIC 流仍共享连接级拥塞控制。"
      height={440}
      caption={
        <>
          图中每个包只承载一条 stream 的一段数据，且 A1 位于 TCP byte stream 的较早位置。比较的是
          A2、B1 已经到达之后，谁能交付给上层；不是谁先到达。QUIC 消除的是跨 stream 的这种
          head-of-line blocking，同一 stream 内的缺口仍要等待补齐，共享拥塞也仍会影响各条流。
        </>
      }
    >
      <defs>
        <ArrowMarker id="mcp-hol-ready-arrow" className="mcp-ready-head" />
      </defs>
      {[
        { label: 'HTTP/2 over TCP', x: 22 },
        { label: 'QUIC', x: 414 },
      ].map(({ label, x }) => (
        <g key={label}>
          <rect x={x} y="18" width="364" height="363" rx="9" className="mcp-panel" />
          <text x={x + 182} y="48" textAnchor="middle" className="mcp-heading">
            {label}
          </text>
          {receivedChunks.map((chunk, index) => (
            <g key={`${label}-${chunk.id}`}>
              <text x={x + 79 + index * 103} y="83" textAnchor="middle" className="mcp-small">
                {chunk.received ? '已到达' : '丢失'}
              </text>
              <Chunk
                id={chunk.id}
                x={x + 38 + index * 103}
                y={96}
                state={chunk.received ? 'waiting' : 'missing'}
              />
            </g>
          ))}
        </g>
      ))}

      <text x="204" y="177" textAnchor="middle" className="mcp-label">
        一个有序 TCP byte stream
      </text>
      <rect x="45" y="195" width="319" height="77" rx="6" className="mcp-buffer" />
      {receivedChunks.map((chunk, index) => (
        <Chunk
          key={`tcp-${chunk.id}`}
          id={chunk.id}
          x={60 + index * 103}
          y={213}
          state={chunk.received ? 'waiting' : 'missing'}
        />
      ))}
      <path d="M204 277V322" className="mcp-edge mcp-blocked-edge" />
      <path d="M195 303H213" className="mcp-stop" />
      <text x="225" y="307" className="mcp-small">
        缺口未补齐
      </text>
      <rect x="93" y="331" width="222" height="33" rx="5" className="mcp-waiting" />
      <text x="204" y="353" textAnchor="middle" className="mcp-label">
        A2、B1 都暂不能交付
      </text>

      <text x="596" y="177" textAnchor="middle" className="mcp-label">
        每条 stream 分别按序交付
      </text>
      {(['A', 'B'] as const).map((stream, streamIndex) => {
        const y = 195 + streamIndex * 95;
        return (
          <g key={stream}>
            <text x="438" y={y + 26} className="mcp-stream-label">
              {stream}
            </text>
            {receivedChunks
              .filter((chunk) => chunk.stream === stream)
              .map((chunk, index) => (
                <Chunk
                  key={`quic-${chunk.id}`}
                  id={chunk.id}
                  x={467 + index * 103}
                  y={y}
                  state={!chunk.received ? 'missing' : stream === 'B' ? 'ready' : 'waiting'}
                />
              ))}
            {stream === 'A' ? (
              <text x="610" y={y + 65} textAnchor="middle" className="mcp-small">
                A2 仍等待 A1
              </text>
            ) : (
              <>
                <path
                  d={`M558 ${y + 20}H602`}
                  className="mcp-edge mcp-ready-edge"
                  markerEnd="url(#mcp-hol-ready-arrow)"
                />
                <text x="620" y={y + 25} className="mcp-label">
                  B1 可以交付
                </text>
              </>
            )}
          </g>
        );
      })}
      <text x="400" y="414" textAnchor="middle" className="mcp-small">
        独立交付 ≠ 独立带宽：QUIC 的各条流仍共享连接级 congestion control
      </text>
    </ProtocolFigure>
  );
}

function WebRtcPaths() {
  return (
    <ProtocolFigure
      id="mcp-rtc"
      title="WebRTC 的 signaling 与候选媒体路径是不同的连接"
      description="两个浏览器通过应用自己的 signaling 服务交换会话描述和 ICE candidates。ICE 检查候选路径；可选择浏览器间直接传输，也可选择经过 TURN relay 的路径。两种媒体路径是替代选项，不是先经过直连再经过 TURN 的串联步骤。虚线表示 signaling，实线表示直接媒体路径，点划线表示 TURN 中继路径。"
      height={480}
      caption={
        <>
          虚线是 signaling，实线是直连，点划线是 TURN 中继。两种媒体路径是备选关系，
          不是串联步骤，也不表示必须同时传输；媒体不必经过 signaling server。
        </>
      }
    >
      <defs>
        <ArrowMarker id="mcp-rtc-signal-arrow" className="mcp-signal-head" />
        <ArrowMarker id="mcp-rtc-direct-arrow" />
        <ArrowMarker id="mcp-rtc-relay-arrow" className="mcp-relay-head" />
      </defs>
      <rect x="290" y="25" width="220" height="62" rx="7" className="mcp-node mcp-signal-node" />
      <text x="400" y="51" textAnchor="middle" className="mcp-heading">
        Signaling server
      </text>
      <text x="400" y="73" textAnchor="middle" className="mcp-small">
        由应用选择和实现
      </text>
      <path
        d="M137 178V56H283"
        className="mcp-edge mcp-signal-edge"
        markerStart="url(#mcp-rtc-signal-arrow)"
        markerEnd="url(#mcp-rtc-signal-arrow)"
      />
      <path
        d="M663 178V56H517"
        className="mcp-edge mcp-signal-edge"
        markerStart="url(#mcp-rtc-signal-arrow)"
        markerEnd="url(#mcp-rtc-signal-arrow)"
      />
      <text x="400" y="122" textAnchor="middle" className="mcp-label">
        交换 SDP 与 ICE candidates
      </text>
      {[
        { x: 37, name: '浏览器 A' },
        { x: 563, name: '浏览器 B' },
      ].map(({ x, name }) => (
        <g key={name}>
          <rect x={x} y="185" width="200" height="100" rx="8" className="mcp-node" />
          <text x={x + 100} y="215" textAnchor="middle" className="mcp-heading">
            {name}
          </text>
          <text x={x + 100} y="243" textAnchor="middle" className="mcp-label">
            ICE candidates
          </text>
          <text x={x + 100} y="266" textAnchor="middle" className="mcp-small">
            本地 / 映射 / 中继
          </text>
        </g>
      ))}

      <text x="400" y="203" textAnchor="middle" className="mcp-label">
        可选路径 ①：直连
      </text>
      <path
        d="M247 230H553"
        className="mcp-edge mcp-direct-edge"
        markerStart="url(#mcp-rtc-direct-arrow)"
        markerEnd="url(#mcp-rtc-direct-arrow)"
      />
      <text x="400" y="259" textAnchor="middle" className="mcp-small">
        SRTP / DataChannel
      </text>

      <text x="400" y="325" textAnchor="middle" className="mcp-label">
        可选路径 ②：TURN 中继
      </text>
      <rect x="290" y="348" width="220" height="68" rx="7" className="mcp-node mcp-relay-node" />
      <text x="400" y="376" textAnchor="middle" className="mcp-heading">
        TURN relay
      </text>
      <text x="400" y="400" textAnchor="middle" className="mcp-small">
        为端点分配 relay address
      </text>
      <path
        d="M137 293V382H282"
        className="mcp-edge mcp-relay-edge"
        markerStart="url(#mcp-rtc-relay-arrow)"
        markerEnd="url(#mcp-rtc-relay-arrow)"
      />
      <path
        d="M663 293V382H518"
        className="mcp-edge mcp-relay-edge"
        markerStart="url(#mcp-rtc-relay-arrow)"
        markerEnd="url(#mcp-rtc-relay-arrow)"
      />
      <text x="400" y="452" textAnchor="middle" className="mcp-small">
        ICE 选择可达的 candidate pair；signaling 的通路与媒体的通路不必相同
      </text>
    </ProtocolFigure>
  );
}

const retryOperationId = '42';

function RpcRetryTimeline() {
  return (
    <ProtocolFigure
      id="mcp-rpc"
      title="RPC 响应丢失时，用相同 operation ID 查询已经提交的结果"
      description={`客户端发出 operation ID 为 ${retryOperationId} 的请求。服务端在同一个数据库事务中提交业务效果和 operation ID 到结果的记录，但响应丢失。客户端超时后不能判断操作是否执行；它携带相同 ID 重试。服务端命中已提交的记录，返回原结果而不重复业务效果。时间向下。`}
      height={530}
      caption={
        <>
          图中展示“已经提交，但响应丢失”的情形。客户端复用同一操作 ID 重试，服务端读取原结果；
          timeout 本身并不能告诉客户端此前是否已经提交。
        </>
      }
    >
      <defs>
        <ArrowMarker id="mcp-rpc-arrow" />
        <ArrowMarker id="mcp-rpc-ready-arrow" className="mcp-ready-head" />
      </defs>
      <rect x="78" y="24" width="164" height="53" rx="7" className="mcp-node" />
      <text x="160" y="57" textAnchor="middle" className="mcp-heading">
        Client
      </text>
      <rect x="458" y="24" width="296" height="53" rx="7" className="mcp-node" />
      <text x="606" y="57" textAnchor="middle" className="mcp-heading">
        Service + transactional DB
      </text>
      <path d="M160 86V475M540 86V475" className="mcp-lifeline" />
      <path d="M31 106V465M25 457L31 465L37 457" className="mcp-time-axis" />
      <text x="31" y="96" textAnchor="middle" className="mcp-small">
        时间
      </text>

      <text x="350" y="119" textAnchor="middle" className="mcp-label">
        {`1. request · op=${retryOperationId}`}
      </text>
      <path d="M160 135H539" className="mcp-edge" markerEnd="url(#mcp-rpc-arrow)" />
      <circle cx="540" cy="135" r="4" className="mcp-event" />
      <path d="M540 167H565" className="mcp-edge" />
      <rect x="570" y="145" width="207" height="93" rx="6" className="mcp-transaction" />
      <text x="673" y="170" textAnchor="middle" className="mcp-label">
        同一个事务中 commit
      </text>
      <text x="673" y="195" textAnchor="middle" className="mcp-small">
        业务效果
      </text>
      <text x="673" y="219" textAnchor="middle" className="mcp-small">
        {`op=${retryOperationId} → result`}
      </text>
      <text x="407" y="254" textAnchor="middle" className="mcp-label">
        2. response 丢失
      </text>
      <path d="M540 271H284" className="mcp-edge mcp-lost-edge" />
      <path d="M275 262L293 280M293 262L275 280" className="mcp-cross" />
      <text x="177" y="300" className="mcp-small">
        timeout：结果未知
      </text>

      <text x="350" y="337" textAnchor="middle" className="mcp-label">
        {`3. retry · op=${retryOperationId}`}
      </text>
      <path d="M160 353H539" className="mcp-edge" markerEnd="url(#mcp-rpc-arrow)" />
      <circle cx="540" cy="353" r="4" className="mcp-event" />
      <path d="M540 383H565" className="mcp-edge mcp-ready-edge" />
      <rect x="570" y="331" width="207" height="91" rx="6" className="mcp-transaction" />
      <text x="673" y="358" textAnchor="middle" className="mcp-label">
        命中已提交的 ID
      </text>
      <text x="673" y="383" textAnchor="middle" className="mcp-small">
        核对参数，读取原结果
      </text>
      <text x="673" y="407" textAnchor="middle" className="mcp-small">
        不重复业务效果
      </text>
      <text x="350" y="444" textAnchor="middle" className="mcp-label">
        4. 返回原 result
      </text>
      <path
        d="M540 460H161"
        className="mcp-edge mcp-ready-edge"
        markerEnd="url(#mcp-rpc-ready-arrow)"
      />
      <text x="400" y="505" textAnchor="middle" className="mcp-small">
        同一业务操作重用同一 ID；去重记录的保留期也是协议契约的一部分
      </text>
    </ProtocolFigure>
  );
}

export const POST_COMPONENTS = {
  TransportHeadOfLine,
  WebRtcPaths,
  RpcRetryTimeline,
};
