(deployment)=
# Deploying SNNs on Hardware

In the previous chapters you have looked that what SNNs are and the various features that you can use to construct your networks. Up to this point, you will have been simulating any SNNs that you have created in order to see them in operation.  SNN simulators are very good at letting you see the results of the fullness of what you have described, but they can also be quite forgiving on letting you describe features quite far removed from any likely found in actual biological networks.  Why is this important you may ask, and with good reason?  The answer to this question is that we know from biology that SNNs can do some amazing things that have so far eluded us somewhat in our attempts to replicate them, none more so than the fact that it manages these feats with such little power used.

To that end, hardware has been designed and developed in an attempt to efficiently simulate SNNs, and move us closer to that biological-level efficiency.  However, these hardware systems are not always as forgiving of network-level inefficiencies, and so more care must be taken when simulating, or indeed emulating, networks on such systems.  The gains to be made are many though, so you are requested to persevere through the challenges.  With that in mind, we will present some of the systems that already exist and discuss how you can make use of them, and how they might help you on the path to uncovering the secrets that make biological networks so efficient and effective.


## Different Neuromorohic Hardware

Neuromorohic hardware comes in many different forms, driven by different design principles and ideas.  Some hardware is digital, like a standard computer, to simulate neurons and synapses.  Others use analog electronic components, like resistors and capacitors, to emulated the behaviour of individual neurons and synapses.  Others still combine both digital and analogue electronics in their efforts to replicate the network activity.  It is important that you consider the properties of the hardware when considering the networks that you are going to run on it as this may determine how successful the deployment is.

Analogue electronic systems generally can emulate neural activity very quickly compared to biological neurons, as electronic circuits operate at speeds far exceeding that of their biological counterparts.  This makes hardware based on these circuits very good for running with many different parameter values and for very long biologically-equivalent durations.  However, they are also much more likely to show random behavioural differences and produce different results depending on the specific hardware they are run on.  This makes it important to consider how a network might account for these differences and adapt to them.  After all, biological neurons are unlikely to be homogeneous and so such adaptation is likely to happen more in practice.  The speed at which they operate also makes it harder to use in closed-loop systems, where some output is used for control and where the change of output then affects the input, resulting in further changes to output and so on.  This is because the network activity will evolve more quickly than the environment in which it is operating.

By comparison, systems based on digital simulation are much better suited to closed-loop interaction, as, even if they can run faster than real-time, they are often amenable to being paused while the environment can catch-up.  The activity of digital hardware is normally also somewhat more repeatable, though there are places where this might not be the case due to, for example, asynchronous execution which is often more random in nature, being subject to race-conditions that might go different ways in different simulations.  These properties generally make them more suited to deploying networks where the specific parameters are being tested for, and networks that are less adaptable to differences in behaviour of the neurons and synapses themselves.

Both of these systems will often come with further limitations.  For example, it is common that there might be a limit in the number of neurons and/or synapses that can be simulated at a time.  There may also be limits in the neural and/or synaptic models implemented in the hardware, as well as what synaptic plasticity rules are available.  Finally, the hardware in question may use a specific language to describe networks that is different from that used by other hardware or indeed software simulation or emulation systems.

In some cases the hardware will allow you to write additional custom extensions that modify the behaviour in some way.  This might include adding your own models of neurons activity (more common in digital hardware), or possibly new model synaptic plasticity algorithms; on analogue hardware this might then be run in digital hardware that can modify the weights or other properties of the network but which still otherwise uses analogue hardware for the rest of the emulation.  Some hardware could also use more exotic components such as memristors, which might then enable learning to happen within the circuits themselves.


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
