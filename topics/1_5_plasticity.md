(chapter:plasticity)=
# What is Synaptic Plasticity?

---

In previous chapters, we saw how spikes travel across synapses and how synaptic weights control the flow of information in SNNs.  
Up to now, those weights were *static*: set once, used forever.  
But in neural systems, and often in SNN models, weights can evolve over time.  
This ability to change is called *synaptic plasticity*.

---

## Why Plasticity Matters

### What does plasticity mean?

In biology, *plastic* means malleable, i.e., capable of being reshaped.  
A synapse is said to be plastic when its strength changes based on neural activity.

In SNNs, this can mean:
- Increasing a weight if pre- and postsynaptic spikes happen close together.  
- Decreasing it if activity becomes uncorrelated or too frequent.

### Practical relevance

Plasticity mechanisms give SNNs practical benefits:
- **Adaptation:** allows neurons to adjust to new stimuli or noise conditions.
- **Memory:** encodes temporal relationships directly in the network dynamics.
- **Learning:** fundamental building block of rules like STDP (TO LINK) used for training. 

---

Different types of plasticity.
Short term
Long term


## Long-Term Potentiation

Long-term potentiation (LTP)

Link to biology


\glsdef{stdp}~\cite{caporaleSpikeTimingDependent2008}, derived from Hebbian learning, is the primary unsupervised learning rule used in \glspl{snn}.
During training, input samples are presented as spike trains, and weight updates are triggered asynchronously: each neuron updates its weights when it fires.
The weight change is determined by the relative timing of the input and output spikes.
Specifically, a weight is increased if an input spike comes within a time window preceding an output spike, an effect known as \gls{ltp}.
Alternatively, if the input spike occurs within a time window following the output spike, the weight is decreased, an effect known as \gls{ltd}.
These two mechanisms are illustrated in Figure~\ref{chap:related:fig:stdp-update}.
\gls{stdp} captures both causal (input before output) and non-causal (output before input) spike relationships.
This allows the network to reinforce synapses that contributed to the output spike, thereby capturing relevant input patterns, while weakening those that were inactive and unrelated to the representation.
By relying solely on local information, \gls{stdp} is suitable for on-chip training on neuromorphic hardware~\cite{khacefSpikeBasedLocalSynaptic2023}.
In particular, it is inherently implemented in memristor circuits~\cite{querliozSimulationMemristorBasedSpiking2011}, which makes it attractive for memristive-based hardware~\cite{saighiPlasticityMemristiveDevices2015,khacefSpikeBasedLocalSynaptic2023}.



**LTP** strengthens synaptic connections.  
When a presynaptic neuron repeatedly fires *just before* the postsynaptic neuron, the system interprets it as a cause–effect relationship:  
> “Neuron A helped neuron B fire — let’s make that connection stronger.”

Over time, the weight \( w \) increases slightly each time this pattern happens.

**Key idea:**  
```text
pre → post  ⇒  Δw > 0
```

In practice, if you plot weight change as a function of the timing difference
Δt = t_post − t_pre, LTP is positive for small positive Δt.

*Plot placeholder:*  
`![LTP: Δw vs Δt (positive lobe for Δt>0)](./_static/plots/ltp.png)`

---

## Long-term depression (LTD)

**LTD** = weakening of a synapse when postsynaptic spikes tend to precede presynaptic spikes.

Key intuition:




On a timing plot, LTD appears as a negative lobe for small negative Δt (t_pre after t_post). LTD prevents runaway excitation and helps the network forget irrelevant correlations.

*Plot placeholder:*  
`![LTD: Δw vs Δt (negative lobe for Δt<0)](./_static/plots/ltd.png)`

---

## Trace-based plasticity

Real neurons don’t react to isolated spikes only — they integrate **traces** (decaying memories of recent activity).

Practical pattern:
- Maintain a **pre-trace** that increases on each presynaptic spike and decays exponentially.
- Maintain a **post-trace** that increases on each postsynaptic spike and decays exponentially.
- Update weights using these traces (smoother and more robust than single-pair timing).

This yields stable, differentiable-like updates that are easy to simulate on hardware or in code.

*Diagram placeholder:*  
`![Trace-based plasticity: pre/post traces with exponential decay](./_static/figs/trace-based.png)`

---

## Optional: dynamic thresholds

Neurons can adapt their **firing threshold** based on recent activity:
- After bursts, thresholds rise (reduced excitability).
- During quiet periods, thresholds fall (increased sensitivity).

This homeostatic mechanism improves stability and helps manage spiking sparsity/energy.

*Diagram placeholder:*  
`![Dynamic threshold adapting with recent firing rate](./_static/figs/dyn-threshold.png)`

---

## From plasticity to learning

Plasticity ≠ full training. Plasticity defines **what can change locally** and **how spikes affect synapses**.
Learning adds **objectives** and **rules** that leverage plasticity to achieve tasks.

- **What we covered here:** Potentiation, depression, traces, thresholds (mechanisms).
- **What comes next:** Spike-Timing-Dependent Plasticity (STDP) — a concrete rule that combines these ingredients to shape connectivity from data.

> Preview: STDP uses the same LTP/LTD ideas (often via traces) to organize synapses based on spike timing statistics. We’ll connect these dots in the next chapter.

---

## Quick recap
- Weights can be **fixed** (pure dynamics) or **dynamic** (plastic).
- Spikes affect not only membrane potentials but also **synapses**.
- Two core effects: **LTP** (strengthen) and **LTD** (weaken).
- **Trace-based** models and **dynamic thresholds** add realism and stability.
- These mechanisms are the **raw material** for later learning rules like **STDP**.

---

## TODO (for this chapter)
- Add LTP/LTD timing plots (`Δw` vs `Δt`) and link image paths.
- Add a tiny code cell that simulates exponential traces (optional).
- Add a simple schematic showing spikes → membrane potential and spikes → synaptic traces.
- Insert a `{ref}` link to the next chapter on STDP.