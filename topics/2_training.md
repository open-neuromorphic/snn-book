(training)=
# Training SNNs

```{note} Topic headline
**Training SNNs** gives you the tools to train and optimize
networks for certain tasks.
```

How do you train a neural network that communicates through discrete spikes
across time? How do you handle the non-differentiable nature of spike
generation? What are the trade-offs between biological plausibility and
computational efficiency? This topic covers the complete training workflow for
SNNs: from understanding how credit assignment flows through spiking networks to
implementing practical and efficient training setups. It begins with the
fundamental challenge of backpropagation through time with spikes, explores
various gradient-based and gradient-free methods, and concludes with
optimization strategies and conversion techniques; all covered in the chapters
as follows:

## What You'll Learn?

1. **Credit Assignment**: How do you attribute success or failure to specific
network components when dealing with both spatial connectivity and temporal
dynamics? This chapter explores the fundamental challenge of credit assignment
in SNNs, including backpropagation through time for spiking networks.
2. **Surrogate Gradients**: How can we train spiking neurons despite being
non-differentiable? This chapter introduces surrogate gradient methods that
approximate gradients during the backward pass while maintaining spike-based
computation in the forward pass.
3. **Exact Gradients**: Are there methods to compute exact gradients through
spiking neurons? This chapter covers ways to leverage the precise timing of
spikes to get exact gradient information.
4. **Meta Learning**: Can networks learn how to learn better? This chapter
explores meta-learning approaches for SNNs, including learning rate adaptation,
architecture search, and learning optimization strategies.
5. **Biologically Inspired Training**: How does the brain assign credit and learn
without backpropagation? This chapter covers Spike-Timing Dependent Plasticity 
(STDP), local learning rules, and biologically plausible training methods that 
work without global error signals.
6. **Evolutionary Algorithms**: Can we evolve SNNs instead of training them with
gradients? This chapter introduces evolutionary strategies, genetic algorithms,
and neuroevolution techniques that can discover network parameters and
architectures through simulated evolution.
7. **ANN-to-SNN Conversion**: How can we leverage pre-trained Artificial Neural
Networks (ANNs)? This chapter covers conversion techniques that transform 
conventional ANNs into SNNs, including rate-based conversion, calibration 
methods, and handling of various layer types.
8. **Optimization**: How do we make SNN training practical and efficient? This
chapter covers hyperparameter tuning strategies, regularization techniques for
temporal dynamics, batch normalization adaptations, and performance optimization
for faster training.