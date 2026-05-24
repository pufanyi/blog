## The Principle of Least Action

读这一章的时候参考了 [The Feynman Lectures on Physics](https://www.feynmanlectures.caltech.edu/II_19.html)。

定义 $T$ 为动能，$V$ 为势能

Lagrangian

$$
L = T - V = L(x, \dot{x}, t)
$$

书里面写的是 $L(x, \dot{x})$，感觉像是假设势能场是不变的。

The action of a trajectory is written

$$
\mathcal{A} = \int_{t_0}^{t_1}L(x, \dot{x}, t)\mathrm{d}t
$$

这里的 Least Action 其实不是 least，是 stationary，也就是 $\delta \mathcal{A}=0$。

然后根据 Euler-Lagrange equation

$$
\frac{\mathrm{d}}{\mathrm{d}t}\frac{\partial L}{\partial \dot{x}} - \frac{\partial L}{\partial x}=0
$$

具体证明的话，*The Theoretical Minimum* 和 *The Feynman Lectures on Physics* 里的证明不太一样。TM 是把 $L$ 看成 $t$ 上的黎曼和，然后对每一小段进行求导。FL 里的就是标准的去加 $\eta(t)$ 一阶泰勒然后一阶导等于 $0$ 酱紫。

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
\frac{\partial}{\partial x_n}L\left(x_n, \frac{x_{n+1}-x_n}{\Delta t}\right)
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
