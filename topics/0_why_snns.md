---
numbering: false
---
(why_snns)=
# Why spiking neurons and spiking networks?

Artificial Neural Networks (ANNs) excel at pattern recognition and 
decision-making, but biological brains are fundamentally more capable; and 
brains solve harder problems while consuming vastly less energy! The key 
difference lies in how neurons compute.

**Biological neurons are hybrid systems**: They gather analog information 
internally through continuous _chemical_ and _electrical_ processes, but 
communicate digitally via discrete electrical pulses called *action potentials* 
(also known as *spikes*) [@Neumann2012]. This combination gives brains - both 
the _precision_ of digital computation and the _efficiency_ of analog processing.

**Spiking Neurons** are computational models that capture this dual nature. They 
integrate incoming signals over _time_ and emit discrete spikes when certain 
conditions are met; this is unlike the artificial neurons (e.g.,
$\texttt{ReLU}$). When networks of spiking neurons are deployed on specialized 
neuromorphic hardware, they achieve:

- **Higher computational expressivity**: Time-based encoding and processing 
  carries more information
- **Greater energy efficiency**: Events are processed only when spikes occur,
  thus, inherently sparser
- **Lower latency**: Asynchronous processing enables real-time responses, aided
  by locality of memory and compute

**The challenge**: SNNs are harder to understand and train than the conventional 
ANNs. Working with and leveraging the temporal dynamics and discrete spike 
events require different mathematical tools and training methods. Moreover,
adapting and implementing the SNNs on emerging neuromorphic hardware is also not
straightforward and standardized; not to mention, designing and building 
neuromorphic chips/systems is another complex task.

**Our goal**: Give you the intuition and practical skills to design, build, 
train, and deploy SNNs on neuromorphic hardware effectively. In this book, we 
start with the fundamentals and build toward real-world applications with 
neuromorphic systems.
