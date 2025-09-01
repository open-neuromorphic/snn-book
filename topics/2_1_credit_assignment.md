(credit_assignment)=

# Credit Assignment in SNNs

The fundamental engineering challenge in designing neural networks is **credit assignment**: when the network makes an error, how do we determine which components to adjust? And by how much?

:::{margin} Credit Assignment example
Whenever a network makes a _wrong_ prediction, we need to determine which part of the network is responsible for the error.

```{image} figures/credit_assignment.svg
:alt: Example of how the output of a neural network needs to
:width: 300px
:align: center
:label: A small example of credit assignment. The network outputs 5 (top), but should have been 4 (mid), where yields an error of 1 (bottom). What should then be adjusted?
```

Imagine a network that outputs a _wrong_ prediction of 5.
If we expected 4, we get an error of 1.
The problem of credit assignment is this: how do we determine which part of the network to update? And by how much?
:::

## The Credit Assignment Problem

**Core question:** Given an output error, which neurons, synapses, contributed to that error—and at which time step?

**In SNNs, this becomes complex because:**

- **Temporal dependencies**: Spikes at different times influence the final output
- **Sparse interactions**: Only some neurons spike, creating complex dependency chains
- **Nonlinear dynamics**: Small changes can have large downstream effects

## Engineering Solutions

**Different approaches to solve credit assignment:**

- **Gradient-based**: Approximate derivatives to flow error signals backward
- **Eligibility-based**: Track which synapses were "eligible" for updates
- **Reinforcement-based**: Use global reward signals to guide local updates
- **Direct optimization**: Evolve or search for solutions without gradients

## Key Engineering Concepts

- **Spatial credit assignment**: Which neurons contributed to the error?
- **Temporal credit assignment**: When did the critical events occur?
- **Update mechanisms**: How to translate credit into parameter changes
- **Scalability**: Methods that work for large networks and long sequences

This chapter establishes the foundation for understanding why different training methods exist and when to use each approach.
