---
authors:
- name: Kembay, Assel
  affiliation: University of California, Santa Cruz
  email: akembay@ucsc.edu
- name: Eshraghian, Jason
  affiliation: University of California, Santa Cruz
  email: jeshragh@ucsc.edu
- name: Pedersen, Jens Egholm
  affiliation: Technical University of Denmark
  email: jegpe@dtu.dk
---
(surrogate_gradients)=
# Surrogate Gradient Training

```{draft}
```

In [](#credit_assignment), we established that training a neural network requires assigning credit to each component: which weight or neuron contributed to an error, and how should they change?
For classical neural networks, the backpropagation algorithm solves this by flowing gradients backward through the network.
For spiking neural networks, the same idea applies — but with a critical obstacle.

Spiking neurons communicate through discrete, all-or-nothing spikes, described by the Heaviside step function $\Theta$.
The derivative of $\Theta$ is zero almost everywhere and infinite at the threshold.
This means that standard backpropagation produces gradients that are either zero (killing learning) or undefined.

**Surrogate gradients** solve this problem with a simple trick: keep the Heaviside function during the forward pass, but replace its derivative with a smooth approximation during the backward pass.
This chapter explains the idea, derives the math, and walks through a complete training example.

```{note}
This chapter assumes familiarity with the $\texttt{LIF}$ neuron model from [](#sec:spk-nrn-lif) and the credit assignment problem from [](#credit_assignment).
Familiarity with the [Spike Response Model](https://neuronaldynamics.epfl.ch/online/Ch6.S4.html) is helpful but not required — we introduce the relevant ideas as needed.
```

## The non-differentiability problem

Recall from [](#chapter:point-neurons) that a spiking neuron emits a spike when its membrane potential $V[t]$ exceeds a threshold $V_\text{thr}$.
We can express this as:

```{math}
:label: eq:sg-spike-heaviside
S[t] = \Theta(V[t] - V_\text{thr})
```

where $\Theta(\cdot)$ is the Heaviside step function: it outputs $1$ when its argument is positive, and $0$ otherwise.

```{aside} Chain rule for function composition
In calculus, when you want to differentiate two composed functions $z$ and $y$ with respect to $x$, you take the derivative of $z$ evaluated at $y(x)$ and multiply by the derivative of $y$ with respect to $x$.
That is
$$\frac{d}{dx} z(y(x)) = z'(y(x)) \cdot y'(x)$$
For more, [see Wikipedia](https://en.wikipedia.org/wiki/Chain_rule).
```

Now consider training a single weight $W$ using gradient descent.
The loss $\mathcal{L}$ depends on the spike $S$, which depends on the membrane potential $V$, which depends on the input current $I = WX$.
The [chain rule](https://en.wikipedia.org/wiki/Chain_rule) gives:

```{math}
:label: eq:sg-chain-rule
\frac{\partial \mathcal{L}}{\partial W} =
\frac{\partial \mathcal{L}}{\partial S}
\underbrace{\frac{\partial S}{\partial V}}_{\{0, \infty\}}
\frac{\partial V}{\partial I}
\frac{\partial I}{\partial W}
```

The last two terms are straightforward: $\partial I / \partial W = X$, and, if the membrane resistance is set to $1$, $\partial V / \partial I = 1$.
The loss derivative $\partial \mathcal{L} / \partial S$ depends on the choice of loss function and has an analytical form.
But $\partial S / \partial V$ — the derivative of the Heaviside function — is the Dirac delta function:

$$\frac{\partial S}{\partial V} = \delta(V - V_\text{thr})$$

This evaluates to $0$ everywhere except at $V = V_\text{thr}$, where it is undefined (tending to infinity).
In practice, this means the gradient is almost always zero, and the weight $W$ receives no learning signal.
This is known as the **non-differentiability problem**.

:::{margin}
When $V[t]$ exceeds the threshold $V_\text{thr}$, the neuron emits a spike: $S[t] = 1$.
Otherwise, $S[t] = 0$.
:::

:::{figure} ../_static/img/spike_heaviside.png
:width: 420px
:align: center
:name: fig-spike-heaviside
The Heaviside step function $\Theta$ maps the membrane potential $V[t]$ to a binary spike $S[t]$.
The open circle at $V_\text{thr}$ indicates $S[t] = 0$ exactly at the threshold; the filled circle indicates $S[t] = 1$ just above it.
:::

```{sgplot} sg-atan-plot
:height: 340
:slider_id: sg-atan-slider
:val_id: sg-atan-val
:caption: Try moving the &#945; slider! Larger &#945; brings the smooth approximation closer to the true Heaviside step function — each new value is drawn in a fresh color so you can compare shapes directly.
```

:::{aside} Why not just use a smooth activation?
One might ask: why not replace the Heaviside with a smooth sigmoid everywhere?
The answer is that we *want* discrete spikes during inference — they enable sparse, event-driven computation and are essential for neuromorphic hardware.
The surrogate gradient is a training-time trick that preserves the discrete nature of spikes at inference.
:::

## Surrogate gradient functions

The surrogate gradient approach resolves the non-differentiability problem by decoupling the forward and backward passes:

- **Forward pass**: Use the Heaviside step function $\Theta$ as-is. Spikes remain discrete.
- **Backward pass**: Replace the Dirac delta $\partial S / \partial V$ with a smooth surrogate derivative $\partial \tilde{S} / \partial V$.

This substitution means we are not computing the true gradient of the network — but it turns out that neural networks are remarkably robust to such approximations [@neftci2019surrogate].

### The arctangent surrogate

A common choice is the derivative of the arctangent function:

```{math}
:label: eq:sg-atan
\frac{\partial \tilde{S}}{\partial V} \leftarrow \frac{1}{\pi}\frac{1}{1+(\pi V)^2}
```

where the left arrow ($\leftarrow$) denotes substitution: we *replace* the true derivative with this expression during the backward pass.
This function is bell-shaped, centered at the threshold, and smoothly decays to zero on either side.
Neurons close to the threshold receive the strongest gradient signal, which makes intuitive sense: neurons that are almost spiking are most sensitive to weight changes.

### Other surrogate functions

Many surrogate functions have been proposed.
Here are several common choices:

| Name | Surrogate derivative $\partial \tilde{S} / \partial V$ |
|---|---|
| **Arctangent** | $\frac{1}{\pi}\frac{1}{1+(\pi V)^2}$ |
| **SuperSpike** [@zenke2018superspike] | $\frac{1}{(\alpha \lvert V \rvert + 1)^2}$ |
| **Fast sigmoid** | $\frac{1}{(1 + \lvert V \rvert)^2}$ (SuperSpike with $\alpha = 1$) |
| **Sigmoid** | $\sigma(V)(1 - \sigma(V))$ where $\sigma(V) = \frac{1}{1+e^{-V}}$ |
| **Rectangular** (boxcar) | $\frac{1}{2} \mathbb{1}(\lvert V \rvert < 1)$ |
| **Triangular** | $\max(0, 1 - \lvert V \rvert)$ |

In practice, the choice of surrogate function has a relatively minor effect on training performance [@zenke2021remarkable].
What matters more is that the surrogate is smooth, peaked near the threshold, and decays away from it.
The choice of surrogate function remains an empirical one, as no theoretical proof establishes which one is the best. Arctangent is a common default due to its smooth, bounded derivative.

```{sgplot} sg-fwd-plot
:height: 360
:slider_id: sg-fwd-slider
:val_id: sg-fwd-val
:caption: Try moving the &#945; slider! Each curve is a different smooth approximation of the Heaviside step function — larger &#945; sharpens all of them toward the true step. Click a name in the legend to show or hide individual curves.
```

```{sgplot} sg-dual-plot
:height: 400
:slider_id: sg-dual-slider
:val_id: sg-dual-val
:caption: Try moving the &#945; slider! Each curve shows the surrogate gradient ∂S̃/∂V for a different surrogate function — the gradient signal is always concentrated near the threshold and decays away from it.
```

```{sgplot} sg-v3-plot
:height: 420
:slider_id: sg-v3-slider
:val_id: sg-v3-val
:caption: Try moving the &#945; slider! The left panel shows the smooth forward approximations, and the right panel shows the corresponding surrogate gradients. Click on a surrogate name in the legend to show or hide it in both panels simultaneously.
```

### Implementation

The following code implements several surrogate gradient functions and compares them to the true Heaviside derivative:

```python
import numpy as np

def heaviside(v):
    """Forward pass: Heaviside step function."""
    return np.where(v > 0, 1.0, 0.0)

def atan_surrogate(v, alpha=np.pi):
    """Backward pass: arctangent surrogate gradient."""
    return 1.0 / (alpha * (1 + (alpha * v) ** 2))

def superspike_surrogate(v, alpha=100.0):
    """Backward pass: SuperSpike surrogate gradient (Zenke & Ganguli, 2018)."""
    return 1.0 / (alpha * np.abs(v) + 1.0) ** 2

def fast_sigmoid_surrogate(v):
    """Backward pass: fast sigmoid surrogate gradient (SuperSpike with alpha=1)."""
    return 1.0 / (1 + np.abs(v)) ** 2

def sigmoid_surrogate(v):
    """Backward pass: sigmoid surrogate gradient."""
    sig = 1.0 / (1 + np.exp(-v))
    return sig * (1 - sig)

def rectangular_surrogate(v, width=1.0):
    """Backward pass: rectangular (boxcar) surrogate gradient."""
    return np.where(np.abs(v) < width, 0.5 / width, 0.0)

def triangular_surrogate(v):
    """Backward pass: triangular surrogate gradient."""
    return np.maximum(0.0, 1.0 - np.abs(v))
```

```{exercise} Implement a custom surrogate
:label: 2_2_exercise_surrogate

Using the `heaviside` function above for the forward pass, implement a *Gaussian* surrogate gradient function:

$$\frac{\partial \tilde{S}}{\partial V} = \frac{1}{\sqrt{2\pi}} e^{-V^2/2}$$

Then plot it alongside the arctangent surrogate from Eq {eq}`eq:sg-atan` to compare their shapes.
What differences do you notice near the threshold versus far from it?
```

```{solution} 2_2_exercise_surrogate
:label: 2_2_solution_surrogate
:class: dropdown

The Gaussian surrogate:

~~~python
def gaussian_surrogate(v):
    return np.exp(-v**2 / 2) / np.sqrt(2 * np.pi)
~~~

Compared to the arctangent surrogate, the Gaussian decays much faster away from the threshold (exponential vs. polynomial decay).
This means the Gaussian provides gradient signal to a narrower band of neurons around the threshold, which can make training less stable but also more precise.
The arctangent has heavier tails and provides a weaker but longer-range gradient signal.
```

## The neuron as a filter: from the SRM to a training model

Before we can train a spiking neural network, we need to understand how gradient information flows through time.
A spiking neuron is a recurrent system: its state at time $t$ depends on its state at time $t-1$.

The Spike Response Model decomposes a neuron into **linear filters** followed by a **threshold nonlinearity** [@gerstner2014neuronal].
The membrane potential is a sum of two convolutions: input filtered through the membrane kernel $\kappa$, plus the spike afterpotential $\eta$ that captures reset and refractoriness after each output spike.
The only nonlinearity is the threshold crossing that produces a spike.

This decomposition is exactly what makes surrogate gradients principled: the filters $\kappa$ and $\eta$ are already differentiable, so we only need to approximate the derivative of **one** nonlinearity — the Heaviside function at the threshold.

### The simplified LIF neuron

The full $\texttt{LIF}$ neuron derived in [](#sec:spk-nrn-lif) has several hyperparameters ($R_\text{m}$, $C_\text{m}$, $\Delta t$).
For deep learning, we simplify this by introducing the decay rate $\beta$, which collapses the time constant into a single parameter.
Starting from the discrete $\texttt{LIF}$ equation and setting $\Delta t = 1$ and $R_\text{m} = 1$:

```{math}
:label: eq:sg-decay-rate
\beta = 1 - \frac{1}{\tau_\text{m}} = 1 - v_\text{decay}
```

where $v_\text{decay}$ is the voltage decay from [](#sec:spk-nrn-lif).
A value of $\beta$ close to $1$ means slow decay (long memory); close to $0$ means fast decay.

The input current $I[t] = WX[t]$ is now weighted by a learnable parameter $W$, absorbing the effect of the membrane resistance.
The complete simplified neuron model becomes:

```{math}
:label: eq:sg-simplified-lif
\begin{aligned}
V[t+1] &= \beta V[t] + WX[t+1] - S[t]V_\text{thr} && \text{(a)} \\
S[t] &= \Theta(V[t] - V_\text{thr}) && \text{(b)}
\end{aligned}
```

In the language of the SRM, the decay term $\beta V[t]$ implements the membrane filter $\kappa$ (exponential integration of past inputs), while the reset term $-S[t]V_\text{thr}$ implements the spike afterpotential $\eta$ (reset by subtraction).
The only free hyperparameter is $\beta$.

```{note}
The reset term $S[t]V_\text{thr}$ in Eq {eq}`eq:sg-simplified-lif`$\textsf{a}$ implements *reset by subtraction*: each time a spike is emitted, the threshold value is subtracted from the membrane potential.
This is the soft reset mechanism described in [](#sec:spk-nrn-lif).
```

### Unrolling through time

Equation {eq}`eq:sg-simplified-lif` describes a recurrence: $V[t+1]$ depends on $V[t]$, which depends on $V[t-1]$, and so on.
We can visualize this by *unrolling* the computation graph across time steps:

<!-- Width as a percentage, not `800px`: myst-to-tex divides a px width by an
800px reference page and only scales the result up when it is *strictly* below
1, so exactly 800px falls through as 1/100 and the figure prints at 1% of the
line width, i.e. invisibly. -->
:::{figure} ../_static/img/unrolled_lif.png
:width: 100%
:align: center
:name: fig-unrolled-lif
Recurrent representation of spiking neurons.
**(a)** A spiking neuron with implicit recurrence ($\beta$, membrane decay) and explicit recurrence (the feedback path from the output spike back into the membrane).
**(b)** The equivalent spiking neuron illustrated as an unrolled computational graph across time steps $t=0,1,2$ (explicit recurrence omitted); $\beta$ connections carry the membrane $V[t]$ forward, $W$ injects the input $I_\text{in}[t]$, and $-V_\text{thr}$ is the reset term subtracted from the membrane after each output spike $S_\text{out}[t]$.
:::

Each column represents one time step.
The horizontal connections (weighted by $\beta$) represent the membrane potential decay.
The vertical connections (weighted by $W$) represent the synaptic input.
The connection weighted by $-V_\text{thr}$ represents the reset mechanism.

This unrolled graph looks just like a deep feedforward network — except that the weight $W$ is *shared* across all time steps.
This observation is the key insight that connects SNN training to recurrent neural network training.

### Backpropagation through time

To train this network, we apply **backpropagation through time** (BPTT).
The weight $W$ influences the loss at every time step, so the total gradient is a sum over all time steps:

```{math}
:label: eq:sg-bptt-total
\frac{\partial \mathcal{L}}{\partial W} = \sum_t \sum_{s \leq t} \frac{\partial \mathcal{L}[t]}{\partial W[s]}
```

The constraint $s \leq t$ enforces causality: we consider the contributions of $W$ only for past and present inputs.
Because $W$ is shared across time ($W[0] = W[1] = \ldots = W$), a change to $W$ at any step affects all steps equally.

Consider the contribution from one step back, $s = t-1$:

```{math}
:label: eq:sg-bptt-one-step
\frac{\partial \mathcal{L}[t]}{\partial W[t-1]} =
\frac{\partial \mathcal{L}[t]}{\partial S[t]}
\frac{\partial \tilde{S}[t]}{\partial V[t]}
\underbrace{\frac{\partial V[t]}{\partial V[t-1]}}_{\beta}
\underbrace{\frac{\partial V[t-1]}{\partial I[t-1]}}_{1}
\underbrace{\frac{\partial I[t-1]}{\partial W[t-1]}}_{X[t-1]}
```

The temporal derivative $\partial V[t] / \partial V[t-1] = \beta$ comes directly from Eq {eq}`eq:sg-simplified-lif`$\textsf{a}$.
In the SRM figure, this is the derivative through the membrane filter $\kappa$ — it is exact, not approximated.
The surrogate only enters at the $\partial \tilde{S} / \partial V$ term, i.e., the threshold crossing.
Going further back in time, each additional step multiplies the current value by another factor of $\beta$, so the gradient contribution from $k$ steps in the past is proportional to $\beta^k$.
Since $0 < \beta < 1$, contributions from the distant past decay exponentially — which is why the choice of $\beta$ matters.

:::{aside} Truncated BPTT
For long sequences, full BPTT can be expensive in both compute and memory because every intermediate state must be stored.
**Truncated BPTT** limits the backward pass to the most recent $K$ time steps, reducing memory from $\mathcal{O}(T)$ to $\mathcal{O}(K)$ at the cost of ignoring long-range temporal dependencies.
In practice, if $\beta^K$ is small enough, the truncated gradient is a good approximation.
:::

:::{figure} ../_static/img/bptt.png
:width: 650px
:align: center
:name: fig-bptt
Backpropagation through time (BPTT) for the unrolled LIF neuron.
Solid arrows show the forward pass; dashed orange arrows show the gradient flowing backward through time.
Gradients of earlier time steps (prior influence) require more steps of backward propagation, each multiplying by $\beta$.
:::

### Implementation

The code below shows how to implement the same $\texttt{LIF}$ neuron with surrogate gradient support across three frameworks.
In each case, the forward pass computes the true Heaviside step and the backward pass replaces its derivative with a surrogate:

::::{tab-set}

:::{tab-item} NumPy
```python
import numpy as np

class LIFNeuron:
    """A single LIF neuron with surrogate gradient support."""

    def __init__(self, beta=0.9, threshold=1.0):
        self.beta = beta
        self.threshold = threshold

    def forward(self, inputs, num_steps):
        """Run the neuron for num_steps, recording states for backprop.

        Args:
            inputs: array of shape (num_steps,), weighted input current WX[t]
            num_steps: number of simulation time steps

        Returns:
            spikes: array of shape (num_steps,), output spikes
            membrane: array of shape (num_steps,), membrane potential
        """
        mem = 0.0
        spikes = np.zeros(num_steps)
        membrane = np.zeros(num_steps)

        for t in range(num_steps):
            mem = self.beta * mem + inputs[t] - spikes[t - 1] * self.threshold if t > 0 else inputs[t]
            spikes[t] = 1.0 if mem > self.threshold else 0.0
            membrane[t] = mem

        return spikes, membrane

    def surrogate_grad(self, membrane):
        """Arctangent surrogate gradient - called manually in the backward pass.

        Args:
            membrane: array of shape (num_steps,), membrane potential values

        Returns:
            grads: array of shape (num_steps,), surrogate gradient dS/dV
        """
        v = membrane - self.threshold
        return 1.0 / (np.pi * (1 + (np.pi * v) ** 2))
```
:::

:::{tab-item} PyTorch
```python
import torch
import torch.nn as nn

class SpikeFunction(torch.autograd.Function):
    """Heaviside forward pass; arctangent surrogate in the backward pass.

    Subclassing torch.autograd.Function lets PyTorch's autograd engine
    call our custom backward whenever .backward() flows through a spike.
    """

    @staticmethod
    def forward(ctx, v, threshold):
        ctx.save_for_backward(v - threshold)
        return (v > threshold).float()

    @staticmethod
    def backward(ctx, grad_output):
        (v_shifted,) = ctx.saved_tensors
        surrogate = 1.0 / (torch.pi * (1 + (torch.pi * v_shifted) ** 2))
        return grad_output * surrogate, None


class LIFNeuron(nn.Module):
    def __init__(self, beta=0.9, threshold=1.0):
        super().__init__()
        self.beta = beta
        self.threshold = threshold

    def forward(self, inputs):
        """
        Args:
            inputs: tensor of shape (num_steps, ...)
        Returns:
            spikes: tensor of shape (num_steps, ...)
        """
        mem = torch.zeros_like(inputs[0])
        spike_list = []

        for inp in inputs:
            mem = self.beta * mem + inp
            spk = SpikeFunction.apply(mem, self.threshold)
            mem = mem - spk * self.threshold
            spike_list.append(spk)

        return torch.stack(spike_list)
```
:::

:::{tab-item} JAX
```python
import jax
import jax.numpy as jnp

@jax.custom_vjp
def spike_fn(v, threshold):
    """Heaviside forward pass; arctangent surrogate in the backward pass.

    jax.custom_vjp lets us define the vector-Jacobian product (VJP)
    separately from the forward computation, so jax.grad flows through
    our surrogate instead of the true (undefined) Heaviside derivative.
    """
    return jnp.where(v > threshold, 1.0, 0.0)

def spike_fn_fwd(v, threshold):
    return spike_fn(v, threshold), (v - threshold,)

def spike_fn_bwd(res, g):
    (v_shifted,) = res
    surrogate = 1.0 / (jnp.pi * (1 + (jnp.pi * v_shifted) ** 2))
    return g * surrogate, None

spike_fn.defvjp(spike_fn_fwd, spike_fn_bwd)


def lif_step(mem, inp, beta, threshold):
    """Single LIF time step - differentiable via spike_fn above."""
    mem = beta * mem + inp
    spk = spike_fn(mem, threshold)
    mem = mem - spk * threshold
    return spk, mem
```
:::

::::

## Loss functions and output decoding

Before we can train a network, we need to define what "correct" means.
In a spiking neural network, the output neurons produce spike trains — sequences of $0$s and $1$s over time.
We need a way to interpret these spike trains as predictions and compare them to targets.

### Rate coding

The most common approach for classification is **rate coding** (see [](#chapter:rate-enc)): the predicted class is the output neuron with the highest total spike count (or equivalently, the highest firing rate) over the simulation:

$$\hat{y} = \arg\max_i \sum_t S_i[t]$$

This is analogous to taking the neuron with the highest activation in a classical neural network.

### Cross-entropy loss on the membrane potential

To create a differentiable loss, we apply the cross-entropy loss to the membrane potential $V$ rather than to the discrete spikes.
The softmax of the membrane potential for $C$ output classes gives:

```{math}
:label: eq:sg-softmax
p_i[t] = \frac{e^{V_i[t]}}{\sum_{j=0}^{C-1} e^{V_j[t]}}
```

The cross-entropy between $p_i$ and the one-hot target $y_i \in \{0,1\}^C$ is:

```{math}
:label: eq:sg-ce-loss
\mathcal{L}_\text{CE}[t] = -\sum_{i=0}^{C-1} y_i \log(p_i[t])
```

The effect is that the membrane potential of the correct class is encouraged to stay above the threshold (producing spikes), while incorrect classes are suppressed below the threshold.

### Summing over time

Since the network runs for $T$ time steps, we compute the loss at every step and sum:

```{math}
:label: eq:sg-total-loss
\mathcal{L} = \sum_{t=0}^{T-1} \mathcal{L}_\text{CE}[t]
```

This is the objective that BPTT differentiates through, as described in Eq {eq}`eq:sg-bptt-total`.

## Putting it together: training on MNIST

We now have all the pieces to train a spiking neural network:
1. A simplified $\texttt{LIF}$ neuron (Eq {eq}`eq:sg-simplified-lif`)
2. Surrogate gradients to handle non-differentiable spikes (Eq {eq}`eq:sg-atan`)
3. BPTT to propagate gradients through time (Eq {eq}`eq:sg-bptt-total`)
4. A loss function applied at every time step (Eq {eq}`eq:sg-total-loss`)

Let's put this together and train a feedforward SNN on the MNIST handwritten digit dataset.

### Network architecture

We build a two-layer fully connected spiking neural network:
- **Input**: 784 neurons (28$\times$28 pixel images, flattened)
- **Hidden layer**: 1000 $\texttt{LIF}$ neurons
- **Output layer**: 10 $\texttt{LIF}$ neurons (one per digit class)

The same static input image is presented at every time step for $T=25$ steps, giving the network time to integrate and produce spikes.

```python
import numpy as np

def softmax(x):
    """Numerically stable softmax."""
    e_x = np.exp(x - np.max(x, axis=-1, keepdims=True))
    return e_x / e_x.sum(axis=-1, keepdims=True)

def cross_entropy_loss(logits, targets):
    """Cross-entropy loss.

    Args:
        logits: array of shape (batch_size, num_classes)
        targets: array of shape (batch_size,), integer class labels

    Returns:
        loss: scalar, mean cross-entropy loss
        d_logits: array of shape (batch_size, num_classes), gradient of loss w.r.t. logits
    """
    probs = softmax(logits)
    batch_size = logits.shape[0]
    loss = -np.log(probs[np.arange(batch_size), targets] + 1e-8).mean()
    d_logits = probs.copy()
    d_logits[np.arange(batch_size), targets] -= 1.0
    d_logits /= batch_size
    return loss, d_logits
```

### Forward pass

The forward pass simulates the network over $T$ time steps, storing intermediate values needed for the backward pass:

```python
def forward(x, W1, W2, beta, threshold, num_steps):
    """Forward pass of a two-layer SNN.

    Args:
        x: input array of shape (batch_size, 784)
        W1: weights of shape (784, 1000)
        W2: weights of shape (1000, 10)
        beta: membrane decay rate
        threshold: spike threshold
        num_steps: number of simulation time steps

    Returns:
        cache: dict of intermediate values for the backward pass
    """
    batch_size = x.shape[0]

    # Hidden layer state
    mem1 = np.zeros((batch_size, 1000))
    spk1 = np.zeros((batch_size, 1000))

    # Output layer state
    mem2 = np.zeros((batch_size, 10))
    spk2 = np.zeros((batch_size, 10))

    # Storage for backprop
    mem1_rec, spk1_rec = [], []
    mem2_rec, spk2_rec = [], []

    for t in range(num_steps):
        # Layer 1: input -> hidden
        cur1 = x @ W1                                      # synaptic current
        mem1 = beta * mem1 + cur1 - spk1 * threshold       # membrane update
        spk1 = (mem1 > threshold).astype(np.float64)        # spike

        # Layer 2: hidden -> output
        cur2 = spk1 @ W2                                    # synaptic current
        mem2 = beta * mem2 + cur2 - spk2 * threshold        # membrane update
        spk2 = (mem2 > threshold).astype(np.float64)         # spike

        mem1_rec.append(mem1)
        spk1_rec.append(spk1)
        mem2_rec.append(mem2)
        spk2_rec.append(spk2)

    cache = {
        'x': x,
        'mem1': np.stack(mem1_rec),   # (T, batch, 1000)
        'spk1': np.stack(spk1_rec),   # (T, batch, 1000)
        'mem2': np.stack(mem2_rec),    # (T, batch, 10)
        'spk2': np.stack(spk2_rec),   # (T, batch, 10)
    }
    return cache
```

### Backward pass with surrogate gradients

The backward pass flows gradients back through the states for each time step, using the arctangent surrogate in place of the Heaviside derivative:

```python
def backward(cache, targets, W1, W2, beta, threshold, num_steps):
    """Backward pass using BPTT with surrogate gradients.

    Args:
        cache: dict from forward pass
        targets: array of shape (batch_size,), integer class labels
        W1, W2: weight matrices
        beta, threshold: neuron parameters
        num_steps: number of time steps

    Returns:
        dW1, dW2: gradients for the weight matrices
        total_loss: scalar loss summed over time
    """
    mem1_rec = cache['mem1']
    spk1_rec = cache['spk1']
    mem2_rec = cache['mem2']
    x = cache['x']

    dW1 = np.zeros_like(W1)
    dW2 = np.zeros_like(W2)
    total_loss = 0.0

    # Gradient flowing back into the membrane potential from future time steps
    d_mem2_future = np.zeros_like(mem2_rec[0])
    d_mem1_future = np.zeros_like(mem1_rec[0])

    for t in reversed(range(num_steps)):
        # --- Output layer loss ---
        loss_t, d_logits = cross_entropy_loss(mem2_rec[t], targets)
        total_loss += loss_t

        # Gradient into mem2: from the loss + from future time steps (decay)
        d_mem2 = d_logits + d_mem2_future

        # Surrogate gradient: dS/dV for the output layer
        v2 = mem2_rec[t] - threshold
        sg2 = 1.0 / (np.pi * (1 + (np.pi * v2) ** 2))

        # Gradient through spike -> weight2
        d_spk2 = d_mem2 * sg2  # not used further here, but would be for deeper nets

        # dW2: Matrix multiplication of spk1^T and d_mem2 (input to layer 2 is spk1)
        dW2 += spk1_rec[t].T @ d_mem2

        # Propagate the gradient back to spk1
        d_spk1_from_layer2 = d_mem2 @ W2.T

        # Surrogate gradient: dS/dV for the hidden layer
        v1 = mem1_rec[t] - threshold
        sg1 = 1.0 / (np.pi * (1 + (np.pi * v1) ** 2))

        # Gradient into mem1: from layer2 (through the surrogate) + from future time steps
        d_mem1 = d_spk1_from_layer2 * sg1 + d_mem1_future

        # dW1: Matrix multiplication of x^T and d_mem1
        dW1 += x.T @ d_mem1

        # Propagate the membrane gradient back in time (decay connection)
        d_mem2_future = d_mem2 * beta
        d_mem1_future = d_mem1 * beta

    return dW1, dW2, total_loss
```

### Training loop

With the forward and backward passes defined, the training loop follows the standard pattern: iterate over batches, compute the loss, calculate gradients, and update weights:

```python
def train(train_images, train_labels, num_epochs=1, batch_size=128,
          lr=5e-4, beta=0.95, threshold=1.0, num_steps=25):
    """Train a two-layer SNN on image classification.

    Args:
        train_images: array of shape (N, 784), flattened images
        train_labels: array of shape (N,), integer labels
        num_epochs: number of training epochs
        batch_size: mini-batch size
        lr: learning rate
        beta: membrane decay rate
        threshold: spike threshold
        num_steps: simulation time steps

    Returns:
        W1, W2: trained weight matrices
        loss_history: list of loss values
    """
    num_samples = train_images.shape[0]

    # Initialize all weights (Xavier initialization)
    W1 = np.random.randn(784, 1000) * np.sqrt(2.0 / 784)
    W2 = np.random.randn(1000, 10) * np.sqrt(2.0 / 1000)

    loss_history = []

    for epoch in range(num_epochs):
        # Shuffle the data
        perm = np.random.permutation(num_samples)
        train_images = train_images[perm]
        train_labels = train_labels[perm]

        for i in range(0, num_samples, batch_size):
            x_batch = train_images[i:i + batch_size]
            y_batch = train_labels[i:i + batch_size]

            # Forward
            cache = forward(x_batch, W1, W2, beta, threshold, num_steps)

            # Backward
            dW1, dW2, loss = backward(
                cache, y_batch, W1, W2, beta, threshold, num_steps
            )

            # Update weights (gradient descent)
            W1 -= lr * dW1
            W2 -= lr * dW2

            loss_history.append(loss)

    return W1, W2, loss_history
```

```{exercise} Evaluate the trained network
:label: 2_2_exercise_eval

Write an `evaluate` function that:
1. Runs the forward pass on test data
2. Counts the total spikes per output neuron per sample (rate coding)
3. Predicts the class with the highest spike count
4. Reports the classification accuracy

How does the accuracy change when you vary $\beta$ between 0.5 and 0.99?
```

```{solution} 2_2_exercise_eval
:label: 2_2_solution_eval
:class: dropdown

~~~python
def evaluate(test_images, test_labels, W1, W2, beta, threshold, num_steps):
    cache = forward(test_images, W1, W2, beta, threshold, num_steps)
    # Sum spikes over time for each output neuron
    spike_counts = cache['spk2'].sum(axis=0)  # (N, 10)
    predictions = spike_counts.argmax(axis=1)
    accuracy = (predictions == test_labels).mean()
    return accuracy
~~~

Higher $\beta$ (e.g. 0.95–0.99) typically gives better accuracy because the neuron retains more information across time steps, effectively integrating over a longer time window.
Lower $\beta$ (e.g. 0.5) causes the membrane potential to decay quickly, making it harder for the neuron to accumulate enough charge to spike meaningfully.
However, very high $\beta$ can also result in slow convergence because the reset mechanism becomes less effective.
```

## When to use surrogate gradients

Surrogate gradient training is the most widely used method for training SNNs today.
It is well suited when:

- **Accuracy is the priority**: Surrogate gradients leverage the full power of gradient-based optimization, typically outperforming non-gradient-based SNN training methods, though exact-gradient approaches can match or exceed them at greater computational cost
- **Offline training is acceptable**: Training happens in batch mode on a GPU, not on the target hardware
- **A teaching signal is available**: Labels, self-supervised targets, or any other differentiable loss signal can be used — surrogate gradients aren't limited to strictly supervised setups
- **More complex neuron models**: The SRM perspective shows that surrogate gradients work for any neuron model more complex than the simple LIF, as long as it decomposes into linear filters plus a threshold — including adaptive neurons with multiple spike afterpotential kernels $\eta$, or neurons with synaptic current dynamics

The main limitations are:

- **Memory cost**: Full BPTT requires storing intermediate states for all time steps (though truncated BPTT and gradient checkpointing can help)
- **Not biologically plausible**: The backward pass requires symmetric weights and global error signals — mechanisms not found in biological neural circuits
- **Offline only**: The network cannot adapt during deployment; training and inference are separate phases

Alternatives that address some of these limitations — exact-gradient methods, biologically plausible learning rules, and meta-learning approaches that improve the learning process itself — are covered in chapters planned for a later release.

## Related reading

Here is a list of resources sorted by topic ([please help expand the list](#contributors)):

- Foundational: [@neftci2019surrogate], [@zenke2018superspike], [@eshraghian2023training]
- SRM and filter perspective: [@gerstner2014neuronal] (Ch. 1, 6)
- Surrogate function comparisons: [@zenke2021remarkable]
- BPTT for SNNs: [@werbos1990backpropagation], [@bellec2018long]
- Applications: [@bellec2020solution]
