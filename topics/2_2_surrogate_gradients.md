(surrogate_gradients)=
# Surrograte Gradient Training
*Training with gradient approximations*

## Primary Method: BPTT with Surrogate Gradients

**Core approach:**
- Unroll temporal dynamics across time steps
- Replace non-differentiable spikes with smooth surrogate functions
- Compute gradients using complete sequence information

**Engineering considerations:**
- **Surrogate selection**: Rectangular, triangular, or exponential approximations
- **Sequence handling**: Truncated BPTT for computational efficiency
- **Memory optimization**: Activation storage vs. recomputation trade-offs

## When to Use

**Best for:** Supervised learning, accuracy-critical applications, pre-training phases
**Limitations:** Requires inactive training periods, can't adapt during deployment
