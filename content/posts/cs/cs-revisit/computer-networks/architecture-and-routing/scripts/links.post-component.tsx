const example = { packet: 4, rate: 1, propagation: 3 };
const transmission = example.packet / example.rate;
const arrival = transmission + example.propagation;

function LinkSnapshots() {
  const scale = 120;
  const times = [0, 2, transmission, arrival];
  return (
    <figure className="csnet-figure">
      <div
        className="csnet-scroll"
        role="region"
        aria-label="可横向滚动的链路传输快照"
        tabIndex={0}
      >
        <svg
          className="csnet-link-figure"
          viewBox="0 0 760 390"
          role="img"
          aria-labelledby="csnet-snap-title csnet-snap-desc"
        >
          <title id="csnet-snap-title">同一个包在四个时刻的位置</title>
          <desc id="csnet-snap-desc">
            4 kbit 的包通过 1 kbit/s 的链路发送，单程传播时间为 3 s。 0 s 时整个包尚未发送；2 s
            时一半尚未发送，一半在链路上； 4 s 时整个包已送上线，3 kbit 在途中，1 kbit 已收到；7 s
            时全部收到。 链路上的色条从左向右移动，长度按相同空间比例绘制。
          </desc>
          <text x="25" y="28" className="csnet-journey-heading">
            冻结时间，看数据在哪里
          </text>
          <text x="25" y="57" className="csnet-row-label">
            同一个 4 kbit 包 · 1 kbit/s · 单程传播 3 s
          </text>
          <text x="182" y="88" className="csnet-packet-label">
            发送端
          </text>
          <text x="405" y="88" className="csnet-packet-label">
            链路：信号向右传播 →
          </text>
          <text x="649" y="88" className="csnet-packet-label">
            接收端
          </text>
          {times.map((time, i) => {
            const y = 110 + i * 64;
            const sent = Math.min(example.rate * time, example.packet);
            const received = Math.max(
              0,
              Math.min(example.rate * (time - example.propagation), example.packet),
            );
            const left = Math.max(0, time - transmission);
            const right = Math.min(time, example.propagation);
            return (
              <g key={time}>
                <text x="25" y={y + 23} className="csnet-row-label">
                  {time} s
                </text>
                <rect x="100" y={y} width="105" height="34" rx="4" className="csnet-data" />
                {sent < example.packet && (
                  <rect
                    x="100"
                    y={y}
                    width={(105 * (example.packet - sent)) / example.packet}
                    height="34"
                    className="csnet-ip"
                  />
                )}
                <text x="152" y={y + 23} className="csnet-packet-label">
                  {example.packet - sent} kbit 待发
                </text>
                <rect
                  x="225"
                  y={y}
                  width={example.propagation * scale}
                  height="34"
                  className="csnet-data"
                />
                {right > left && (
                  <rect
                    x={225 + left * scale}
                    y={y}
                    width={(right - left) * scale}
                    height="34"
                    className="csnet-link"
                  />
                )}
                <rect x="610" y={y} width="125" height="34" rx="4" className="csnet-data" />
                {received > 0 && (
                  <rect
                    x="610"
                    y={y}
                    width={(125 * received) / example.packet}
                    height="34"
                    className="csnet-link"
                  />
                )}
                <text x="672" y={y + 23} className="csnet-packet-label">
                  {received} kbit 已收
                </text>
              </g>
            );
          })}
          <text x="225" y="377" className="csnet-row-label">
            4 s：全部送上线；7 s：整个包才到达
          </text>
        </svg>
      </div>
      <figcaption>
        四行是同一条链路的四张快照，色条表示包的数据。发送与传播同时发生：前面的数据已经在路上，后面的数据还在等待发送。
        端点方框只表示待发和已收的数据量，不使用链路的空间比例。 快照与时间线的视角参考{' '}
        <a href="https://textbook.cs168.io/intro/links.html">CS 168 Textbook: Links</a>
        ，数值例子为本文绘制。
      </figcaption>
    </figure>
  );
}

