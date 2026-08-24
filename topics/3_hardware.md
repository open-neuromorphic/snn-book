(deployment)=
# Deploying SNNs on Hardware

In the previous chapters you have looked that what SNNs are and the various features that you can use to construct your networks. Up to this point, you will have been simulating any SNNs that you have created in order to see them in operation using a software simulator running on standard compute hardware, like a laptop or desktop PC.  Software SNN simulators are very good at letting you see the results of the fullness of what you have described, but they can also be quite forgiving on letting you describe features quite far removed from any likely found in actual biological networks.  "Why is this important?", you may ask, and with good reason.  The answer to this question is that we know from biology that SNNs can do some amazing things that have so far eluded us somewhat in our attempts to replicate them, none more so than the fact that it manages these feats with such little power used.  Thus if we want to replicate these achievements, a good way to start is to replicate the properties of the biological networks.

To that end, hardware has been designed and developed in an attempt to efficiently simulate SNNs, and move us closer to that biological-level efficiency.  However, these hardware systems are not always as forgiving of network-level inefficiencies, and so more care must be taken when simulating, or indeed emulating, networks on such systems.  The gains to be made are many though, so you are requested to persevere through the challenges.  With that in mind, we will present some of the systems that already exist and discuss how you can make use of them, and how they might help you on the path to uncovering the secrets that make biological networks so efficient and effective.


## Different Types of Neuromorphic Hardware

Neuromorphic hardware comes in many different forms, driven by different design principles and ideas.  Some hardware is digital, like a standard computer, to simulate neurons and synapses, that is, the neurons are programmed simulations which have a state that is updated during the simulation.  Others use analog electronic components, like resistors and capacitors, to *emulate* the behaviour of individual neurons and synapses, that is, the circuits behave like real neurons (with respect to some model e.g. LIF), and the state is therefore part of the circuit rather than a digital variable.  Others still combine both digital and analogue electronics in their efforts to replicate the network activity.  It is important that you consider the properties of the hardware when considering the networks that you are going to run on it as this may determine how successful the deployment is.

Analogue electronic systems generally can emulate neural activity very quickly compared to biological neurons, as electronic circuits operate at speeds far exceeding that of their biological counterparts.  This makes hardware based on these circuits very good for running with many different parameter values and for very long biologically-equivalent durations.  However, they are also much more likely to show random behavioural differences and produce different results depending on the specific hardware they are run on.  This makes it important to consider how a network might account for these differences and adapt to them.  After all, biological neurons are unlikely to be homogeneous and so such adaptation is likely to happen more in practice.  The speed at which they operate also makes it harder to use in closed-loop systems, where some output is used for control and where the change of output then affects the input, resulting in further changes to output and so on.  This is because the network activity will evolve more quickly than the environment in which it is operating.

By comparison, systems based on digital simulation are much better suited to closed-loop interaction, as, even if they can run faster than real-time, they are often amenable to being paused while the environment can catch-up.  The activity of digital hardware is normally also somewhat more repeatable, though there are places where this might not be the case due to, for example, asynchronous execution which is often more random in nature, being subject to race-conditions that might go different ways in different simulations.  These properties generally make them more suited to deploying networks where the specific parameters are being tested for, and networks that are less adaptable to differences in behaviour of the neurons and synapses themselves.

Both of these systems will often come with further limitations.  For example, it is common that there might be a limit in the number of neurons and/or synapses that can be simulated within a network, as well as the level of activity that can be supported whilst maintaining other constraints.  There may also be limits in the neural and/or synaptic models implemented in the hardware, as well as what synaptic plasticity rules are available.  The hardware in question may use a specific language to describe networks that is different from that used by other hardware or indeed software simulation or emulation systems.

In some cases the hardware will allow you to write additional custom extensions that modify the behaviour in some way.  This might include adding your own models of neurons activity (more common in digital hardware), or possibly new model synaptic plasticity algorithms; on analogue hardware this might then be run in digital hardware that can modify the weights or other properties of the network but which still otherwise uses analogue hardware for the rest of the emulation.  Some hardware could also use more exotic components such as memristors, which might then enable learning to happen within the circuits themselves.

Let's have a look at some of the Neuromorphic hardware systems available and explore their properties. We will not discuss the low-level details of these systems, only concentrating on the details that will matter when running your SNNs.

### SpiNNaker (University of Manchester)
The SpiNNaker system is a digital Neuromorphic system which is designed to run SNNs with biological properties in real-time, using standard computer cores that can be programmed using C with a GCC compiler.  The real-time execution of an SNN can only be achieved if the networks do not generate too many spikes per second, since every spike needs to use some of the time available for processing in each time-step of the simulation.  Simulations can be slowed down to allow more time for spike processing if needs be, and simulations can also be paused or run in multiple short segments, allowing closed loop interaction with other external simulators that don't run in real-time.  The platform provides several ways to connect real external physical devices to allow live interactions with, for example, robotic devices.

