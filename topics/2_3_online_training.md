(online_training)=
# Online Training
*Real-time learning during operation*

**Online training** means updating parameters during active network operation - learning happens while the network is running in real-time.

## Energy-Based Optimization

**Core principle:** Networks evolve to perform better and better, learning by finding configurations that minimize error (or equivalently, minimize system energy).

**This decomposes into different optimization problems:**
- **Mechanical perspective**: Hamiltonian dynamics - system evolution conserves energy while optimizing configurations
- **Information perspective**: Fisher information - optimal updates follow the natural gradient of information geometry
- **Statistical perspective**: Maximum likelihood - find parameters that best explain observed data patterns

## Concrete Methods That Fall Out

**From energy minimization principles:**
- **Hopfield networks**: Minimize quadratic energy functions, naturally implement associative memory
- **Boltzmann machines**: Use thermal equilibrium to find optimal probability distributions
- **STDP in SNNs**: Emerges from minimizing prediction error in temporal sequences
- **Contrastive divergence**: Approximates energy gradient by contrasting data and model distributions

**From information optimization:**
- **Competitive learning**: Maximize information while minimizing redundancy
- **Reward modulation**: Information-theoretic optimization guided by external signals
- **Homeostatic plasticity**: Maintains optimal information flow by regulating activity levels

## Engineering Implementation

**Key requirements:**
- Local energy computations (no global optimization needed)
- Real-time operation (updates during network activity)
- Convergence guarantees (energy bounds ensure stability)
- Hardware compatibility (energy-based rules map to neuromorphic circuits)
