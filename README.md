---
numbering: false
---
# Practical Spiking Neural Networks

[![Download the PDF](https://img.shields.io/badge/Download-PDF-b31b1b)](https://github.com/open-neuromorphic/snn-book/releases/latest)
[![Discord](https://img.shields.io/discord/1044548629622439977)](https://discord.gg/aPFsSRA7Nf)
[![Neuromorphic Computing](https://img.shields.io/badge/Collaboration_Network-Open_Neuromorphic-blue)](https://open-neuromorphic.org/neuromorphic-computing/)
[![GitHub Repo stars](https://img.shields.io/github/stars/open-neuromorphic/snn-book)](https://github.com/open-neuromorphic/snn-book)


A hands-on introduction to Spiking Neural Networks (SNNs) that teaches you to **design**, **build**, **train**, and **deploy** neuromorphic systems - both in simulation and on hardware.

:::{warning icon=false} ✍️ Version 0.8 - Work In Progress, More Chapters Releasing Soon!
The first chapters are out! 🚀
Some pieces are still missing -- more content will release as soon as it's ready.

Star us [on GitHub](https://github.com/open-neuromorphic/snn-book/), give us a shout on social media, and [join us on Discord](https://discord.gg/wAKVddWE6p) 👋.
:::

## What is this book about?

::::{aside}
:::{seealso} Curious about the book?
Read more about [the motivation to write this book](/topics/intro)
and [why spiking neurons are cool](/topics/why-snns).
:::
::::


SNNs are biologically inspired neural networks that use discrete spikes for
computation, making them inherently _sparser_ and more _energy-efficient_ than
conventional ANNs when deployed on neuromorphic hardware. Computationally, SNNs
are also more _expressive_ because they combine numerical calculus (in the
continuous domain $\mathbb{R}$) with discrete logic (in the discrete domain
$\mathbb{N}$) [@Neumann2012].

This _first-of-its-kind_, **community-driven** and **open-source** book on SNNs
bridges _theory_ and _practice_ with _interactive_ examples, guiding you **from
SNN fundamentals through training and optimization methods to neuromorphic
hardware deployments**. We cover three topics:

1. **Fundamentals**: Covered in Topic 1: **Foundations of SNNs**
2. **Training and Optimization**: Covered in Topic 2: **Training SNNs**
3. **Neuromorphic Hardware**: Covered in Topic 3: **Deploying SNNs**

## How do I get the book?

The book comes in two formats and both are free:

* **Online at [snnbook.net](https://snnbook.net)**: the recommended way to
  read it. Only the website has the interactive code examples and
  visualizations, and it always shows the latest content.
* **As a PDF**: every release ships a `snnbook.pdf` on the
  [releases page](https://github.com/open-neuromorphic/snn-book/releases). The
  [latest PDF](https://github.com/open-neuromorphic/snn-book/releases/latest/download/snnbook.pdf)
  is a static snapshot, so the interactive parts are rendered as still images.

## What is in version 0.8?

All three topics have opened, each with a first set of draft chapters:

* **Topic 1 - Foundations of SNNs**: what a spiking neuron is (point neuron
  models, spiking vs. artificial neurons), encoding and decoding (rate
  encoding, temporal encoding, decoding), synaptic plasticity, and how
  to build networks out of spiking neurons.
* **Topic 2 - Training SNNs**: the importance of training, how to assignment
  credit in SNNs, and surrogate gradient training.
* **Topic 3 - Deploying SNNs**: why the hardware target matters, and hardware
  design principles.
* **Appendix**: discretization of point neuron models.

Chapters on exact gradients, meta learning, biologically inspired and
evolutionary training, ANN-to-SNN conversion, training optimization, the
neuromorphic compilation toolchain, interoperability, and performance modelling
are in preparation and will appear in later releases.

## Who is writing this?

The book is actively written by a group of more than 10 researchers who
range from late-stage PhD candidates to scientists with decades of neuromorphic
experience. The authors provide this as an open-source resource whose contents
are reviewable by all, and thus vetted by the wider neuromorphic community for
correctness.

The book is edited by:

* [Ramashish Gaurav](https://r-gaurav.github.io/)
* [Jens Egholm Pedersen](https://jepedersen.dk/)
* [Petrut A. Bogdan](https://pabogdan.github.io/)

## Contributing
::::{aside}
:::{seealso} Want to get involved?
We would love to have you on board!
Read more about [how you can contribute](/contributors).
:::
::::

We welcome improvements and pull requests.
If you are interested to contribute by _writing_
or _reviewing_, read more in the [contribution guidelines](/contributors) and
reach out to us on the [Open Neuromorphic Discord server](https://discord.gg/aPFsSRA7Nf).

## Citing

This book can be cited either as a whole or as individual chapters.
We very much encourage citing specific chapters to credit the contributors who helped your research.
The chapter-wise citations can be found in the web version.

```bibtex
@book{snnbook2026,
  editor    = {Gaurav, Ramashish and Pedersen, Jens Egholm and Bogdan, Petrut},
  title     = {{Practical Spiking Neural Networks}},
  publisher = {Open Neuromorphic},
  year      = {2026},
  edition   = {Version 0.8},
  url       = {https://snnbook.net},
}
```

## License

The book is open source under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.en).