function LinkTiming() {
  const y = (time: number) => 65 + time * 40;
  return (
    <figure className="csnet-figure">
      <div
        className="csnet-scroll"
        role="region"
        aria-label="可横向滚动的首尾 bit 时间线"
        tabIndex={0}
      >
        <svg
          className="csnet-link-figure"
          viewBox="0 0 760 410"
          role="img"
          aria-labelledby="csnet-time-title csnet-time-desc"
        >
          <title id="csnet-time-title">最后一个 bit 先等发送，再走完链路</title>
          <desc id="csnet-time-desc">
            时间向下增加。首 bit 在 0 s 出发，3 s 到达。最后一个 bit 在 4 s 出发，7 s
            到达。两条传播线平行，说明每个 bit 的传播时间都是 3 s。完整包到达时间为 4 s 的发送时间加
            3 s 的传播时间。
          </desc>
          <text x="25" y="28" className="csnet-journey-heading">
            换成时间线：横向是位置，纵向是时间
          </text>
          <text x="180" y="53" className="csnet-packet-label">
            发送端
          </text>
          <text x="535" y="53" className="csnet-packet-label">
            接收端
          </text>
          <path d="M 70 65 V 355 M 65 347 L 70 355 L 75 347" className="csnet-edge" />
          <text x="25" y="387" className="csnet-row-label">
            时间 ↓
          </text>
          <line x1="180" y1={y(0)} x2="180" y2={y(arrival)} className="csnet-edge" />
          <line x1="535" y1={y(0)} x2="535" y2={y(arrival)} className="csnet-edge" />
          {[0, example.propagation, transmission, arrival].map((time) => (
            <g key={time}>
              <text x="90" y={y(time) + 5} className="csnet-row-label">
                {time} s
              </text>
              <line x1="171" y1={y(time)} x2="189" y2={y(time)} className="csnet-edge" />
            </g>
          ))}
          <path
            d={`M 180 ${y(0)} L 535 ${y(example.propagation)} L 535 ${y(arrival)} L 180 ${y(transmission)} Z`}
            className="csnet-time-band"
          />
          <line
            x1="180"
            y1={y(0)}
            x2="535"
            y2={y(example.propagation)}
            className="csnet-first-bit"
          />
          <line x1="180" y1={y(transmission)} x2="535" y2={y(arrival)} className="csnet-last-bit" />
          <line x1="180" y1={y(0)} x2="180" y2={y(transmission)} className="csnet-send-interval" />
          <line
            x1="535"
            y1={y(example.propagation)}
            x2="535"
            y2={y(arrival)}
            className="csnet-receive-interval"
          />
          <text x="220" y="75" className="csnet-row-label">
            首 bit：传播 3 s
          </text>
          <text x="222" y="325" className="csnet-row-label">
            尾 bit：同样传播 3 s
          </text>
          <text x="198" y="187" className="csnet-row-label">
            送上线：4 s
          </text>
          <text x="556" y="190" className="csnet-row-label">
            3 s：开始收到
          </text>
          <text x="556" y="277" className="csnet-row-label">
            接收持续 4 s
          </text>
          <text x="556" y="350" className="csnet-row-label">
            7 s：全部收到
          </text>
          <text x="180" y="390" className="csnet-row-label">
            完整到达：先等尾 bit 出发（4 s），再等它传播（3 s）
          </text>
        </svg>
      </div>
      <figcaption>
        与上一张图使用同一组数值，时间轴按比例绘制。虚线是首 bit，实线是尾 bit，色带是其间的数据。
        按通常的连续发送模型，忽略单个 bit 的发送粒度；每个 bit 一旦出发，都要走同样长的链路。
        接收可以在发送完成前开始，但整个包必须等尾 bit 到达才算收齐。
      </figcaption>
    </figure>
  );
}

const rates = [100, 1000];
const packetBits = 1500 * 8;
const propagationMs = 5;

function LinkBandwidthComparison() {
  const scale = 90;
  return (
    <figure className="csnet-figure">
      <div
        className="csnet-scroll"
        role="region"
        aria-label="可横向滚动的带宽和到达时间对比"
        tabIndex={0}
      >
        <svg
          className="csnet-link-figure"
          viewBox="0 0 760 400"
          role="img"
          aria-labelledby="csnet-rate-title csnet-rate-desc"
        >
          <title id="csnet-rate-title">带宽提高十倍，只缩短送上线的时间</title>
          <desc id="csnet-rate-desc">
            同一个 1500 byte 包，单程传播时间固定为 5 ms。100 Mbit/s 时发送需要 0.12
            ms，完整到达需要 5.12 ms；1 Gbit/s 时发送需要 0.012 ms，完整到达需要 5.012
            ms。上方横条使用相同时间比例；下方放大发送区间，让较小的差异可见。
          </desc>
          <text x="25" y="28" className="csnet-journey-heading">
            同一个 1,500 byte 包，同一段传播距离
          </text>
          <text x="25" y="57" className="csnet-row-label">
            完整到达时间：发送 + 传播（同一时间比例）
          </text>
          {rates.map((rate, i) => {
            const tx = packetBits / (rate * 1000);
            const rowY = 90 + i * 82;
            return (
              <g key={rate}>
                <text x="25" y={rowY + 20} className="csnet-row-label">
                  {rate === 1000 ? '1 Gbit/s' : '100 Mbit/s'}
                </text>
                <rect
                  x="155"
                  y={rowY}
                  width={tx * scale}
                  height="26"
                  className="csnet-delay-send"
                />
                <rect
                  x={155 + tx * scale}
                  y={rowY}
                  width={propagationMs * scale}
                  height="26"
                  className="csnet-delay-propagation"
                />
                <text x="405" y={rowY + 19} className="csnet-packet-label">
                  传播始终为 5 ms
                </text>
                <text
                  x={170 + (tx + propagationMs) * scale}
                  y={rowY + 20}
                  className="csnet-row-label"
                >
                  {tx + propagationMs} ms
                </text>
                <text x="155" y={rowY + 49} className="csnet-row-label">
                  送上线：{tx} ms
                </text>
              </g>
            );
          })}
          <text x="25" y="265" className="csnet-journey-heading">
            放大发送区间：这部分才缩短到十分之一
          </text>
          {rates.map((rate, i) => {
            const tx = packetBits / (rate * 1000);
            const rowY = 292 + i * 52;
            return (
              <g key={rate}>
                <text x="25" y={rowY + 18} className="csnet-row-label">
                  {rate === 1000 ? '1 Gbit/s' : '100 Mbit/s'}
                </text>
                <rect x="155" y={rowY} width={tx * 2500} height="24" className="csnet-delay-send" />
                <text x={170 + tx * 2500} y={rowY + 18} className="csnet-row-label">
                  {tx} ms
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <figcaption>
        上方长条分成发送（蓝色）与传播（绿色），两行共用时间比例，包完全到达只从 5.12 ms 提前到
        5.012 ms。 下方单独放大发送区间，两行也共用比例；它们不能与上方长条直接比较长度。
        带宽增加没有改变传播速度或距离，因此 5 ms 这一段保持不变。
      </figcaption>
    </figure>
  );
}

export const POST_COMPONENTS = { LinkSnapshots, LinkTiming, LinkBandwidthComparison };
