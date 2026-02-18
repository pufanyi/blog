## Question

Let $a, b$ be real numbers, and $a>1$. Consider the function $f(x)=a^x-bx+e^2$ ($x\in\mathbb{R}$).

1. Find the monotonic intervals of the function $f(x)$.
2. If for any $b>2e^2$, the function $f(x)$ has two different zeros, find the range of $a$.
3. When $a=e$, prove that: for any $b>e^4$, the function $f(x)$ has two different zeros $x_1, x_2$, satisfying $x_2>\frac{b\ln b}{2e^2}x_1 + \frac{e^2}{b}$.

**Note**:

1. $e=2.71828\cdots$ is the base of the natural logarithm.
2. We define the natural logarithm as $\ln x$, which is $\ln x=\log_e x$.

<details>
<summary>中文原题</summary>

设 $a, b$ 为实数，且 $a>1$，函数 $f(x)=a^x-bx+e^2$ ($x\in\mathbb{R}$)

1. 求函数 $f(x)$ 的单调区间；
2. 若对任意 $b>2e^2$，函数 $f(x)$ 有两个不同的零点，求 $a$ 的取值范围；
3. 当 $a=e$ 时，证明：对任意 $b>e^4$，函数 $f(x)$ 有两个不同的零点 $x_1, x_2$，满足 $x_2>\frac{b\ln b}{2e^2}x_1 + \frac{e^2}{b}$。

注：$e=2.71828\cdots$ 是自然对数的底数。

</details>

## Solution

### Part 1

The derivative of $f(x)$ is

$$
f'(x)=a^x\ln a-b
$$

$f''(x)=a^x\ln^2 a>0$, so $f'(x)$ is an strictly increasing function.

When $b<0$, $f'(x)>\lim_{x\to-\infty}f'(x)=0$, so $f(x)$ is an strictly increasing function.

When $b\ge 0$, solving $f'(x)=0$ we can get $x=\log_a\frac{b}{\ln a}$. Since $f'(x)$ is increasing, we have:

|    $x$    | $x\in\left(-\infty, \log_a\frac{b}{\ln a}\right)$ | $x=\log_a\frac{b}{\ln a}$  | $x\in\left(\log_a\frac{b}{\ln a}, +\infty\right)$ |
| :-------: | :-------------------------------------------------: | :--------------------------: | :-------------------------------------------------: |
| $f'(x)$ |                     $f'(x)<0$                     |         $f'(x)=0$          |                     $f'(x)>0$                     |
| $f(x)$  |               $f(x)$ is decreasing                | $f(x)$ has a local minimum |               $f(x)$ is increasing                |

As a result, when $b<0$, $f(x)$ has a monotonically increasing interval $(-\infty, +\infty)$; when $b\ge 0$, $f(x)$ has a monotonically decreasing interval $\left(-\infty, \log_a\frac{b}{\ln a}\right)$ and a monotonically increasing interval $\left(\log_a\frac{b}{\ln a}, +\infty\right)$.

### Part 2

Given that $b>2e^2>0$, the function $f(x)$ has a local minimum at $x=\log_a\frac{b}{\ln a}$.

Also, we have:

$$
\begin{aligned}
\lim_{x\to-\infty}f(x)&=\lim_{x\to-\infty}a^x-bx+e^2=\infty\\
\lim_{x\to+\infty}f(x)&=\lim_{x\to+\infty}a^x-bx+e^2=\infty
\end{aligned}
$$

Therefore, $f(x)$ has two distinct zeros if and only if $f\left(\log_a\frac{b}{\ln a}\right)<0$.

Let's simplify $f\left(\log_a\frac{b}{\ln a}\right)$:

$$
\begin{aligned}
f\left(\log_a\frac{b}{\ln a}\right)&=a^{\log_a\frac{b}{\ln a}}-b\log_a\frac{b}{\ln a}+e^2\\
&=\frac{b}{\ln a}-b\cdot\left(\log_ab-\log_a\ln a\right)+e^2\\
&=\frac{b}{\ln a}-\frac{b\ln b}{\ln a}+\frac{b\ln\ln a}{\ln a} + e^2\\
&=\frac{b}{\ln a}\left(1-\ln b+\ln\ln a\right)+e^2
\end{aligned}
$$

For $f\left(\log_a\frac{b}{\ln a}\right)<0$ to hold, we must ensure:

$$
\lim_{b\to \left(2e^{2}\right)^+}f\left(\log_a\frac{b}{\ln a}\right)\le 0
$$

This implies:

$$
\begin{aligned}
0&\ge \lim_{b\to {\left(2e^{2}\right)}^+}f\left(\log_a\frac{b}{\ln a}\right)\\
&=\lim_{b\to \left(2e^{2}\right)^+}\frac{b}{\ln a}\left(1-\ln b+\ln\ln a\right)+e^2\\
&=\frac{2e^2}{\ln a}\left(1-\ln\left(2e^2\right)+\ln\ln a\right)+e^2\\
&=\frac{2e^2}{\ln a}\left(\ln\ln a-1-\ln 2\right)+e^2\\
\end{aligned}
$$

Hence, we should have:

$$
2e^2\left(\ln\ln a-1-\ln 2\right)+e^2\ln a\le 0
$$

This simplifies to:

$$
2\ln\ln a+\ln a\le 2\ln 2+2
$$

Let's define $\phi(x)=2\ln x+x$. The inequality above is equivalent to:

$$
\phi(\ln a)\le \phi(2)
$$

Given that $\phi(x)$ is a strictly increasing function, we can have:

$$
\ln a\le 2\Rightarrow a\le e^2
$$

However, this is not the final answer since we should consider the whole range of $b>2e^2$ instead of a specific value of $b\to \left(2e^2\right)^+$. But we have a necessary condition for $a$ to satisfy.

From $f\left(\log_a\frac{b}{\ln a}\right)<0$, we can get:

$$
\frac{b}{\ln a}(1-\ln b+\ln\ln a)+e^2<0
$$

Let

$$
g(a, b)=\frac{b}{\ln a}(1-\ln b+\ln\ln a)+e^2
$$

We have:

$$
\frac{\partial g}{\partial b}=\frac{1}{\ln a}(1-\ln b+\ln\ln a)-\frac{b}{\ln a}\cdot\frac{1}{b}=\frac{\ln\ln a-\ln b}{\ln a}
$$

When $a\le e^2, b>2e^2$,

$$
\ln\ln a-\ln b\le \ln\ln e^2-\ln 2e^2=\ln 2-\ln 2-2=-2<0
$$

So $\frac{\partial g}{\partial b}<0$ which means when $a\le e^2$,

$$
g(a, b) < g(a, 2e^2)\le 0
$$

So when $a\le e^2$, $f(x)=0$ must have two distinct solutions.

In conclusion, the range of $a$ is $\left(1, e^2\right]$.

### Part 3

When $a=e\in(1, e^2], b>e^4>2e^2$, so $f(x)=0$ has two distinct solutions.

Let $x_1, x_2$ be the two solutions, and $x_1<x_2$:

$$
\begin{cases}
e^{x_1}-bx_1+e^2=0 & (1)\\
e^{x_2}-bx_2+e^2=0 & (2)
\end{cases}
$$

$(1) - (2)$, we have:

$$
e^{x_1}-e^{x_2}-b(x_1-x_2)=0\Rightarrow \frac{e^{x_1}-e^{x_2}}{x_1-x_2}=b
$$

然后不会了啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊，有空再来更
