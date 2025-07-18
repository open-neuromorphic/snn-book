(alternative_training)=
# Alternative Training Methods

When gradient-based or energy-based methods aren't suitable, several alternative approaches can train SNNs effectively.

## ANN-to-SNN Conversion

**Core idea:** Train a conventional ANN, then convert it to an SNN
- **Rate-based conversion**: Map ANN activations to spike rates
- **Threshold balancing**: Adjust SNN thresholds to match ANN outputs
- **Temporal coding**: Convert activation magnitudes to spike timing patterns

**When to use:** When you need SNN benefits but have established ANN training pipelines

## Evolutionary and Genetic Algorithms

**Core idea:** Evolve network parameters through population-based search
- **Neuroevolution**: Directly optimize connection weights and architectures
- **Genetic programming**: Evolve both structure and parameters simultaneously
- **Distributed evolution**: Parallel search across multiple network variants

**When to use:** When gradients are unavailable or when exploring novel architectures

## Meta-Learning Approaches

**Core idea:** Learn how to learn - optimize the learning algorithm itself
- **Architecture search**: Automated discovery of optimal SNN topologies
- **Hyperparameter optimization**: Learn optimal learning rates, time constants
- **Few-shot adaptation**: Quickly adapt to new tasks with minimal data

**When to use:** When you need rapid adaptation to new domains or tasks

## Engineering Trade-offs

**Advantages:** Don't require differentiability, can explore novel solutions, robust to local minima
**Limitations:** Computationally expensive, slower convergence, require careful tuning
