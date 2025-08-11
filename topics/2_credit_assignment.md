(credit_assignment)=
# Credit Assignment in SNNs

The fundamental engineering challenge in training any neural network is **credit assignment**: when the network makes an error, how do we determine which components to adjust and by how much?

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
