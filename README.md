---
numbering: false
---
# Practical Spiking Neural Networks

This book is a hands-on introduction to biologically-inspired neural networks *in practice*.
Reading this book will give you means to **design**, **build**, **train**, and **execute** Spiking Neural Networks (SNNs) - both **in simulation** and **on hardware**.

## What is this about?

Artificial Neural Networks (ANNs) can solve tremendously complicated problems.
But we know that biological brains are *much* more **expressive** and can solve *much* tougher tasks.
In brains, the computational power comes from **biological neurons** that are
**both digital and analog** [@Neumann2012], that is, biological cells that gather
analog information internally, but emit signals digitally via discrete electrical
pulses (which we informally call _spikes_). **Spiking** neurons are either digital
or analog (or hybrid) implementations of the biological neurons, which integrate
incoming information and generate discrete spikes upon meeting certain conditions.

In SNNs, **spiking** neurons are used instead of the conventional **artificial**
neurons (e.g., $\texttt{sigmoid}$, $\texttt{ReLU}$, etc.) that we see in the ANNs.
SNNs are more computationally expressive and more energy-efficient and faster than
ANNs when deployed on specialized **neuromorphic hardware**. But, they are hard
to understand and difficult to train. This book is meant to help: we will give
you a thorough intuitive understanding of SNNs and show you how to design, build,
train, and execute them.

## How to read the book

The book exists in both a static PDF version and a live website.
We strongly recommend that you take time to exploit the interactive examples on the website to understand the *semantics* of the code examples and equations, rather than just jumping straight to the solution or conclusion.
The goal is to give you a strong intuition.
You can always solve practical coding problems by asking your favorite LLM (it probably already indexed this book anyway).

The book is structured in three Sections:
1. An intuitive and accessible **theoretical introduction** to the world of SNNs
2. A practical guide to **implementing and working with SNNs in Python**
3. A practical guide to **running SNNs on neuromorphic hardware**

Each section can be read independently and features self-contained *interactive* examples that build strong intuition.
The book is accessible to anyone with basic knowledge of **calculus** and **linear algebra**.
We recommend getting a strong grasp on the **fundamentals** (Section 1) before skipping to the later chapters, but the book *can* be used as a reference for solutions when you are in a time crunch.

If you have never heard the terms "spiking neuron", "neuromorphic computing", or "computational neuroscience", we recommend starting from the first chapter in Section 1.

## Contributing to the book

<<<<<<< HEAD
The book is open source, under [CC BY SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.en).
You're more than welcome to help us out by pointing out and suggesting improvements;
and we warmly welcome pull requests to improve the book https://github.com/open-neuromorphic/snn-book.
If you have made significant peer-reviewed contributions to a chapter, then following
the approval of the existing authors of that chapter, your name will be included
in the author list in subsequent versions of the book.
=======
The book is open source, under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.en).
You're more than welcome to help us out by pointing out, suggesting improvements, and we warmly welcome pull requests to improve the book https://github.com/open-neuromorphic/snn-book.
>>>>>>> 3ca23d5 (Restructured and added appendix on dynamics)

## Citing the book/chapters

We have enabled citing the individual chapters, as well as the book as a whole.
We recommend citing the chapters as that would give due credit to the contributors of those chapters that helped you in your research.

## Acknowledgements (in alphabetic order)

* Petrut Bogdan
* Ramashish Gaurav
* Jens Egholm Pedersen
