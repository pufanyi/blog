## The Principle of Least Action

在 Lagrangian mechanics 中，我们尝试用一个函数 $L(q,
\dot{q},t)$ 来描述系统的动力学。这个函数我们叫 Lagrangian。在牛顿力学中，如果 $T$ 为动能，$V$ 为势能，Lagrangian

$$
\mathcal{L}(x, \dot{x}, t) = T - V
$$

书里面写的是 $\mathcal{L}(x, \dot{x})$，表示 Lagrangian 没有显含时间，比如说势能场和时间无关这种。

The action of a trajectory is written

$$
\mathcal{A} = \int_{t_0}^{t_1}\mathcal{L}(x, \dot{x}, t)\mathrm{d}t
$$

The Principle of Least Action 讲的是，物体运动轨迹的真实路径是在起点和终点固定的所有可能路径中，使 action stationary 的路径，也就是 $\delta\mathcal{A}=0$。所以这里的 Least Action 其实不是 least，是 stationary。

需要注意的是，因为 *The Theoretical Minimum* 的讲述顺序，很容易把 $\mathcal{L}=T-V$ 刻在脑子里。但事实上 $\mathcal{L}$ 不一定是 $T-V$，只要它能够给出正确的运动方程，就可以作为这个系统的 Lagrangian。这里觉得 [*The Feynman Lectures on Physics*](https://www.feynmanlectures.caltech.edu/II_19.html) 里头讲的更清楚一点，他里面举的例子是带电粒子在电磁场中的运动：

$$
\mathcal{L} = -m_0 c^2 \sqrt{1 - v^2/c^2} - q(\phi - \boldsymbol{v} \cdot \boldsymbol{A}).
$$

引用一下他的这段话：

> I would like to emphasize that in the general case, for instance in the relativistic formula, the action integrand no longer has the form of the kinetic energy minus the potential energy. That’s only true in the nonrelativistic approximation. For example, the term $m_0c^2\sqrt{1-\frac{v^2}{c^2}}$ is not what we have called the kinetic energy. The question of what the action should be for any particular case must be determined by some kind of trial and error. It is just the same problem as determining what are the laws of motion in the first place. You just have to fiddle around with the equations that you know and see if you can get them into the form of the principle of least action.

Lagrangian 不是唯一的。给 Lagrangian 加一个 total time derivative $\frac{\mathrm{d}}{\mathrm{d}t}F(x, t)$ 不会影响结果，因为

$$
\begin{aligned}
\mathcal{A}' &= \int_{t_0}^{t_1} L'\mathrm{d}t\\
&= \int_{t_0}^{t_1}\left(L+\frac{\mathrm{d}}{\mathrm{d}t}F(x, t)\right)\mathrm{d}t\\
&= \int_{t_0}^{t_1}\mathcal{L}\mathrm{d}t+F(x_1, t_1) - F(x_0, t_0)\\
&=A+F(x_1, t_1) - F(x_0, t_0)
\end{aligned}
$$

也就是 $\mathcal{A}$ 加了个常数。

我们尝试解 $\delta\mathcal{A} = 0$。根据 Euler-Lagrange equation，我们有

$$
\frac{\mathrm{d}}{\mathrm{d}t}\frac{\partial \mathcal{L}}{\partial \dot{x}} - \frac{\partial \mathcal{L}}{\partial x}=0
$$

具体证明的话，*The Theoretical Minimum* 和 [*The Feynman Lectures on Physics*](https://www.feynmanlectures.caltech.edu/II_19.html) 里的证明不太一样。TM 是把 $\mathcal{L}$ 看成 $t$ 上的黎曼和，然后对每一小段进行求导。FL 那本书的证明挺标准化的，我们不如再标准化一点，去复习一下 Bishop 那本 [*Deep Learning*](https://www.bishopbook.com/) 里的证明。

<details>
<summary>The Theoretical Minimum 的证明</summary>

他是把积分看成求和

$$
\begin{aligned}
\mathcal{A} &= \int_{t_0}^{t_1}\mathcal{L}(x, \dot{x}, t)\mathrm{d}t\\
&=\sum_{n}\mathcal{L}(x_n, \dot{x}_n, t)\Delta t\\
&=\sum_{n}\mathcal{L}\left(x_n, \frac{x_{n+1}-x_n}{\Delta t}, t\right)\Delta t
\end{aligned}
$$

酱紫

$$
\frac{\partial \mathcal{A}}{\partial x_n} = \left(\frac{\partial}{\partial x_n}\mathcal{L}\left(x_n, \frac{x_{n+1}-x_n}{\Delta t}, t\right)+\frac{\partial}{\partial x_n}\mathcal{L}\left(x_{n-1}, \frac{x_n-x_{n-1}}{\Delta t}, t\right)\right)\Delta t
$$

其中

$$
\frac{\partial}{\partial x_n}\mathcal{L}\left(x_n, \frac{x_{n+1}-x_n}{\Delta t}, t\right)
=
\left.\frac{\partial \mathcal{L}}{\partial x}\right|_{n}-\frac{1}{\Delta t}\cdot\left.\frac{\partial \mathcal{L}}{\partial\dot{x}}\right|_{n}
$$

然后

$$
\frac{\partial}{\partial x_n}\mathcal{L}\left(x_{n-1}, \frac{x_n-x_{n-1}}{\Delta t}, t\right)
=
\frac{1}{\Delta t}\cdot\left.\frac{\partial \mathcal{L}}{\partial \dot{x}}\right|_{n-1}
$$

所以说

$$
\frac{\partial \mathcal{A}}{\partial x_n}
=
\Delta t \left.\frac{\partial \mathcal{L}}{\partial x}\right|_{n}-\left(\left.\frac{\partial \mathcal{L}}{\partial\dot{x}}\right|_{n}-\left.\frac{\partial \mathcal{L}}{\partial \dot{x}}\right|_{n-1}\right)
$$

考虑到 $\mathcal{A}$ 要 stationary，也就是 $\frac{\partial\mathcal{A}}{\partial x_n}=0$：

$$
\left.\frac{\partial \mathcal{L}}{\partial x}\right|_{n}-\frac{1}{\Delta t}\left(\left.\frac{\partial \mathcal{L}}{\partial\dot{x}}\right|_{n}-\left.\frac{\partial \mathcal{L}}{\partial \dot{x}}\right|_{n-1}\right)=0
$$

也就是

$$
\frac{\partial \mathcal{L}}{\partial x}-\frac{\mathrm{d}}{\mathrm{d}t}\frac{\partial \mathcal{L}}{\partial \dot{x}}=0
$$

</details>

<details>
<summary>Bishop Deep Learning 的证明</summary>

Bishop 书里详细定义了 $\delta F$，对于 functional $F(y(x))$，我们定义 $\frac{\delta F}{\delta y(x)}$：

$$
F(y(x)+\epsilon \eta(x))=F(y(x))+\epsilon\int_l^r\frac{\delta F}{\delta y(x)}\eta(x)\mathrm{d}x+\mathcal{O}(\epsilon^2)
$$

其中 $\eta(l)=\eta(r)=0$。

那我们假设

$$
F(y(x)) = \int_l^r G(y(x), y'(x), x)\mathrm{d}x
$$

我们有

$$
\begin{aligned}
F(y(x) + \epsilon \eta(x))
&=\int_l^r G(y(x) + \epsilon\eta(x), y'(x)+\epsilon\eta'(x), x)\mathrm{d}x\\
&=\int_l^r \left(G(y(x), y'(x),x)+\frac{\partial G}{\partial y}\cdot \epsilon\eta(x)+\frac{\partial G}{\partial y'}\cdot\epsilon\eta'(x)+\mathcal{O}(\epsilon^2)\right)\mathrm{d}x\\
&=F(y(x))+\epsilon\int_l^r\left(\frac{\partial G}{\partial y}\eta(x)+\frac{\partial G}{\partial y'}\eta'(x)\right)\mathrm{d}x+\mathcal{O}(\epsilon^2)
\end{aligned}
$$

我们之后想让 $\frac{\delta F}{\delta y(x)}=0$ 然后去解，所以我们希望把 $\eta'(x)$ 消掉，只留下 $\eta$。我们考虑对 $\frac{\partial G}{\partial y'}\eta'$ 做分部积分：

$$
\int_l^r\frac{\partial G}{\partial y'}\eta'(x)\mathrm{d}x
=\int_l^r\frac{\partial G}{\partial y'}\mathrm{d}\eta
=\left.\left(\eta\frac{\partial G}{\partial y'}\right)\right|_l^r-\int_l^r\eta(x)\frac{\mathrm{d}}{\mathrm{d}x}\left(\frac{\partial G}{\partial y'}\right)\mathrm{d}x
$$

考虑到 $\eta(l)=\eta(r)=0$，我们有

$$
\int_l^r\frac{\partial G}{\partial y'}\eta'(x)\mathrm{d}x
=-\int_l^r\eta(x)\frac{\mathrm{d}}{\mathrm{d}x}\left(\frac{\partial G}{\partial y'}\right)\mathrm{d}x
$$

所以

$$
F(y(x) + \epsilon \eta(x))
=F(y(x))+\epsilon\int_l^r\left(\frac{\partial G}{\partial y}-\frac{\mathrm{d}}{\mathrm{d}x}\left(\frac{\partial G}{\partial y'}\right)\right)\eta(x)\mathrm{d}x+\mathcal{O}(\epsilon^2)
$$

所以我们就能推出 Euler-Lagrange 方程：

$$
\frac{\partial G}{\partial y}-\frac{\mathrm{d}}{\mathrm{d}x}\left(\frac{\partial G}{\partial y'}\right)=0
$$

</details>

如果有多个物体的话，我们可以把他们的集合看成整体

$$
\mathcal{L}(\{x\}, \dot{\{x\}}, t) = \sum_{i}\left(\frac{1}{2}m_i \dot{x}_i^2\right)-V(\{x\}, t)
$$

Generalized momentum conjugate / Conjugate momentum:

$$
p_i = \frac{\partial \mathcal{L}}{\partial \dot{q}_i}
$$

其中 $q_i$ 可以是任意坐标系统。这里我们通常把 $x$ 当成普通的笛卡尔坐标，然后 $q_i$ 当成是任意坐标。

有时候 $q_i$ 不出现在 $\mathcal{L}$ 中，也就是 $\frac{\partial \mathcal{L}}{\partial q_i}=0$，我们就说 $q_i$ 是 cyclic coordinate。此时 $\mathcal{L}$ 可以依赖 $\dot{q}_i$，也可以依赖其他坐标和速度。

这时候

$$
\dot{p}_i = \frac{\mathrm{d}}{\mathrm{d}t}\left(\frac{\partial \mathcal{L}}{\partial\dot{q}_i}\right)=\frac{\partial \mathcal{L}}{\partial q_i} = 0
$$

也就是说 $p_i$ 一直不变。

举个例子，比如说一维坐标下有两个粒子在 $x_1, x_2$，我们有：

$$
\mathcal{L} = \frac{m}{2}\left(\dot{x}_1^2+\dot{x}_2^2\right)-V(x_1-x_2)
$$

如果我们取

$$
\begin{cases}
x_+=\frac{1}{2}(x_1+x_2)\\
x_-=\frac{1}{2}(x_1-x_2)
\end{cases}
$$

我们就有

$$
\mathcal{L} = m\left(\dot{x}_{+}^2+\dot{x}_{-}^2\right)-V(2x_{-})
$$

这时候我们就说 $x_{+}$ 是 cyclic coordinate，而 $p_{+}=2m\dot{x}_{+}=m\dot{x}_1+m\dot{x}_2$ 是不变的。

## Symmetries and Conservation Laws

对称性大概的意思是指，做了某个变换之后，系统的某个重要的东西没变。

关于变换，有时候我们可以做 infinitesimal steps，比如把 $x$ 移动到 $x+\delta$。这时候我们说这个 transformation 是 continuous 的。后续为了方便，我们记变换

$$
\delta q_i = f_i(q)\delta
$$

其实 $f_i$ 就类似于变换的导数嘛。比如对于平移变换，就是 $\delta q_i = \delta$。

那么

$$
\delta\dot{q}_i
=\frac{\mathrm{d}}{\mathrm{d}t}(q_i+\delta q_i) - \frac{\mathrm{d}}{\mathrm{d}t}q_i
= \frac{\mathrm{d}}{\mathrm{d}t}(\delta q_i)
$$

我们考虑在空间上作变换，我们有：

$$
\delta \mathcal{L} = \sum_{i}\left(\frac{\partial \mathcal{L}}{\partial\dot{q}_i}\delta\dot{q}_i+\frac{\partial\mathcal{L}}{\partial q_i}\delta q_i\right)+\frac{\partial \mathcal{L}}{\partial t}\delta t
$$

因为是在空间上作变换，$\delta t = 0$，所以我们可以只看前面的项：

$$
\delta \mathcal{L} = \sum_{i}\left(\frac{\partial \mathcal{L}}{\partial\dot{q}_i}\delta\dot{q}_i+\frac{\partial\mathcal{L}}{\partial q_i}\delta q_i\right)
$$

考虑到在真实运动轨迹上，$\frac{\partial \mathcal{L}}{\partial \dot{q}_i}=p_i, \frac{\partial\mathcal{L}}{\partial q_i} = \dot{p}_i$

所以

$$
\delta\mathcal{L} = \sum_{i}\left(p_i\delta\dot{q}_i+\dot{p}_i\delta q_i\right) = \sum_{i}\frac{\mathrm{d}}{\mathrm{d}t}\left(p_i\delta q_i\right) = \frac{\mathrm{d}}{\mathrm{d}t}\sum_i p_i\delta q_i
$$

如果变换关于 $\mathcal{L}$ 对称，也就是 $\delta \mathcal{L}=0$，那么

$$
\frac{\mathrm{d}}{\mathrm{d}t}\sum_i p_i f_i(q) = 0
$$

也就是

$$
\mathcal{Q} = \sum_i p_i f_i(q)
$$

守恒。

如果坐标一维的，这时候 $\delta q_i=\delta$ 也就是 $f_i = 1$，那么

$$
\mathcal{Q} = \sum_{i} p_i
$$

其实就是动量守恒。

如果是极坐标 $(r, \theta)$，我们有对于旋转变换

$$
\begin{cases}
\delta r = 0\\
\delta \theta = \delta
\end{cases}
$$

也就是

$$
\begin{cases}
f_r = 0\\
f_\theta = 1
\end{cases}
$$

那么

$$
\mathcal{Q} = \sum_i p_i f_i(q) = p_r \cdot 0 +p_\theta\cdot 1 = p_\theta
$$

守恒。

对于普通二维平面内的粒子

$$
\mathcal{L} = \frac{1}{2}m\left(\dot{r}^2+r^2\dot{\theta}^2\right)-V(r)
$$

所以

$$
p_\theta = \frac{\partial \mathcal{L}}{\partial \dot{\theta}} = mr^2\dot{\theta}
$$

所以其实就是角动量守恒。

## Hamiltonian Mechanics and Time-Translation Invariance

我们现在来看看在时间上变换会是什么样的结果：

$$
\begin{aligned}
\frac{\mathrm{d}\mathcal{L}}{\mathrm{d}t} &= \sum_{i}\left(\frac{\partial\mathcal{L}}{\partial q_i}\dot{q}_i+\frac{\partial \mathcal{L}}{\partial \dot{q}_i}\ddot{q}_i\right)+\frac{\partial\mathcal{L}}{\partial t}\\
&= \sum_{i}\left(\dot{p}_i\dot{q}_i + p_i\ddot{q}_i\right)+\frac{\partial\mathcal{L}}{\partial t}\\
&= \frac{\mathrm{d}}{\mathrm{d}t}\sum_{i}p_i\dot{q}_i+\frac{\partial\mathcal{L}}{\partial t}
\end{aligned}
$$

所以说我们有

$$
\frac{\mathrm{d}}{\mathrm{d}t}\left(\sum_{i}p_i\dot{q}_i-\mathcal{L}\right) = -\frac{\partial\mathcal{L}}{\partial t}
$$

也就是说，当 $\mathcal{L}$ 关于时间对称时：

$$
\mathcal{H} = \sum_{i}p_i\dot{q}_i - \mathcal{L}
$$

守恒。

这个 $\mathcal{H}$ 我们叫他 Hamiltonian。

对于牛顿力学里的

$$
\mathcal{L} = T - V = \frac{1}{2}m\dot{x}^2-V
$$

我们有

$$
\mathcal{H} = (m\dot{x})\dot{x} - \frac{1}{2}m\dot{x}^2+V=\frac{1}{2}m\dot{x}^2+V = T+V
$$

其实也就是能量。
