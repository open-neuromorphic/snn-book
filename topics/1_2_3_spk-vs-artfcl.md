(chapter:spk-vs-artfcl)=
# Spiking vs Artificial Neurons

It is but obvious to compare spiking neurons with artificial neurons because of
their foundational role in building neural networks; note that SNNs and ANNs are
mostly isomorphic in architecture, as well as, the SNNs' training and inference
methodologies are heavily inspired from deep learning literature.

As mentioned earlier, spiking neurons are stateful models, whereas artificial
neurons are stateless; this statefulness of spiking neurons is what makes the
SNNs inherently temporal. Note that there exists a very important relation
between spiking and artificial neurons based on rate-coding theory:

```{important}
An artificial neuron is essentially a steady-state, time-averaged mathematical
abstraction of a spiking neuron; i.e., the continuous numerical output of an
artificial neuron represents the instantaneous firing rate of a spiking neuron.
```

This factual observation enables us to build rate-coding based SNNs and train
them using deep learning based methods. In fact, one of the earliest and most
effective methods to build SNNs: **ANN-to-SNN** conversion (as we will see in
later chapters) is foudationally based on artificial neurons being the rate
approximation of spiking neurons. We next demonstrate this _rate approximation_
of an artificial neuron with a LIF neuron.

### Computing the firing rates
Let us consider a LIF neuron described by the Eqs.
{eq}`eq:discrete-lif`$\textsf{a}$, $\textsf{b}$, $\textsf{c}$, and $\textsf{d}$,
mentioned below for reference:

and stimulate it with a _static_ input $J[t]$ for a period of $1$s. Note that we
employ a static instead of time-varying input for straightforward analysis; and
the analysis will remain unchanged for any time-varying input. Upon stimulation,
the LIF neuron produces binary spikes; we can then compute its firing rate by
dividing the total number of spikes produced with $1$s.

Consider $J[t]=1$, the firing rate of our LIF neuron for $v_\text{dcy}=0.1$ is
$X1$Hz, similarly, for $J[t]\in \{1.1, 1.2, 1.3, \cdots, 2.0\}$ we obtain the
corresponding firing rates: $X2$, $X3$, $X4$
