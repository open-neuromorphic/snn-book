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

One chapter was released for v0.8:

1. **Motivation and Performance Metrics**: Why should you start with considering
the hardware, on which your solution would run, before writing a single line of
code? This chapter will help you develop an intuition for why and how to relate
expected key performance indicators of your application with ideal hardware
platforms.

```{rubric} Planned for later releases
```

Further chapters are in preparation and will appear in later releases:

* **Hardware Design Principles and Deployment Consequences**: Different design
decisions lead to different performance and ability. This chapter will reveal
the breadth of widely employed implementation possibilities, and their
consequences.

* **The Neuromorphic Compilation Toolchain**: What are the general
transformations that may have to be performed in order to deploy an SNN onto the
physical neuromorphic devices? This chapter will introduce the popular
compilation practices.

* **Platform-Specific Deployment Examples**: How do different platforms tackle
the tasks of representing, training, and deploying SNN onto neuromorphic
hardware? This chapter will cover Large-Scale Asynchronous Systems (e.g.,
SpiNNaker/Loihi) and Microcontroller-based or Edge-Focused Systems (e.g.
Synsense/Innatera).

* **Platform interoperability**: How could a neuromorphic algorithm be run on
different hardware platforms? This chapter would cover how networks should be
described and transformed to run on different systems with minimal loss in
accuracy.

```{raw} latex
% Restore section numbering for the chapters that follow. (The unnumbered
% heading above does not advance the section counter, so the first real chapter
% under this topic still numbers as x.1.)
\setcounter{secnumdepth}{2}
```
