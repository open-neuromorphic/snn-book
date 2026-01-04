(deployment)=
# Deploying SNNs

This chapter covers
(1) the various neuromorphic hardware types and the platforms available today,
(2) the deployment frameworks for each hardware platform, and
(3) quantization methods that lets you squeeze your model onto hardware. -->

(deployment)=

# Deploying SNNs to Neuromorphic Hardware

This topic details the process of deploying Spiking Neural Networks onto specialized neuromorphic hardware. It moves from the motivating principles and core hardware design trade-offs to the practical compilation toolchain and platform-specific implementations.


## What You'll Learn?

1. **Motivation and Performance Metrics**: Why should you start considering the harwdware that your solution would run on before writing a single line of code? This chapter should help develop an intuition for why and how to relate expected key performance indicators of your application with ideal hardware platforms.
2. **Hardware Design Principles and Deployment Consequences**: Different design decisions lead to different performance and ability. This chapter should reveal the breath of widely employed implementation possibilities.   
3. **The Neuromorphic Compilation Toolchain**: What are the general transformations that may have to be performed in order to deploy a spiking neural network to physical devices?
4. **Platform-Specific Deployment Examples**: How do different platforms tackle the tasks of representing, training and deploying networks to hardware?
5. **Platform interoperability**: How could a neuromorphic algorithm be run on different hardware platforms? This chapter would cover how networks should be described and transformed to run on different systems with minimal loss in accuracy.
6. **Event-based sensors**: How could a neuromorphic algorithm be run on different hardware platforms? This chapter would cover how networks should be described and transformed to run on different systems with minimal loss in accuracy.
