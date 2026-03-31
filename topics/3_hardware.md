(deployment)=
# Deploying SNNs

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

## What You'll Learn?

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
