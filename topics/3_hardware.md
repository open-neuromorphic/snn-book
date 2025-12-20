(deployment)=
# Deploying SNNs on Hardware

In the previous chapters you have looked that what SNNs are and the various features that you can use to construct your networks. Up to this point, you will have been simulating any SNNs that you have created in order to see them in operation.  SNN simulators are very good at letting you see the results of the fullness of what you have described, but they can also be quite forgiving on letting you describe features quite far removed from any likely found in actual biological networks.  Why is this important you may ask, and with good reason?  The answer to this question is that we know from biology that SNNs can do some amazing things that have so far eluded us somewhat in our attempts to replicate them, none more so than the fact that it manages these feats with such little power used.

To that end, hardware has been designed and developed in an attempt to efficiently simulate SNNs, and move us closer to that biological-level efficiency.  However, these hardware systems are not always as forgiving of network-level inefficiencies, and so more care must be taken when simulating, or indeed emulating, networks on such systems.  The gains to be made are many though, so you are requested to persevere through the challenges.  With that in mind, we will present some of the systems that already exist and discuss how you can make use of them, and how they might help you on the path to uncovering the secrets that make biological networks so efficient and effective.



(deployment)=
# Deploying SNNs

This chapter covers
(1) the various neuromorphic hardware types and the platforms available today,
(2) the deployment frameworks for each hardware platform, and
(3) quantization methods that lets you squeeze your model onto hardware. -->

(deployment)=
# Deploying SNNs to Neuromorphic Hardware

This topic details the process of deploying Spiking Neural Networks onto specialized neuromorphic hardware. It moves from the motivating principles and core hardware design trade-offs to the practical compilation toolchain and platform-specific implementations.

The topic is organized as follows:

1. Motivation and Performance Metrics: This chapter talks about system level benchamrks and figures of merit of neuromorphic computing systems. It contrasts the event-driven paradigm with synchronous processing in GPUs, focusing on key performance indicators relevant to SNNs:
    - Beyond energy consumption per synaptic operation.
    - Inference latency and real-time processing capabilities.
    - Trade-offs in computational precision and bandwidth, drawing from application examples like sensor-edge control systems.
    - 
    
    # Benchmarking SNNs
    Metrics beyond accuracy: sparsity, energy, latency
    Temporal performance evaluation
    Robustness testing and adversarial examples
    Comparing SNN performance to ANN baselines
    Standardized benchmarks and datasets
    SNN suitable datasets vs ANN suitable datasets
    

2. Hardware Design Principles and Deployment Consequences: An overview of the fundamental design decisions that differentiate neuromorphic platforms. Each principle is directly tied to its practical consequences for the ML engineer during model deployment, with accompanying examples.

    - Analog vs. Digital Neuron Circuits: Discusses the implications of analog's efficiency versus digital's precision on model quantization and noise robustness.
    - Neuron and Synapse Model Flexibility: Explores the spectrum from highly configurable models to fixed-function hardware, and how this constrains the translation of a software-defined SNN.
    - On-Chip Communication and Scalability: Covers different {term}`NoC` strategies and their impact on how a large SNN graph must be partitioned and routed across the hardware.

3. The Neuromorphic Compilation Toolchain: This section details the sequence of steps required to map a software-based SNN to a physical hardware target
    - Quantize-aware training and post-training quantization
    - Partition, place and route
    - Runtimes


4. Platform-Specific Deployment Examples: This final section provides practical, end-to-end case studies for deploying a simple SNN on representative hardware platforms. Each subsection will walk through the process using the platform's native deployment framework, highlighting how the concepts from the previous sections apply.
    - Case Study 1: Deployment to a Large-Scale Asynchronous System (e.g., SpiNNaker/Loihi).
    - Case Study 2: Deployment to a Microcontroller-based or Edge-Focused System (e.g. Synsense/Innatera)

5. Platform interoperability
    - Intermediate representation: NIR
    - Network descriptions with multiple backends: PyNN

6. Data, datasets and sensors
    - Traditional sensors
    - Neuromorphic sensors
