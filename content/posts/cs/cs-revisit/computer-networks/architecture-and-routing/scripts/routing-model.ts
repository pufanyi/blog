export const networkNodes = [
  { id: 'A', x: 65, y: 80 },
  { id: 'B', x: 235, y: 80 },
  { id: 'C', x: 405, y: 80 },
  { id: 'D', x: 235, y: 255 },
] as const;
export const networkEdges = [
  { from: 'A', to: 'B', cost: 1, labelX: 150, labelY: 62 },
  { from: 'B', to: 'C', cost: 1, labelX: 320, labelY: 62 },
  { from: 'C', to: 'D', cost: 2, labelX: 335, labelY: 184 },
  { from: 'B', to: 'D', cost: 5, labelX: 216, labelY: 173 },
  { from: 'A', to: 'D', cost: 7, labelX: 135, labelY: 184 },
] as const;
export type NodeId = (typeof networkNodes)[number]['id'];
export interface Route {
  cost: number;
  via: string | null;
}
export interface RoutingFrame {
  title: string;
  explanation: string;
  routes: Record<string, Route>;
  arrows: [string, string][];
  settled: string[];
  failed: boolean;
}
export const costLabel = (cost: number) => (Number.isFinite(cost) ? String(cost) : '∞');
const copyRoutes = (routes: Record<string, Route>) =>
  Object.fromEntries(Object.entries(routes).map(([id, route]) => [id, { ...route }]));
const forwardingArrows = (routes: Record<string, Route>): [string, string][] =>
  Object.entries(routes).flatMap(([id, route]) =>
    route.via && Number.isFinite(route.cost) ? [[id, route.via] as [string, string]] : [],
  );

export function distanceVectorFrames(): RoutingFrame[] {
  let routes: Record<string, Route> = Object.fromEntries(
    networkNodes.map(({ id }) => [id, { cost: id === 'D' ? 0 : Infinity, via: null }]),
  );
  const frames: RoutingFrame[] = [];
  for (let round = 0; round <= 3; round++) {
    frames.push({
      title: `同步轮次 ${round}`,
      explanation:
        round === 0
          ? '只有 D 知道自己距离为 0。虚线是物理链路；箭头表示当前选择的 next hop。'
          : round === 1
            ? 'D 的 0 传到直接邻居：A=7，B=5，C=2。数据箭头指回 D。'
            : round === 2
              ? 'B 使用 C 上一轮的 2，得到 1+2=3；A 只能使用 B 上一轮的 5，得到 6。'
              : 'A 收到 B 的 3，得到 1+3=4。信息向外传播，数据沿 A→B→C→D 交付。',
      routes: copyRoutes(routes),
      arrows: forwardingArrows(routes),
      settled: [],
      failed: false,
    });
    const next = copyRoutes(routes);
    for (const { id } of networkNodes) {
      if (id === 'D') continue;
      for (const edge of networkEdges) {
        const neighbor = edge.from === id ? edge.to : edge.to === id ? edge.from : null;
        if (!neighbor) continue;
        const candidate = edge.cost + routes[neighbor].cost;
        if (candidate < next[id].cost) next[id] = { cost: candidate, via: neighbor };
      }
    }
    routes = next;
  }
  return frames;
}

