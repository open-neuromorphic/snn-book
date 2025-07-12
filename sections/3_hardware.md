<!-- (section:deployment)=
# Deploying SNNs

This chapter covers
(1) the various neuromorphic hardware types and the platforms available today,
(2) the deployment frameworks for each hardware platform, and
(3) quantization methods that lets you squeeze your model onto hardware. -->

(section:deployment)=
# Deploying SNNs to Neuromorphic Hardware

This chapter details the process of deploying Spiking Neural Networks onto specialized neuromorphic hardware. It moves from the motivating principles and core hardware design trade-offs to the practical compilation toolchain and platform-specific implementations. The content is structured to provide a working knowledge for machine learning engineers familiar with standard deep learning frameworks.

The chapter is organized as follows:

1. Motivation and Performance Metrics: This section establishes the context for neuromorphic computing. It contrasts the event-driven paradigm with synchronous processing in GPUs, focusing on key performance indicators relevant to SNNs:
    - Beyond energy consumption per synaptic operation.
    - Inference latency and real-time processing capabilities.
    - Trade-offs in computational precision and bandwidth, drawing from application examples like sensor-edge control systems.

2. Hardware Design Principles and Deployment Consequences: An overview of the fundamental design decisions that differentiate neuromorphic platforms. Each principle is directly tied to its practical consequences for the ML engineer during model deployment, with accompanying examples.

    - Analog vs. Digital Neuron Circuits: Discusses the implications of analog's efficiency versus digital's precision on model quantization and noise robustness.
    - Neuron and Synapse Model Flexibility: Explores the spectrum from highly configurable models to fixed-function hardware, and how this constrains the translation of a software-defined SNN.
    - On-Chip Communication and Scalability: Covers different network-on-chip (NoC) strategies and their impact on how a large SNN graph must be partitioned and routed across the hardware.

3. The Neuromorphic Compilation Toolchain: This section details the sequence of steps required to map a software-based SNN to a physical hardware target
    - Quantize
    - Transform


4. Platform-Specific Deployment Examples: This final section provides practical, end-to-end case studies for deploying a simple SNN on representative hardware platforms. Each subsection will walk through the process using the platform's native deployment framework, highlighting how the concepts from the previous sections apply.
    - Case Study 1: Deployment to a Large-Scale Asynchronous System (e.g., SpiNNaker/Loihi).
    - Case Study 2: Deployment to a Microcontroller-based or Edge-Focused System (e.g. Synsense/Innatera)

5. Platform interoperability
    - NIR

6. Data, datasets and sensors
    - Traditional sensors
    - Neuromorphic sensors