SpiNNaker software currently allows SNNs to be described using the PyNN library for Python.  These descriptions are then processed into a list of pre-compiled executables that are to be run on chosen cores of the hardware, the parameters to be given to the executables, and the routing tables to use for directing spikes around the machine.  Neurons state variables and spikes can be recorded, though if there is not enough space on the machine to record the whole simulation duration, the simulation will be paused, the data extracted, the space cleared and the simulation resumed at various points during the execution.  The software supports extension of the models available by writing new executable code.  Extensions for PyNN allow the additional description of how external devices are connected to the machine, and any commands to be sent to the devices before and after simulation.

A second generation SpiNNaker chip, SpiNNaker 2, has also been produced. This increases the number of neurons that can be simulated on each chip, and also attempts to address some of the problems encountered when using the original hardware.  In particular, processing time is not used to receive spikes, reducing the chance of overloading the hardware.  That said, each spike still has to be processed, so arbitrarily spiking networks will still not necessarily be simulated accurately, since some spikes will have to be thrown away to make the simulation possible.  Additional hardware is also included for performing other neural network tasks, such as random number generation and exponential calculations, potentially improving what can be simulated overall.

### BrainScaleS (University of Heidelberg)
The BrainScaleS system is an analogue neural emulator i.e. the neurons are physical electronic circuits that emulate a neural model in terms of how the voltage changes with time, and how they react when spikes are applied. The main difference from biological neurons is that the voltage changes much more quickly.  This has the advantage that emulated networks can be run much more quickly than real-time, allowing several hours or days worth of execution to be experienced in just a few minutes.  This makes the system ideally suited to experimenting with the parameters of the network, since long term results can be quickly obtained and compared over many parameter changes.

The potential negative sides of such emulation are that each circuit is slightly different due to how they are manufactured, and also the behaviour can change with temperature fluctuations.  This means that some calibration is necessary to map the chosen parameters onto the available neurons, and the results may not be perfect or fully repeatable over multiple runs.  That said, these are also likely the properties of biological neurons; it is unlikely that these are all identical even if they have similar properties.  This property can then be used to ensure that any networks created are stable over variations of the hardware.

BrainScaleS uses digital interconnections between the neurons, to allow the selection of which neurons receive spikes from which source neurons.  BrainScaleS also has the capability to perform weight changes during emulation using a programmable digital plasticity processing unit.  The rules can examine the prior spikes and use this to compute changes of weights, though the speed of this processing is far slower than the network operates, meaning changes are not instantaneously applied, but rather applied at fixed time-points throughout the emulation, each several timesteps apart.

In the first generation of the technology, BrainScaleS was produced at wafer-scale, meaning that several thousands of neurons were available to be connected together.  The second generation uses a smaller technology, and so to reduce costs, is made into smaller chips, each with a few thousand neurons and its own plasticity processor.  These can then be further networked together using high speed digital interconnects.

### Loihi (Intel)

(deployment)=
# Deploying SNNs

```{draft}
```

```{note} Topic headline
**Deploying SNNs** covers neuromorphic hardware constraints and lets you
accelerate spiking networks on various systems.
```

This topic covers
(1) the various neuromorphic hardware types and the platforms available today,
(2) the SNN deployment frameworks for each described hardware platform, and (3)
the quantization methods that lets you squeeze your model onto the neuromorphic
hardware. It begins with the motivating principles and the core hardware-design
trade-offs, followed by the practical compilation toolchain and the examples of
platform-specific SNN implementations; all covered in the chapters as follows:

```{raw} latex
% This overview heading is a plain subheading of the topic, not a numbered
% "Chapter". secnumdepth 0 keeps the topic (chapter) numbered but drops the
% section number/label here; restored at the end of the page.
\setcounter{secnumdepth}{0}
```

```{rubric} What You'll Learn?
```

1. **Motivation and Performance Metrics**: Why should you start with considering
the hardware, on which your solution would run, before writing a single line of
code? This chapter will help you develop an intuition for why and how to relate
expected key performance indicators of your application with ideal hardware
platforms.

2. **Hardware Design Principles and Deployment Consequences**: Different design
decisions lead to different performance and ability. This chapter will reveal
the breadth of widely employed implementation possibilities, and their
consequences.

3. **The Neuromorphic Compilation Toolchain**: What are the general
transformations that may have to be performed in order to deploy an SNN onto the
physical neuromorphic devices? This chapter will introduce the popular
compilation practices.

4. **Platform-Specific Deployment Examples**: How do different platforms tackle
the tasks of representing, training, and deploying SNN onto neuromorphic
hardware? This chapter will cover Large-Scale Asynchronous Systems (e.g.,
SpiNNaker/Loihi) and Microcontroller-based or Edge-Focused Systems (e.g.
Synsense/Innatera).

5. **Platform interoperability**: How could a neuromorphic algorithm be run on
different hardware platforms? This chapter would cover how networks should be
described and transformed to run on different systems with minimal loss in
accuracy.

6. **Event-based sensors**: SNNs are natively compatible with event-based data;
this chapter will explore various event-based sensors that generate event data,
and how those sensors interface with neuromorphic hardware.

```{raw} latex
% Restore section numbering for the chapters that follow. (The unnumbered
% heading above does not advance the section counter, so the first real chapter
% under this topic still numbers as x.1.)
\setcounter{secnumdepth}{2}
```
