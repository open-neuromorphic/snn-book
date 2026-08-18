(training)=
# Training SNNs

This topic covers training SNNs end to end: from tracing errors back to the parameters that caused them, to building practical and efficient setups for your use case.

```{rubric} Why Training Matters
```

The previous topic, [](#foundations), identifies the core elements of Spiking Neural Networks.
But, then what? Randomly putting spiking neurons together is rarely useful.
The connections, time constants, and thresholds need to *adapt* to a specific scenario: we need to **train** the parameters of the network to achieve the desired behavior.
This is what we cover in this topic.

To make this concrete, here is a small *before-and-after* experiment.

:::{figure} /_static/svg/2_training_before_after.svg
:alt: Spike rasters of one IF neuron before and after training; the trained spiking rate matches the goal.
:label: 2_training_before_after_fig

An Integrate-and-Fire neuron before (top) and after (bottom) training.
With a poor initial weight it fires too little.
After adjusting the single weight, we reach the goal of 20 spikes.
The point of this topic is to show you different ways to go from an untrained to a trained network.
:::

:::{aside} What is a spiking neuron?
There exist a plethora of neuron types: some spike, some don't.
Some are complicated, some are simple.
Common for all neurons is that they have many inputs but only one output.
See the chapter [](#spiking) for more information.
:::

We use the simplest possible spiking neuron: a single **Integrate-and-Fire (IF)** unit (see [](#foundations)) driven by a constant input that it scales by one weight $w$.Our goal is modest — make the neuron fire at a *target rate*.
With a poor initial $w$, the firing rate is wrong; training nudges $w$ until the firing rate matches the target.

You might object that you can calculate the optimal set of parameters from the beginning.
That you know the exact solution your system needs to adhere to, so you have no need to modify the network afterwards.
If that is the case, you can skip this topic on training entirely and continue to the topic on [](#deployment).
But please tell us the secret behind your approach!

We write about training because it is generally harder in SNNs for two reasons: recurrence (in time) and discontinuities (spikes).
Classical neural networks usually feature continuous activation functions that are easily differentiable, but spiking neurons are state-dependent nonlinearities that unroll in time, which makes them expensive to compute.
Furthermore, the activations have jumps that are challenging to differentiate.
Luckily, there are a number of ideas and methods to get around these problems, which we present in this topic.

```{rubric} Background
```

If you think about a neural network as a system of equations, the search for good, even optimal, solutions reduces to a simple optimization process.
Imagine a simple linear system where some vector output $b$ is produced by multiplying a matrix $A$ with some input vector $x$.

```{math}
:label: eq:2_training_linear_system
\boldsymbol{A}x = b
```
Here, $A$ and $b$ are given, so we can solve for $x$ directly.

:::{aside} Linear dynamical systems

The system above is *timeless*: given $A$ and $b$, we solve for $x$ once and we are done.
But we can also let the state evolve in time, applying the linear map again and again, as in $x_{t+1} = \boldsymbol{A}x_t$.
This turns a static vector product into a [linear dynamical system](https://en.wikipedia.org/wiki/Linear_dynamical_system), whose trajectory unfolds over time.
It is worth keeping this dynamical view in mind, because the neurons we train are dynamical too.

:::

In a neural network, however, $A$ is unknown.
Additionally, imagine that our network has nonlinearities, the above equation quickly becomes unwieldy.
This gets even worse when we realize that the nonlinearities can have parameters such as conductivity and resistivity (see the chapter on [](#chapter:point-neurons))!
In fact, neural networks are so unwieldy that a [famous textbook on nonlinear systems](@strogatz2019nonlinear) calls them a "frontier" (see @tab:dyn_systems), in contrast to other things like linear oscillators and pendulum dynamics.

:::{table} Classification of dynamical systems by linearity and number of variables ($n$). Adapted from @strogatz2019nonlinear.
:label: tab:dyn_systems
:align: center

|            | **Linear**                                          | **Nonlinear**                                    |
| :--------: | :-------------------------------------------------- | :----------------------------------------------- |
|  $n = 1$   | Growth, decay, or equilibrium                       | Bifurcations<br>Fixed points                     |
|  $n = 2$   | Linear oscillator<br>Mass and spring                | Pendulum<br>Limit cycles                         |
| $n \geq 3$ | Electrical engineering<br>Multi-variable systems    | 3-body problem<br>Forced nonlinear oscillators   |
| $n \gg 3$  | Coupled harmonic oscillators<br>Solid-state physics | Coupled nonlinear oscillators<br>Neural networks |
:::

Given that we cannot *solve* the problem directly, we have to *search* for a solution.
One way to approach this is to define a measure of "badness": how "bad" is the current network?
That is useful because we can start asking how we can make the network less "bad".
Training is simply reducing that "badness" over time, and when we hit 0, we are done.
In machine learning, that "badness" is called "loss", and it is usually denoted as $L$:


```{math}
:label: eq:2_training_loss
L(\theta) = \operatorname{dist}\big(f_\theta(x),\; y_{\text{goal}}\big)
```

Here our loss is the distance between the network $f_\theta$ applied to the input (the network prediction) on one hand, and the expected/desired value $y_{\text{goal}}$ on the other.
Thus, training means changing the parameters $\theta$ so that the distance becomes smaller and smaller, that is, $f_\theta(x)$ moves closer and closer to the goal.

If you took calculus in high school you might realize that we want to *change* $L$ in the direction of a *downward* slope: we want the change of $L$ to give us *smaller* errors.
This is known as the gradient of $L$, written as $\nabla L$.
We are interested in the negative of this gradient ($-\nabla L$) because we want $L$ to decrease, at shown in @fig:2_training_landscape.

:::{figure} /_static/svg/2_training_landscape.svg
:alt: A schematic loss landscape over parameter space, with a ball rolling downhill toward the minimum.
:label: fig:2_training_landscape

The loss $L(\theta)$ drawn as a *landscape* over the parameters $\theta$. Training starts somewhere on a slope and moves *downhill* toward a minimum. 
:::

We can minimize the error by using a distance metric, such as the loss, as shown in @fig:2_training_landscape.
But there is a catch: we might be unlucky and land in local minima which *look* like optimal solutions because the gradient is zero, but can, in fact, be terrible solutions.

Local minima are not the only hazard while training neural networks, and it turns out that spiking networks are much harder to train than classical networks for **two** reasons:
The first is **time**: an SNN unrolls its computation over many timesteps, so a single step downhill has to account for how a parameter shaped the output at *every* timestep, not just one.
The second is **discontinuity**: a spike is an abrupt jump, a cliff in the landscape rather than a gentle curve, and at a cliff, the gradient $\nabla L$ we just leaned on, is undefined!
Where a classical network hands us a smooth surface to descend, an SNN hands us a jagged one that also stretches out in time.
If this is unclear, the chapter on [](#credit_assignment) explains this in detail.

The rest of this topic is, in essence, about different ways to effectively navigate this loss landscape.

```{rubric} Contents of this Topic
```

The topic is organized around methods for solving the [credit assignment problem](#credit_assignment) for SNNs: determining which parameters are responsible for the network's error, both in space and time.
We begin by discussing gradient methods in the chapter on [](#surrogate_gradients) because they closely resemble well-established methods in neural networks and because they are popular in the present-day SNN literature.

Further chapters are in preparation and will appear in later releases.
They cover exact gradients, which exploit precise spike timing rather than approximating the threshold;
meta learning, which improves the learning mechanism itself, a process known as 'learning to learn';
biologically inspired and evolutionary methods, which abandon the comfortable realm of backpropagation for algorithms that are decentralized, asynchronous, and buildable exclusively from components in the Topic on [](#foundations);
ANN-to-SNN conversion, which circumvents the training problem by training a classical network before converting it;
and training optimization, which addresses accuracy and speed.

Here is the list of chapters in this release:

1. **Credit Assignment**: How do you attribute success or failure to specific
network components when dealing with both spatial connectivity and temporal
dynamics? This chapter explores the fundamental challenge of credit assignment
in SNNs, including backpropagation through time for spiking networks.

1. **Surrogate Gradients**: How can we train spiking neurons despite being
non-differentiable? This chapter introduces surrogate gradient methods that
approximate gradients during the backward pass while maintaining spike-based
computation in the forward pass.

