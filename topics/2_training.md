(training)=
# Training SNNs

This topic covers the complete training workflow for SNNs: from understanding how credit assignment flows to practical and efficient training setups, tailored to your use case.

## Why Training Matters
The previous topic, [](#foundations), identifies the core elements of spiking neural networks.
But, then what? Randomly putting spiking neurons together is rarely useful.
The connections, time constants, and thresholds needs to *adapt* to a specific scenario: we need to **train** the parameters of the network to achieve the desired behavior.
This is what we cover in this topic.

TODO: Insert experiment

You might object that you can calculate the optimal set of parameters from the beginning.
That you know the exact solution your system needs to adhere to, so you have no need to fiddle with the network afterwards.
If that is the case, you are in luck, and you can entirely avoid training, skip this topic on training, and continue to the topic on [](#deployment).
But please tell us the secret behind your approach!

We write about training because it is generally harder in SNNs for two reasons: recurrent (time) and discontinuities.
Classical neural networks have nice and continuous functions that are easily differentiable.
SNNs, on the other hand, use state-dependent nonlinearities that unroll in time, which makes them expensive to compute.
What's more, the activations have jumps that are challenging to differentiate.
But there are solutions to most scenarios, and this topic presents a set of ideas and methods to address these scenarios.

## Background
If you think about a neural network as a system of equations, the search for good, even optimal, solutions reduces to a simple optimization process.
If $x$ is the variable we would like to compute and $b$ is some  ...

TODO: Continue

$$Ax = b$$


## Contents in this Topic
The topic is organized around methods for solving the [credit assignment problem](#credit_assignment) for SNNs.
We begin by discussing gradient methods in the chapters on [](#surrogate_gradients) and [](#exact_gradients) because they closely resemble the methods in classical neural networks and because they are popular in the present-day literature.
The chapter on [meta learning](#meta_learning) teaches you how you can improve the learning mechanisms.
Or, learn to learn. This is an interesting and fruitful approach that is arguably also biologically inspired and useful in both classical and spiking neural networks alike.
The subsequent chapters on [](#biologically_inspired_training) and [](#evolutionary_algorithms) abandon the comfortable realm of backpropagation to build learning algorithms that closer to biology in ways.
First, they are biologically feasible, meaning that they can be built exclusively with components from the Topic on [](#foundations).
Second, they are decentralized and asynchronous, meaning that the individual components are driven by local dynamics that, taken together, produce desirable effects.
The chapter on [](#ann-to-snn_conversion) covers methods to convert classical artificial neural networks into SNN, which circumvents the training problem by simply training the ANN before conversion instead.
The final chapter on [](#optimization) discuss methods to improve training performance, both in terms of accuracy and speed.

Here is the list of chapters:

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
