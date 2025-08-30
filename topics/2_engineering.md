---
authors:
  - name: Jens Egholm Pedersen
    affiliation: Technical University of Denmark
numbering:
  headings:
    enabled: true
    depth: 1
---

(engineering)=

# Engineering SNNs

This topic describes how to engineer well-tuned neural networks that solve even
complex problems. A central theme is how networks **learn** from experience.
Most networks are randomly initialized and then evolve through learning, and to
properly understand how to steer this learning process, we build on the neuron
models and encoding schemes from the previous topic [](#foundations).

First, we introduce [1. Credit Assignment](#credit_assignment): how success or failure
is attributed to network components so they can adjust to improve performance.
Now that we understand how networks learn, we introduce [2. Offline Training](#offline_training) to
train them against datasets.
The hope is that the network performs well _after_ training when you expose it
to data that resembles the training data.
But once the network is trained, it stops learning.
[3. Online Training](#online_training) solves this by continuously updating the network
so its performance improves over time.
The drawback is that the network can perform _worse_ than before, but it is a
highly active area of research because of its appeal: continuous learning
and adaptation is exactly how biology solved the problem of learning so it must
be feasible to implement in artificial systems.
We additionally cover [4. Alternative Training Methods](#alternative_training_methods) such as meta-learning, network architecture search, and ANN-to-SNN conversion.

The final chapter relates how training can be improved in various ways.
For instance by tuning the parameters that control the training ("hyperparameters") and other tricks to improve network performance.

<span style="font-size: 150%; font-weight: bold;"> What You'll Learn </span>

- **Credit Assignment**: How to attribute success/failure to network components
  across time and space
- **Offline Training**: BPTT, surrogate gradients, and supervised learning
  approaches
- **Online Training**: STDP, eligibility traces, and biologically-inspired
  learning
- **Alternative Methods**: Evolutionary algorithms, direct encoding, and hybrid
  approaches
- **Optimization**: Hyperparameter tuning, regularization, and performance
  optimization

<span style="font-size: 150%; font-weight: bold;"> What You Need to Know </span>

We assume familiarity with neuron models ([](#neuron)) and spiking neuron models
([](#spiking)) as well as [encoding and decoding schemes](#encdec).
We also assume familiarity with neural network components such as convolutional layers, and recurrent layers.
There are excellent tutorials on [basic machine learning workflow at the PyTorch
webside](https://docs.pytorch.org/tutorials/beginner/basics/intro.html) that we
recommend for those new to the concepts above.
