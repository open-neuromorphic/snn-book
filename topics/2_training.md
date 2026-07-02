(training)=
# Training SNNs

This topic covers the complete training workflow for SNNs: from understanding how credit assignment flows to practical and efficient training setups, tailored to your use case.

```{rubric} Why Training Matters
```

The previous topic, [](#foundations), identifies the core elements of spiking neural networks.
But, then what? Randomly putting spiking neurons together is rarely useful.
The connections, time constants, and thresholds need to *adapt* to a specific scenario: we need to **train** the parameters of the network to achieve the desired behavior.
This is what we cover in this topic.

To make this concrete, here is a small *before-and-after* experiment.

:::{figure} /_static/svg/2_training_before_after.svg
:alt: Spike rasters of one IF neuron before and after training; the trained rate matches the goal.
:label: 2_training_before_after_fig

The *same* integrate-and-fire neuron before (top) and after (bottom) training. With a poor initial weight it fires too rarely; after adjusting the single weight, we reach the goal of 20 spikes.
The point of this topic is to show you different tools to go from the untrained to the trained setting.
:::

We use the simplest possible spiking neuron: a single **integrate-and-fire (IF)** unit (from [](#foundations)), driven by a constant input that it scales by one weight $w$. Our goal is modest — make the neuron fire at a *target rate*. With a poor initial $w$ the rate is wrong; training nudges $w$ until it matches.

You might object that you can calculate the optimal set of parameters from the beginning.
That you know the exact solution your system needs to adhere to, so you have no need to fiddle with the network afterwards.
If that is the case, you are in luck, and you can entirely avoid training, skip this topic on training, and continue to the topic on [](#deployment).
But please tell us the secret behind your approach!

We write about training because it is generally harder in SNNs for two reasons: recurrence (in time) and discontinuities (spikes).
Classical neural networks have nice and continuous functions that are easily differentiable, but spiking neurons are state-dependent nonlinearities that unroll in time, which makes them expensive to compute.
What's more, the activations have jumps that are challenging to differentiate.
But there are solutions to most scenarios, and this topic presents a set of ideas and methods to address these scenarios.

```{rubric} Background
```

If you think about a neural network as a system of equations, the search for good, even optimal, solutions reduces to a simple optimization process.
Imagine a simple linear system where some vector output $b$ is produced by multiplying a matrix $A$ with some input $x$.

```{math}
:label: eq:2_training_linear_system
\boldsymbol{A}x = b
```
Here, $A$ and $b$ are given, so we can solve for $x$ directly.
Problem solved.

In a neural network, however, $A$ is unknown.
Additionally, imagine that our network has nonlinearities, the above equation quickly becomes unwieldy.
This gets even worse when we realize that the nonlinearities can have parameters such as conductivity and resistivity!
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
Training is simply reducing that "badness" over time, and when we hit 0 we are done.
In machine learning, that "badness" is called the "loss" $L$:


```{math}
:label: eq:2_training_loss
L(\theta) = \operatorname{dist}\big(f_\theta(x),\; y_{\text{goal}}\big)
```

Here our loss is the distance between the network $f_\theta$ applied to the input (the network prediction) on the one hand and the expected/desired value $y_{\text{goal}}$ on the other.
Training now means changing the parameters $\theta$ so that distance becomes smaller and smaller, meaning that $f_\theta(x)$ moves closer and closer to the goal.

If you took calculus in high school you might realize that we want to *change* $L$ in the direction of a *downward* slope: we want the change of $L$ to give us *smaller* errors.
This is known as the gradient of $L$, written $\nabla L$.
And we want the negative of this because we want $L$ to decrease: $-\nabla L$, shown in @fig:2_training_landscape.

:::{figure} /_static/svg/2_training_landscape.svg
:alt: A schematic loss landscape over parameter space, with a ball rolling downhill toward the minimum.
:label: fig:2_training_landscape

The loss $L(\theta)$ drawn as a *landscape* over the parameters $\theta$. Training starts somewhere on a slope and walks *downhill* toward a minimum. 
:::

Using a distance metric, like the loss, to minimize the error works well, as shown in @fig:2_training_landscape.
But there is a catch: we might be unlucky and land in local minima which *look* like optimal solutions because the gradient is zero, but can, in fact, be terrible solutions.

Local minima are not the only hazard, and it turns out that spiking networks are much harder to train than classical networks for two reasons:
The first is **time**: an SNN unrolls its computation over many timesteps, so a single step downhill has to account for how a parameter shaped the output at *every* moment, not just one.
The second is **discontinuity**: a spike is an abrupt jump, a cliff in the landscape rather than a gentle slope, and at a cliff the gradient $\nabla L$ we just leaned on is undefined.
Where a classical network hands us a smooth surface to descend, an SNN hands us a jagged one that also stretches out in time.
If this is strange to you, the chapter on [](#credit_assignment) explains this in detail.

The rest of this topic is, in essence, different ways you can navigate this loss landscape.

```{rubric} Contents in this Topic
```

The topic is organized around methods for solving the [credit assignment problem](#credit_assignment) for SNNs.
We begin by discussing gradient methods in the chapters on [](#surrogate_gradients) and [](#exact_gradients) because they closely resemble the methods in classical neural networks and because they are popular in the present-day literature.
The chapter on [meta learning](#meta_learning) teaches you how you can improve the learning mechanisms.
Or, learn to learn. This is an interesting and fruitful approach that is arguably also biologically inspired and useful in both classical and spiking neural networks alike.
The subsequent chapters on [](#biologically_inspired_training) and [](#evolutionary_algorithms) abandon the comfortable realm of backpropagation to build learning algorithms that are closer to biology in ways.
First, they are biologically feasible, meaning that they can be built exclusively with components from the Topic on [](#foundations).
Second, they are decentralized and asynchronous, meaning that the individual components are driven by local dynamics that, taken together, produce desirable effects.
The chapter on [](#ann-to-snn_conversion) covers methods to convert classical artificial neural networks into SNN, which circumvents the training problem by simply training the ANN before conversion instead.
The final chapter on [](#training_optimization) discusses methods to improve training performance, both in terms of accuracy and speed.

Here is the list of chapters:

1. **Credit Assignment**: How do you attribute success or failure to specific
network components when dealing with both spatial connectivity and temporal
dynamics? This chapter explores the fundamental challenge of credit assignment
in SNNs, including backpropagation through time for spiking networks.

1. **Surrogate Gradients**: How can we train spiking neurons despite being
non-differentiable? This chapter introduces surrogate gradient methods that
approximate gradients during the backward pass while maintaining spike-based
computation in the forward pass.

1. **Exact Gradients**: Are there methods to compute exact gradients through
spiking neurons? This chapter covers ways to leverage the precise timing of
spikes to get exact gradient information.

1. **Meta Learning**: Can networks learn how to learn better? This chapter
explores meta-learning approaches for SNNs, including learning rate adaptation,
architecture search, and learning optimization strategies.

1. **Biologically Inspired Training**: How does the brain assign credit and learn
without backpropagation? This chapter covers Spike-Timing Dependent Plasticity
(STDP), local learning rules, and biologically plausible training methods that
work without global error signals.

1. **Evolutionary Algorithms**: Can we evolve SNNs instead of training them with
gradients? This chapter introduces evolutionary strategies, genetic algorithms,
and neuroevolution techniques that can discover network parameters and
architectures through simulated evolution.

1. **ANN-to-SNN Conversion**: How can we leverage pre-trained Artificial Neural
Networks (ANNs)? This chapter covers conversion techniques that transform
conventional ANNs into SNNs, including rate-based conversion, calibration
methods, and handling of various layer types.

1. **Optimization**: How do we make SNN training practical and efficient? This
chapter covers hyperparameter tuning strategies, regularization techniques for
temporal dynamics, batch normalization adaptations, and performance optimization
for faster training.
