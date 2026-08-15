---
authors:
- name: Pedersen, Jens Egholm
  affiliation: Technical University of Denmark
  email: jegpe@dtu.dk
- name: Korakovounis, Dimitrios
  affiliation: KTH Royal Insitute of Technology
  email: dimkor@kth.se
---
(credit_assignment)=
# Credit Assignment in SNNs

To improve any neural network, we need to solve the **credit assignment challenge**: when the network makes an error, how do we determine which components to adjust? And by how much?
This chapter explains the intuition and mathematics behind credit assignment with an emphasis on time.
Because, unfortunately, credit assignment becomes harder when you work with stateful neurons and networks, described in the previous topic, [](#foundations).

```{note}
This chapter helps understand the purpose of the subsequent chapters.
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
Sutton and Barto has an excellent chapter on (reinforcement) learning history [@sutton2018reinforcement].
:::

> The credit for a working program can only be assigned to functional groups of instructions, e.g., subroutines, and as these operate in hierarchies we should not expect individual instruction reinforcement to work well. - @minsky1961steps

What Minsky is saying, is that our networks consist of subcomponents that, together, make up the whole.
So, if we are to assign credit and improve the network, we first need to understand how each component contributes to the whole.
Specifically, what is the contribution of, say, a synapse to the network output?
Only when we understand that contribution, do we know how to change the synapse.
That is the fundamental problem of credit assignment.
How do we assign credit to the individual components?

### Credit assignment in space
> The structural credit assignment problem is to determine which internal decisions are responsible - @minsky1961steps

In a feedforward network, credit assignment reduces to a structural question: which connections along the path from input to output are responsible for the error?

Consider a single linear layer with a single weight, shown in [](#2_1_credit_assignment_spatial).
In this case, we want an input of $1$ to produce $1$ as the output.
But, since the weight is ${2}$, the output $1 * w_1 = 1 * 2 = 2$ is off by one.
We can solve this by adjusting the linear weight from $2 \to 1$, which gives $1 * 1 = 1$ and we have reached our goal!

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
Fing at least one solution for ${\rm output} = {\rm goal}$?
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
Now, imagine adding time to the equation.

### Credit assignment in time
In networks without memory, credit assignment only needs to trace errors backward through layers.
But neurons with state carry information across time, and a spike at timestep $t$ may cause an error at timestep $t + 100$.
Now we must assign credit not just to the right component, but to the right component at the right moment.

TODO: Animation for a single weight in time

TODO: Animation for a single weight with a time constant

**In SNNs, this becomes complex because:**
- **Temporal dependencies**: Spikes at different times influence the final output
- **Sparse interactions**: Only some neurons spike, creating complex dependency chains
- **Nonlinear dynamics**: Small changes can have large downstream effects

### Credit assignment parameter updates
Once we know which components contributed to an error, we face a second question: how do we translate that knowledge into concrete parameter changes?

### A note on scalability

## Approaches to solve credit assignment
The rest of this topic explores four families of approaches.
We briefly introduce them here and develop them fully in the chapters that follow.

- **Gradient-based**: Approximate derivatives to flow error signals backward, treated in [#surrogate_gradients]
- **Eligibility-based**: Track which synapses were "eligible" for updates
- **Reinforcement-based**: Use global reward signals to guide local updates
- **Direct optimization**: Evolve or search for solutions without gradients

### Eligibility traces
Eligibility traces offer a biologically plausible mechanism for temporal credit assignment: each synapse  maintains a running record of its recent activity, marking it as "eligible" for an update when a learning signal arrives.

### Reinforcement learning
Rather than computing precise error gradients, reinforcement-based approaches assign credit using a global reward signal, asking: did the network's overall behavior improve or worsen?

### Gradient-free methods
When gradients are unavailable or too expensive to compute, we can sidestep the problem entirely and search for good solutions through evolution, random perturbation, or other optimization strategies.


## Summary

> It is my conviction that no scheme for learning, or for pattern-recognition, can have very general utility unless there are provisions for recursive, or at least hierarchical, use of previous results. We cannot expect a learning system to come to handle very hard problems without preparing it with a reasonably graded sequence of problems of growing difficulty. - [@minsky1961steps]

As Minsky anticipated, credit assignment in SNNs requires exactly this kind of hierarchical reasoning—tracing contributions through layers of space and steps of time.

## Related reading
Here are a list of resources sorted by topic ([please help expand the list](#contributors)):

- Foundational: [@sutton2018reinforcement], [@werbos1990backpropagation]
- [Eligibility traces](#eligibility-traces): [@bellec2020solution], [@gerstner2018eligibility], [@singh1996reinforcement]
- [Reinforcement learning](https://en.wikipedia.org/wiki/Reinforcement_learning): [@sutton2018reinforcement], [@pignatelli2023survey], [@singh1996reinforcement]
- [Neuroscience](https://en.wikipedia.org/wiki/Neuroscience): [@lillicrap2020backpropagation], [@murray2019local], [@roelfsema2018control]
- [Category theory](https://en.wikipedia.org/wiki/Category_theory): [@cruttwell2022categorical]
