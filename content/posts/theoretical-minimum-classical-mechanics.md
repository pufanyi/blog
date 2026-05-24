## The Principle of Least Action

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

具体证明的话，*The Theoretical Minimum* 和 *The Feynman Lectures on Physics* 里的证明不太一样。

<details>
<summary>*The Theoretical Minimum* 的证明</summary>
</details>
