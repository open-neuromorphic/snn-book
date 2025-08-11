(offline_training)=
# Offline Training
*Batch processing without real-time constraints*

**Offline training** means training while the network is inactive - using pre-collected data without real-time constraints. This is the **prevailing method** for training SNNs in practical applications.

## Key Difference
- **Offline**: Network processes training data in simulation, can use full sequence information
- **Online**: Updates happen during active operation, must respect real-time constraints

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
