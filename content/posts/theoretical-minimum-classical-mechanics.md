## The Principle of Least Action

定义 $T$ 为动能，$V$ 为势能

Lagrangian

$$
L = T - V = L(x, \dot{x}, t)
$$

书里面写的是 $L(x, \dot{x})$，感觉像是假设势能场是不变的。加上 $t$ 的话 $V$ 就可以写成 $V(x, t)$ 了。

The action of a trajectory is written

$$
\mathcal{A} = \int_{t_0}^{t_1}L(x, \dot{x}, t)\mathrm{d}t
$$

这里的 Least Action 其实不是 least，是 stationary，也就是 $\delta \mathcal{A}=0$。

然后根据 Euler-Lagrange equation

$$
\frac{\mathrm{d}}{\mathrm{d}t}\frac{\partial L}{\partial \dot{x}} - \frac{\partial L}{\partial x}=0
$$

具体证明的话，*The Theoretical Minimum* 和 [*The Feynman Lectures on Physics*](https://www.feynmanlectures.caltech.edu/II_19.html) 里的证明不太一样。TM 是把 $L$ 看成 $t$ 上的黎曼和，然后对每一小段进行求导。FL 那本书的证明挺标准化的，我们不如再标准化一点，去复习一下 Bishop 那本 [Deep Learning](https://www.bishopbook.com/) 里的证明。

<details>
<summary>The Theoretical Minimum 的证明</summary>

他是把积分看成求和

$$
\begin{aligned}
\mathcal{A} &= \int_{t_0}^{t_1}L(x, \dot{x}, t)\mathrm{d}t\\
&=\sum_{n}L(x_n, \dot{x}_n, t)\Delta t\\
&=\sum_{n}L\left(x_n, \frac{x_{n+1}-x_n}{\Delta t}, t\right)\Delta t
\end{aligned}
$$

酱紫

$$
\frac{\partial \mathcal{A}}{\partial x_n} = \left(\frac{\partial}{\partial x_n}L\left(x_n, \frac{x_{n+1}-x_n}{\Delta t}, t\right)+\frac{\partial}{\partial x_n}L\left(x_{n-1}, \frac{x_n-x_{n-1}}{\Delta t}, t\right)\right)\Delta t
$$

其中

$$
\frac{\partial}{\partial x_n}L\left(x_n, \frac{x_{n+1}-x_n}{\Delta t}, t\right)
=
\left.\frac{\partial L}{\partial x}\right|_{n}-\frac{1}{\Delta t}\cdot\left.\frac{\partial L}{\partial\dot{x}}\right|_{n}
$$

然后

$$
\frac{\partial}{\partial x_n}L\left(x_{n-1}, \frac{x_n-x_{n-1}}{\Delta t}, t\right)
=
\frac{1}{\Delta t}\cdot\left.\frac{\partial L}{\partial \dot{x}}\right|_{n-1}
$$

所以说

$$
\frac{\partial \mathcal{A}}{\partial x_n}
=
\Delta t \left.\frac{\partial L}{\partial x}\right|_{n}-\left(\left.\frac{\partial L}{\partial\dot{x}}\right|_{n}-\left.\frac{\partial L}{\partial \dot{x}}\right|_{n-1}\right)
$$

考虑到 $\mathcal{A}$ 要 stationary，也就是 $\frac{\partial\mathcal{A}}{\partial x_n}=0$：

$$
\left.\frac{\partial L}{\partial x}\right|_{n}-\frac{1}{\Delta t}\left(\left.\frac{\partial L}{\partial\dot{x}}\right|_{n}-\left.\frac{\partial L}{\partial \dot{x}}\right|_{n-1}\right)=0
$$

也就是

$$
\frac{\partial L}{\partial x}-\frac{\mathrm{d}}{\mathrm{d}t}\frac{\partial L}{\partial \dot{x}}=0
$$

</details>

<details>
<summary>Bishop Deep Learning 的证明</summary>

Bishop 书里详细定义了 $\delta F$，对于 funcional $F(y(x))$，我们定义 $\frac{\delta F}{\delta y(x)}$：

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

我们之后想让 $\frac{\delta F}{\delta y(x)}=0$ 然后去解，所以我们希望把 $\eta(x)$ 消掉，我们考虑对 $\frac{\partial G}{\partial y'}\eta'$ 做分步积分：

$$
\int_l^r\frac{\partial G}{\partial y'}\eta'(x)\mathrm{d}x
=\int_l^r\frac{\partial G}{\partial y'}\mathrm{d}\eta
=\left.\left(\eta\frac{\partial G}{\partial y'}\right)\right|_l^r-\int_l^r\frac{\mathrm{d}}{\mathrm{d}x}\left(\frac{\partial G}{\partial y'}\right)
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
