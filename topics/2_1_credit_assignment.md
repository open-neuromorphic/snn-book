---
authors:
- name: Pedersen, Jens Egholm
  affiliation: Technical University of Denmark
  email: jegpe@dtu.dk
---
(credit_assignment)=
# Credit Assignment in SNNs

To improve any neural network, we need to solve the **credit assignment challenge**: when the network makes an error, how do we determine which components to adjust? And by how much?
This chapter explains the intuition and mathematics behind credit assignment with an emphasis on time
because, unfortunately, credit assignment becomes harder when you work with stateful neurons and networks, which are described in the previous topic on [](#foundations).

```{note}
This chapter helps you understand the purpose of the coming chapters.
Read this to understand why different training methods exist and when to use them.
```

## The Credit Assignment Problem
The **core question** in this chapter is:
*Given an output error, which neurons and synapses contributed to that error?*
The term credit assignment was coined by [Marvin Minsky](https://en.wikipedia.org/wiki/Marvin_Minsky) in a 1960 paper [@minsky1961steps], but he went the other way around: how do we reward the *good* parts of the network.
Whether you think about credit as "reward" or "punishment", the essence of the problem is the same:

:::{aside} A note on credit assignment history
While Minsky was the first to thoroughly study credit assignment, the notion of "credit" was not new.
Minsky was studying it for reinforcement learning, which means learning from feedback over time.
The machine learning community picked this up, but peeled off the temporal aspect because their networks typically did not care about time (like digit classification).
Coincidentally, Sutton's original interpretation is highly relevant here, because SNNs are troublesome exactly because they work in space *and* time.
Sutton and Barto have an excellent chapter on (reinforcement) learning history [@sutton2018reinforcement].
:::

> The credit for a working program can only be assigned to [...] subroutines, and as these operate in hierarchies we should not expect individual instruction reinforcement to work well. - @minsky1961steps

What Minsky is saying, is that our networks consist of subcomponents that, together, make up the whole.
So, if we are to assign credit and improve the network, we first need to understand how each component contributes to the whole.
What is the contribution of, say, a synapse to the network output?
Only when we understand that contribution, do we know how to change the synapse.
That is the fundamental problem of credit assignment: **how do we assign credit to the individual components**?

### Credit assignment in space
> The structural credit assignment problem is to determine which internal decisions are responsible - @minsky1961steps

In a feedforward network, credit assignment reduces to a structural question: which connections along the path from input to output are responsible for the error?

Consider a single linear layer with a single weight, and no bias term, as shown in [](#2_1_credit_assignment_spatial).
Following the example in the figure, the layer receives some input ($1$), and the objective is to output $2$.
In this example, $w$ is set to ${2}$, so the output $1 * w_1 = 1 * 2 = 2$ is off by one.
We can solve this by adjusting the linear weight from $2 \to 1$, which gives $1 * 1 = 1$: we've reached our goal!

:::{figure} /_static/svg/2_1_credit_assignment.svg
:alt: Animation showing spatial credit assignment.
:label: 2_1_credit_assignment_spatial

Spatial credit assignment. A linear weight gets readjusted from $2 \to 1$ to ensure that the output is the same as the goal: $1$.
:::

Now, consider the case shown in [](#2_1_credit_assignment_spatial_two_layers), where we have *two* linear layers, both with $w = 2$, and a goal of ${2}$.
The output becomes ${4}$, since $1 * w_1 = 1 * 2 = 2$ and $2 * w_2 = 2 * 2 = 4$.
Our error is now ${2}$, but which parts of the network do we update?
And by how much?
The simplest solution would probably be to set $w_1$ or $w_2$ to ${1}$, but there are many more solutions.

```{exercise} Spatial credit assignment
:label: 2_1_exercise_1

Look at [](#2_1_credit_assignment_spatial_two_layers).
Find at least one solution for ${\rm output} = {\rm goal}$?
How many solutions are there?
```

:::{figure} /_static/svg/2_1_credit_assignment_two_layers.svg
:alt: Animation showing spatial credit assignment.
:label: 2_1_credit_assignment_spatial_two_layers

Spatial credit assignment with two layers. Which layer should receive the update? With multiple components, this becomes less clear.
:::

```{solution} 2_1_exercise_1
:label: 2_1_exercise_1_solution
:class: dropdown

We could set $w_1 = 0.5$ and $w_2 = 4$, which yields $1 * 0.5 = 0.5$ and $0.5 * 4 = 2$.

In general, we need to solve the equation $1 * w_1 * w_2 = 2$.
But we have more than one variable, so there are infinitely many solutions!
This is why credit assignment is hard.
```

Even in this minimal example, there is no single correct answer: many combinations of weights produce the same output.
This ambiguity is at the heart of spatial credit assignment, and it only grows worse as networks get deeper and more complex.
A caveat on the word *ambiguity*: that many weight settings solve the task does not make credit *undefined*: given a loss, the gradient still prescribes one well-defined update. It is the *solution set* that is degenerate, not the credit signal.
Now, imagine adding time to the equation.

```{aside} What is state?

State is the information a neuron shares between time steps.
Like membrane potential and hidden memory.
Read more in @chapter:bio-neurons.
```

### Credit assignment in time
In networks without memory, credit assignment only needs to trace errors backward through layers.
But neurons with state carry information across time, and a spike at timestep $t$ may cause an error at timestep $t + 100$.
Now we must assign credit not just to the right component, but to the right component at the right moment.

To see why, take the single-weight example from [](#2_1_credit_assignment_spatial) and *unroll it in time*: the same neuron, with the same weight $w$, but now using state.
Acting at $t=0$ and again at $t=1$ carries state forward from one step to the next ([](#2_1_credit_assignment_temporal)).
Notice that this is the same picture as the two-layer case in [](#2_1_credit_assignment_spatial_two_layers), only now the "depth" is *time* rather than *space*.
The output is wrong by the same amount, and the same question returns: which timestep should receive the update?

The catch is that $w$ is *shared*: the very same parameter acts at every timestep.
When we ask how a small change in $w$ affects the final error, the answer is not a single number but a *sum*: one contribution from the role $w$ played at $t=0$, another from its role at $t=1$, and so on for every step it was active.
Unrolling the network in time and differentiating makes this explicit:

```{math}
:label: eq:bptt-gradient
\frac{\partial L}{\partial w} = \sum_{t} \left.\frac{\partial L}{\partial w}\right|_{t}
```

This is exactly the *backpropagation through time* (BPTT) computation [@werbos1990backpropagation]: we unroll the recurrence into a deep feedforward graph, one layer per timestep, and propagate the error backward through it.

Bundling every moment into a single gradient is convenient for *computing* an update, but it hides the same ambiguity we met in space.
The total error could be blamed on what the neuron did at $t=0$, on what it did at $t=1$, or split between the two in any proportion; the sum in {eq}`eq:bptt-gradient` constrains only the *whole*, never the per-step shares.
Where the spatial two-layer case had infinitely many pairs $(w_1, w_2)$ that yield the same output, the temporal case has infinitely many ways to distribute one shared weight's error across the moments it acted.
Time, in other words, is just another axis of depth - and credit assignment is ambiguous along it for exactly the same reason.

:::{figure} /_static/svg/2_1_credit_assignment_temporal.svg
:alt: Animation showing temporal credit assignment across two timesteps.
:label: 2_1_credit_assignment_temporal

Temporal credit assignment. The *same* neuron (weight $w = 2$) acts at $t=0$ and $t=1$, carrying its state forward. The output is off by the same error as the two-layer case, and the dashed feedback shows the ambiguity: which timestep should receive the update? As with multiple spatial weights, there are infinitely many solutions.
:::

:::{aside} How far does the spatial–temporal analogy hold?
The equivalence above is deliberately clean, and the real world can be less "neat", for three reasons.

First, the output is off by *the same* error as the two-layer case only *by construction*.
That follows from the particular weights we picked.
With arbitrary weights the two errors would generally differ.

Second, a shared weight is not the same as several separate weights.
Because one $w$ acts at every timestep, a single update changes the neuron's behavior *identically* across all of them, whereas the spatial case nudges its distinct weights by (generally) different amounts.
A more fair comparison would pit *two* temporal neurons (two weights unrolled over time) against the two spatial layers.
Here, the extra cost of time really appears, but it would also complicate the example.

Third, "which timestep should receive the update?" is about *attribution*, not bookkeeping.
We do not apply a separate update at each step: the per-step contributions are summed in {eq}`eq:bptt-gradient`, and a *single* update is applied to the shared weight.
The ambiguity is about how to read that sum, not about when the weight physically changes.
:::

The gradient in {eq}`eq:bptt-gradient` really flows through the chain of state updates $\partial V[t]/\partial V[t-1]$.
Carrying the membrane potential step by step through the entire chain of state updates makes SNNs especially hard:

- **Non-differentiable spikes**: the spike threshold has zero gradient almost everywhere, blocking the chain rule exactly where information is sent.
- **Vanishing or exploding gradients**: errors travel through a long product of state terms, arriving faint or wildly amplified.
- **Sparse, nonlinear dynamics**: only some neurons spike, and small changes can have large, delayed downstream effects.

### Credit assignment parameter updates
Once we know which components contributed to an error, we face a second question: how do we translate that knowledge into concrete parameter changes?

```{note} The geometry of the gradients: natural and isometric gradients
:class: dropdown

Knowing *which* component to blame tells us the *direction* to move a parameter, but not *how far*.
And distance is subtle: a step of $0.1$ in one weight may barely change the network's behavior, while the same step in another may ruin it.
Parameters live on different scales, so measuring an update by raw parameter distance (as plain gradient descent does) treats unlike things alike.

This matters even when credit is assigned perfectly.
A vanilla gradient step scales every parameter by the same learning rate, so it over-corrects the components the loss is very sensitive to and under-corrects those it is nearly flat in.
The direction can be right while the magnitude is wrong.

The **natural gradient** [@amari1998natural] addresses this by measuring distance in the space of the network's *outputs* rather than its parameters.
It rescales the update by the [Fisher information metric](https://en.wikipedia.org/wiki/Fisher_information_metric), so a unit step means "change the output distribution by this much", regardless of how the network is parameterized. 
The update becomes invariant to reparameterizations.

For SNNs the point is sharper still.
State and time *warp* the loss landscape: the same weight enters the loss at many timesteps (see [](#2_1_credit_assignment_temporal)), so its effective curvature compounds over the sequence.
A metric-aware (or *isometric*, distance-preserving) update ensures steps are taken equally in both space and time, rather than letting early timesteps or "loud" neurons dominate.
```

### A note on scalability
The ambiguity we have discussed so far is a question of *correctness*: which component, at which moment, deserves the credit.
Scalability is a separate, practical question: even when we know how to compute the credit, can we afford to?

Backpropagation through time answers the credit question by unrolling the network into one layer per timestep and storing every intermediate state, so it can later walk the errors backward.
That storage is the bottleneck.
Memory grows with the sequence length $T$ multiplied by the size of the network, because every activation along the way must be kept until the backward pass reaches it; compute grows with the same product, since each stored step must also be revisited.
A long recording or a deeply recurrent loop can exhaust memory long before it exhausts the idea.

This cost is a large part of *why* the coming chapters exist.
It motivates truncating the unroll to a short window, propagating sensitivities *forward* in time instead of backward (*real-time recurrent learning* (RTRL), which stores nothing extra as the sequence grows but scales poorly in network size [@marschall2020unified]) or abandoning the global backward pass entirely in favor of *local* rules (such as eligibility traces, plasticity, and reward signals) that update each synapse from information it already has on hand.
Correctness tells us what credit assignment *should* compute.
Scalability decides which approximation we can actually run.

### Why not just use backpropagation?
Beyond its memory cost, BPTT sits awkwardly with biology and neuromorphic hardware [@lillicrap2020backpropagation]: the backward pass needs the *transpose* of the forward weights (the **weight-transport problem**), it requires separate locked forward and backward phases, and its updates are non-local.
These objections motivate the alternatives that follow, some of which keep backprop's form but swap the transposed weights for fixed random ones (*feedback alignment* [@lillicrap2016random], *direct feedback alignment* [@nokland2016direct]) while
others drop the global backward pass entirely.

## Approaches to solving credit assignment
The rest of this topic explores three families of approaches, each developed fully in the chapters that follow:

- **Gradient-based**: approximate the derivatives and flow error signals backward, just as in classical deep learning ([](#surrogate_gradients), [](#exact_gradients)).
- **Eligibility-based**: each synapse keeps a running *eligibility trace* of its recent activity, so a later global signal (an error or a reward) can find the synapses responsible: the *three-factor* rule of neuroscience [@gerstner2018eligibility]. This is more than a heuristic. *e-prop* [@bellec2020solution] shows the exact BPTT gradient of {eq}`eq:bptt-gradient` factorizes into just such a local trace times a top-down signal (see [](#biologically_inspired_training)).
- **Direct optimization** — sidestep gradients entirely and *search* for good parameters through evolution or random perturbation ([](#evolutionary_algorithms)).

### Choosing a method: a simple heuristic
Now that you have multiple options, the practical question is *when to reach out for which*.
The choice depends on what is available (a differentiable loss? a reward signal? a compute budget?) and on what you *need* (biological plausibility? on-chip locality? sample efficiency?)
Here are a few questions to guide you:

- **Do you have a differentiable loss and enough memory to backpropagate?** Use a **gradient-based** method (surrogate gradients, [](#surrogate_gradients)). It is the default when it applies because it uses the error most efficiently.
- **Do you need a local rule a neuron could run on its own** for on-chip learning or biological plausibility? Use a **plasticity-based** rule, and add an **eligibility trace** when the learning signal arrives only after a delay.
- **Is your feedback a sparse, delayed, or non-differentiable reward** rather than a target output? Use a **reinforcement-based** method.
- **Is there no usable gradient at all**, but you can afford many forward evaluations? Fall back to **evolution** or another **direct-optimization** search.

The table below summarizes the trade-offs.
Plasticity- and eligibility-based rules are closely related (both are local) and evolution is one instance of the broader direct-optimization family.
They are separated here only where the distinction changes *when* you would reach out for them.

| Method | Use when... | Avoid when... | Typical cost |
|---|---|---|---|
| Gradient-based (surrogate) | You have a differentiable loss and can store the unrolled graph | Sequences are very long, memory is tight, or no gradient exists | High memory, growing with sequence length |
| Plasticity-based (local/Hebbian) | You need an on-chip, biologically plausible, online rule | A precise global error must be minimized | Low; local and online |
| Eligibility-based | Learning is local but the reward or error is delayed | A dense, immediate gradient is available | Low–moderate; one trace per synapse |
| Reinforcement-based | Feedback is a sparse, delayed, or non-differentiable reward | A dense supervised target is available | Moderate–high; high variance, sample-hungry |
| Evolution-based | No gradient exists but many forward passes are cheap | You have a good gradient and limited compute | High compute, but embarrassingly parallel |
| Direct optimization | The parameter space is tiny or no gradient exists | The parameter space is large | Scales poorly with increasing dimensionality |

These families are not mutually exclusive.
In practice they are often combined.
Eligibility traces carry a reward signal, surrogate gradients seed an evolutionary search, and plasticity rules can themselves be *meta-learned* by evolution ([](#meta_learning)).
Treat the heuristic as a starting point, not a verdict.


## Summary

> It is my conviction that no scheme for learning, or for pattern-recognition, can have very general utility unless there are provisions for recursive, or at least hierarchical, use of previous results. We cannot expect a learning system to come to handle very hard problems without preparing it with a reasonably graded sequence of problems of growing difficulty. - [@minsky1961steps]

As Minsky anticipated, credit assignment in SNNs requires exactly this kind of hierarchical reasoning—tracing contributions through layers of space and steps of time.

## Related reading
Here is a list of resources sorted by topic ([please help expand the list](#contributors)):

- Foundational: [@sutton2018reinforcement], [@werbos1990backpropagation], [@rumelhart1986learning], [@williams1989learning], [@bengio1994learning]
- Gradient geometry (natural gradient): [@amari1998natural], [@martens2020new]
- [Eligibility traces](#biologically_inspired_training): [@bellec2020solution], [@gerstner2018eligibility], [@singh1996reinforcement]
- [Reinforcement learning](https://en.wikipedia.org/wiki/Reinforcement_learning): [@sutton2018reinforcement], [@pignatelli2023survey], [@singh1996reinforcement]
- Biologically plausible alternatives to backprop: [@lillicrap2016random], [@nokland2016direct], [@whittington2017approximation], [@scellier2017equilibrium], [@lee2015difference]
- [Neuroscience](https://en.wikipedia.org/wiki/Neuroscience): [@lillicrap2020backpropagation], [@murray2019local], [@roelfsema2018control]
- [Category theory](https://en.wikipedia.org/wiki/Category_theory): [@cruttwell2022categorical]