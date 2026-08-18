(foundations)=
# Foundations of SNNs

```{note} Topic headline
**Foundations of SNNs** introduces you to the concepts
of neuromorphic computing.
```

Have you wondered how the brain works as a *computer*? And what it "practically"
means... that the brain consists of **neurons**? What those biological neurons
are, and what they *do*? How can we *simulate* biological neurons and build
neural networks &mdash; called **Spiking Neural Networks** (SNNs) out of them?
How *learning* happens in the brain, and how can we implement it? This topic
covers the Computational Neuroscience basics - _relevant_ to the SNNs, and
answers all these questions in the following chapters:

```{raw} latex
% This overview heading is a plain subheading of the topic, not a numbered
% "Chapter". secnumdepth 0 keeps the topic (chapter) numbered but drops the
% section number/label here; restored at the end of the page.
\setcounter{secnumdepth}{0}
```

```{rubric} What You'll Learn?
```

1. **What is a Neuron?**: What are biological neurons and how do they function?
What role do the glial cells play? What biological characteristics of these
neurons and cells should we simulate to build an SNN? This chapter follows
through all these fundamental questions.

2. **What is a Spiking Neuron?**: Once you have learned about the biological
neurons, the next step is to learn how to mathematically / programmatically
simulate them and build Spiking Neuron models. This chapter covers spatial neuron
models, point neuron models, and the relation of point neurons with conventional
artificial neurons.

3. **What is Encoding & Decoding?**: Real-world data is almost always
continuous-valued, and to work with SNNs, we need to represent / convert them
to discrete integers. This chapter introduces the concept of Encoding, i.e.,
learn how to encode continuous values to spikes; and the concept of Decoding,
i.e., learn how to decode meaningful information back from discrete spikes.

4. **What is an SNN?**: This chapter covers the foundations to build Fully
Connected SNN and Convolutional SNN architectures from scratch - using Spiking
Neurons and Deep Learning concepts. This chapter demonstrates only the forward
pass; the backward pass / training is covered in the next topic "[Training SNNs](#training)".

5. **What is plasticity?**: Our brain is plastic, but what are the underlying
neuroscience principles that facilitate learning in brain? This chapter covers
the foundational concepts of neuroplasticity, e.g., Long-Term Potentiation (LTP)
and Long-Term Depression (LTD) based on precise spike timings.

```{raw} latex
% Restore section numbering for the chapters that follow. (The unnumbered
% heading above does not advance the section counter, so the first real chapter
% under this topic still numbers as x.1.)
\setcounter{secnumdepth}{2}
```
