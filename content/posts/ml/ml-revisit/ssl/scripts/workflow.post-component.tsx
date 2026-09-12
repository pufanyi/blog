import { Arrow, Box, Figure, ImageTile, Label, MathLabel, Vector } from './elements';

function SSLWorkflow() {
  const id = 'ssl-workflow';
  return (
    <Figure
      id={id}
      title="预训练学 encoder，下游任务复用表征"
      description="上半图：同一图像产生两个 views，经共享 encoder 得到 h，训练 head 产生用于自监督目标的输出。下半图：预训练结束后复用 encoder，分类、检索或分割直接使用 backbone features；预训练 head 通常移除。"
      caption="先分清两个空间：训练 head 服务于自监督任务，下游任务通常复用 encoder 的表征。"
      height={322}
    >
      <Label x={330} y={25}>
        预训练：从数据自身构造监督
      </Label>
      <ImageTile x={20} y={62} size={64} />
      <ImageTile x={129} y={44} size={45} />
      <ImageTile x={136} y={101} size={38} local />
      <Arrow id={id} d="M 86 94 H 108 V 66 H 126 M 108 94 V 120 H 132" />
      <Box x={215} y={65} width={115} label="Encoder" sub="两份 view 共享" />
      <Arrow id={id} d="M 177 67 H 197 V 82 H 213 M 177 120 H 197 V 100 H 213" />
      <Vector x={361} y={76} />
      <MathLabel x={350} y={113} width={54} tex="h" />
      <Box x={432} y={65} width={103} label="训练 Head" />
      <Box x={572} y={65} width={76} label="SSL loss" tone="clay" />
      <Arrow id={id} d="M 332 91 H 354 M 401 91 H 430 M 537 91 H 570" />
      <Arrow id={id} d="M 609 120 V 165 H 272 V 120" gradient />
      <Label x={430} y={185} note>
        点线：loss 经 head 反传，更新 encoder
      </Label>
      <path d="M 16 203 H 644" className="ssl-divider" />
      <Label x={95} y={233}>
        下游任务
      </Label>
      <ImageTile x={30} y={251} size={44} />
      <Box x={215} y={246} width={115} label="Encoder" sub="复用预训练参数" />
      <Vector x={361} y={256} />
      <Box
        x={432}
        y={246}
        width={216}
        label="分类 / 检索 / 分割"
        sub="按任务选择特征与评估方式"
        tone="teal"
      />
      <Arrow id={id} d="M 77 272 H 213 M 332 272 H 354 M 401 272 H 430" />
    </Figure>
  );
}

// Adjacent entries are two views of the same image; the matrix and labels
// derive their positive/self roles from these identities.
export const SIMCLR_VIEWS = ['A', 'A', 'B', 'B', 'C', 'C'];
const VIEWS = SIMCLR_VIEWS.map((image, index) => `${image}_${(index % 2) + 1}`);
export function simclrCandidate(anchor: number, candidate: number) {
  return anchor === candidate
    ? 'self'
    : SIMCLR_VIEWS[anchor] === SIMCLR_VIEWS[candidate]
      ? 'positive'
      : 'negative';
}

function SimCLRBatch() {
  const id = 'ssl-simclr-batch';
  return (
    <Figure
      id={id}
      title="SimCLR：两个 view 如何变成 batch 内的分类任务"
      description="例子有三张原图，每张产生两份 view，共六个向量。相似度矩阵每行轮流作为 anchor，自身所在的对角格排除，同图另一 view 为唯一 positive，其余四格为 negatives。Encoder 和 projector 共享，所有 views 都接收梯度。"
      caption="例子取 3 张图：每行保留 5 个候选，其中 1 个 positive、4 个 negatives。带 × 的自身不进入分母。"
      height={372}
    >
      <Label x={154} y={27}>
        同一张图的两份增强
      </Label>
      <ImageTile x={20} y={54} size={55} />
      <ImageTile x={21} y={137} size={53} local />
      <Box x={109} y={56} width={165} label="Encoder → projector" sub="共享参数；两侧都反传" />
      <Box x={109} y={139} width={165} label="Encoder → projector" sub="再做单位化" />
      <Vector x={310} y={68} />
      <Vector x={310} y={151} tone="teal" />
      <Arrow id={id} d="M 77 82 H 107 M 77 165 H 107 M 276 82 H 304 M 276 165 H 304" />
      <MathLabel x={304} y={96} width={48} tex="A_1" />
      <MathLabel x={304} y={179} width={48} tex="A_2" />
      <Label x={167} y={238} note>
        另外两张图也各自产生两份 view
      </Label>
      <Label x={535} y={27}>
        与全部 views 比相似度
      </Label>
      {VIEWS.map((name, i) => (
        <g key={name}>
          <MathLabel x={435 + i * 34} y={34} width={32} height={24} tex={name} />
          <MathLabel x={399} y={65 + i * 34} width={32} height={24} tex={name} />
          {VIEWS.map((_, j) => {
            const role = simclrCandidate(i, j);
            return (
              <g key={j} data-candidate-role={role}>
                <rect
                  x={436 + j * 34}
                  y={63 + i * 34}
                  width="30"
                  height="30"
                  className={
                    role === 'self'
                      ? 'ssl-excluded'
                      : role === 'positive'
                        ? 'ssl-positive'
                        : 'ssl-cell'
                  }
                />
                {role !== 'negative' && (
                  <Label x={451 + j * 34} y={83 + i * 34} note>
                    {role === 'self' ? '×' : '+'}
                  </Label>
                )}
              </g>
            );
          })}
        </g>
      ))}
      <rect x="432" y="59" width="208" height="38" rx="3" className="ssl-highlight" />
      <Label x={330} y={302}>
        选第一行作 anchor：提高同图另一 view 相对于其余候选的概率
      </Label>
      <Label x={330} y={330} note>
        棕框：当前 anchor 行&#x3000;&#x3000;绿色 +：positive&#x3000;&#x3000;空白格：negatives
      </Label>
      <Label x={330} y={350} note>
        矩阵表示候选关系，不是训练得到的相似度数值
      </Label>
    </Figure>
  );
}

export const POST_COMPONENTS = { SSLWorkflow, SimCLRBatch };