export function failureFrames(poisonReverse: boolean): RoutingFrame[] {
  const routes: Record<string, Route> = {
    D: { cost: 0, via: null },
    A: { cost: 1, via: 'D' },
    B: { cost: 2, via: 'A' },
  };
  const frames: RoutingFrame[] = [];
  const add = (title: string, explanation: string, failed: boolean) =>
    frames.push({
      title,
      explanation,
      routes: copyRoutes(routes),
      arrows: forwardingArrows(routes),
      settled: [],
      failed,
    });
  add('故障前', 'D—A—B，两条链路 cost=1。B 经 A 到 D，距离为 2。', false);
  routes['A'] = { cost: Infinity, via: null };
  add('A 检测到 D—A 断开', 'A 已经失去直达路线；B 尚未收到坏消息，仍保留旧路线。', true);
  if (poisonReverse) {
    add(
      'B→A 通告 ∞',
      'B 的 next hop 是 A，因此向 A 报 ∞；向其他邻居仍可报真实距离 2。A 不会把 B 当作备用出口。',
      true,
    );
    routes['B'] = { cost: Infinity, via: null };
    add(
      'A→B 通告 ∞',
      'A 的 route poisoning 使 B 也失效。前一步是按邻居改写报告，这一步是自己的路线不可达。',
      true,
    );
    return frames;
  }
  let receiver = 'A';
  let sender = 'B';
  while (Number.isFinite(routes['A'].cost) || Number.isFinite(routes['B'].cost)) {
    const advertised = routes[sender].cost;
    const candidate = advertised + 1;
    routes[receiver] = {
      cost: candidate >= 16 ? Infinity : candidate,
      via: candidate >= 16 ? null : sender,
    };
    add(
      `${sender}→${receiver} 通告 ${costLabel(advertised)}`,
      !Number.isFinite(advertised)
        ? `${receiver} 收到 ∞，也撤销依赖 ${sender} 的路线。二者都已不可达。`
        : candidate >= 16
          ? `${receiver} 的候选达到 RIP 的不可达值 16，记为 ∞。这是 metric 上限，不是 packet TTL。`
          : `${receiver} 得到 1+${advertised}=${candidate}，选择 ${sender}。报告仍然依赖接收者自己，距离增加却没有新出口。`,
      true,
    );
    [receiver, sender] = [sender, receiver];
  }
  return frames;
}

export function dijkstraFrames(): RoutingFrame[] {
  const routes: Record<string, Route> = Object.fromEntries(
    networkNodes.map(({ id }) => [id, { cost: id === 'A' ? 0 : Infinity, via: null }]),
  );
  const settled = new Set<string>();
  const frames: RoutingFrame[] = [];
  while (settled.size < networkNodes.length) {
    const node = networkNodes
      .filter(({ id }) => !settled.has(id))
      .reduce((best, candidate) =>
        routes[candidate.id].cost < routes[best.id].cost ? candidate : best,
      );
    settled.add(node.id);
    const updates: string[] = [];
    for (const edge of networkEdges) {
      const neighbor = edge.from === node.id ? edge.to : edge.to === node.id ? edge.from : null;
      if (!neighbor || settled.has(neighbor)) continue;
      const candidate = routes[node.id].cost + edge.cost;
      if (candidate < routes[neighbor].cost) {
        routes[neighbor] = { cost: candidate, via: node.id };
        updates.push(`${neighbor}=${routes[node.id].cost}+${edge.cost}=${candidate}`);
      }
    }
    frames.push({
      title: `固定 ${node.id}，距离 ${routes[node.id].cost}`,
      explanation: `${updates.length ? `Relax 邻接边：${updates.join('；')}。` : '所有节点已固定。'}实心节点已固定；箭头表示从 A 出发的前驱树方向，不是所有节点去 D 的转发表。`,
      routes: copyRoutes(routes),
      arrows: Object.entries(routes).flatMap(([id, route]) =>
        route.via ? [[route.via, id] as [string, string]] : [],
      ),
      settled: [...settled],
      failed: false,
    });
  }
  return frames;
}

export const prefixRoutes = [
  { prefix: '0.0.0.0/0', length: 0, network: 0, action: '默认出口' },
  { prefix: '192.0.2.0/23', length: 23, network: 0xc0000200, action: '出口 P' },
  { prefix: '192.0.3.0/24', length: 24, network: 0xc0000300, action: '出口 Q' },
  { prefix: '192.0.3.42/32', length: 32, network: 0xc000032a, action: '出口 R' },
] as const;
export function prefixLookup(address: string, withdraw24 = false) {
  const parts = address.split('.');
  if (
    parts.length !== 4 ||
    parts.some((part) => !/^(0|[1-9]\d{0,2})$/.test(part) || Number(part) > 255)
  )
    return null;
  const value = parts.reduce((total, part) => total * 256 + Number(part), 0);
  const matches = prefixRoutes.map((route) => {
    const mask = route.length === 0 ? 0 : (0xffffffff << (32 - route.length)) >>> 0;
    return !(withdraw24 && route.length === 24) && (value & mask) >>> 0 === route.network;
  });
  const winner = matches.lastIndexOf(true);
  return { matches, winner, action: prefixRoutes[winner].action };
}
