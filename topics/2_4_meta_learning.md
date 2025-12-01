(meta_learning)=
# Meta Learning

**Core idea:** Learn how to learn - optimize the learning algorithm itself
- **Architecture search**: Automated discovery of optimal SNN topologies
- **Hyperparameter optimization**: Learn optimal learning rates, time constants
- **Few-shot adaptation**: Quickly adapt to new tasks with minimal data

**When to use:** When you need rapid adaptation to new domains or tasks

## Network Architecture Search (NAS)

**Core idea:** Find an optimal configuration in the search space of possible network architectures.
- **Bayesian optimization**: Direct the search with Bayesian statistics.
- **One-shot models**: Using a cluster of models to learn architecture meta-parameters.
- **Evolving networks**: Similar to evolutionary algorithms, but combined with offline training.

**When to use**: When gradients are unavailable or when exploring novel architectures.
