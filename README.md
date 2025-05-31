---
numbering: false
---
# Practical spiking neural networks

This book is a hands-on introduction to biologically-inspired neural networks *in practice*.
Reading this book will give you means to **design**, **build**, and **execute** Spiking Neural Networks (SNNs) - both **in simulation** and **on hardware**.

## What is this about?

Artificial Neural Networks (ANNs) can solve tremendously complicated problems. 
But we know that biology is *much* more **expressive** and can solve *much* tougher tasks. 
They do this by being **both digital and analog** [@Neumann_2012], that is, use neurons that do some internal integration of signals but send digital, discrete spikes. 
To model that, *spiking* neurons (in SNNs) are used instead of *artificial* neurons (in ANNs). 
SNNs have richer dynamics than ANNs, and are hard to understand and train. 
But they are powerful, fast, and energy-efficient when deployed on specialized *neuromorphic* hardware. 
This book explains what SNNs are and shows you how to build, train, and execute SNNs.

## How to read the book

The book exists in both a static PDF version and a live website.
We strongly recommend that you take time to exploit the interactive examples on the website to understand the *semantics* of the code examples and equations, rather than just jumping straight to the solution or conclusion.
The goal is to give you a strong intuition.
You can always solve practical coding problems by asking your favorite LLM (it probably already indexed this book anyway).

The book is structured in three sections:
1. An intuitive and accessible **theoretical introduction** to the world of SNNs
2. A practical guide to **implementing and working with SNNs using deep learning frameworks**
3. A practical guide to **running SNNs on neuromorphic hardware**

Each section can be read independently and features self-contained *interactive* examples that builds strong intuition.
The book is accessible to anyone with basic knowledge of calculus and linear algebra.
We recommend getting a strong grasp on the fundamentals before skipping to the later chapters, but the book *can* be used as a reference for solutions when you are in a time crunch.

If you have never heard the terms "spiking neuron", "neuromorphic computing", or "computational neuroscience", we recommend starting from the beginning.

## Contributing to the book

The book is open source, under [CC BY SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.en).
You're more than welcome to help us out by pointing out, suggesting improvements, and we warmly welcome pull requests to improve the book https://github.com/open-neuromorphic/snn-book.
In you have made significant peer-reviewed contributions to a chapter, then following the approval of the existing authors of that chapter, your name will be included in the author list in subsequent versions of the book.

## Citing the book/chapters

We have enabled citing the individual chapters, as well as the book as a whole.
We recommend citing the chapters as that would give due credit to the contributors of those chapters that helped you in your research.  

## Acknowledgements (in alphabetic order)

* Petrut Bogdan
* Ramashish Gaurav
* Jens Egholm Pedersen
