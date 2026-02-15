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
Whether you think about credit as "reward" or "punishment", the essense of the problem is the same:

:::{aside} A note on credit assignment history
While Minsky was the first to thoroughly study credit assignment, the notion of "credit" was not new.
Minsky was studying it for reinforcement learning, which means learning from feedback over time.
The machine learning community picked this up, but peeled off the temporal aspect because their networks typically did not care about time (like digit classification).
Coincidentally, suttons original interpretation is highly relevant here, because SNNs are troublesome exactly because they work in space *and* time.
Sutton and Barto has an excellent chapter on (reinforcement) learning history [@sutton2018reinforcement].
:::

> The credit for a working program can only be assigned to functional groups of instructionis, e.g., subroutines, and as these operate in hierarchies we should not expect individual instruction reinforcement to work well. - @minsky1961steps

What Minsky is saying, is that our networks consist of subcomponents that, together, make up the whole.
So, if we are to assign credit and improve the network, we need first understand how each component contribute to the whole.
Specifically, what is the contribution of, say, a synapse to the network output?
Only when we understand that contribution, do we know how to change the synapse.
That is the fundamental problem of credit assignment.
How do we assign credit to the individual components?

### Credit assignment in space
TODO: Animation for a single weight

TODO: Animation for two weights with a sum

### Credit assignment in time

TODO: Animation for a single weight in time

TODO: Animation for a single weight with a time constant

**In SNNs, this becomes complex because:**
- **Temporal dependencies**: Spikes at different times influence the final output
- **Sparse interactions**: Only some neurons spike, creating complex dependency chains
- **Nonlinear dynamics**: Small changes can have large downstream effects

### Credit assignment parameter updates

### A note on scalability

## Approaches to solve credit assignment

**Different approaches to solve credit assignment:**
- **Gradient-based**: Approximate derivatives to flow error signals backward
- **Eligibility-based**: Track which synapses were "eligible" for updates
- **Reinforcement-based**: Use global reward signals to guide local updates
- **Direct optimization**: Evolve or search for solutions without gradients

### Eligibility traces

### Reinforcement learning

### Gradient-free methods


## Summary

> It is my conviction that no scheme for learning, or for pattern-recognition, can have very general utility unless there are provisions for recursive, or at least hierarchical, use of previous results. We cannot expect a learning system to come to handle very hard problems without preparing it with a reasonably graded sequence of problems of growing difficulty. - [@minsky1961steps]



## Other material
Here are a list of resources sorted by topic ([please help expand the list](#contributors)):

- Foundational: [@sutton2018reinforcement], [@werbos1990backpropagation]
- [Eligibility traces](#eligibility-traces): [@bellec2020solution], [@gerstner2018eligibility], [@singh1996reinforcement]
- [Reinforcement learning](https://en.wikipedia.org/wiki/Reinforcement_learning): [@sutton2018reinforcement], [@pignatelli2023survey], [@singh1996reinforcement]
- [Neuroscience](https://en.wikipedia.org/wiki/Neuroscience): [@lillicrap2020backpropagation], [@murray2019local], [@roelfsema2018control]
- [Category theory](https://en.wikipedia.org/wiki/Category_theory): [@cruttwell2022categorical]