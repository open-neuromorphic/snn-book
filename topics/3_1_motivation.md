---
authors:
  - name: Petrut Bogdan
    affiliation: Innatera
    email: petrut.bogdan@innatera.com
---
(chapter:motivation)=
# Why should I care about hardware?

(sec:motivation-deployment)=
## Deployment is not an afterthought

Traditional TinyML already teaches an important lesson: deployment is not an afterthought. As emphasized by the Machine Learning Systems book [@mlsysbook2026], practical machine learning systems are constrained by memory, latency, energy, numerical precision, and the available deployment stack. Neuromorphic systems inherit all of these constraints, but add several more. Neuron and synapse dynamics are often stateful and platform-specific, activations may be sparse events rather than dense tensors, quantization can be more aggressive, memory is often co-located with compute, and the tooling is less mature than the CPU, GPU, and microcontroller ecosystems.

(sec:motivation-hardware-target)=
## The hardware target shapes the model

Knowing the deployment hardware is therefore necessary to understand which **operators** are available. Unlike the standardized world of CPUs and GPUs, neuromorphic hardware is fragmented. Currently, there is no standardization between neuromorphic platforms; each supports a specific set of neuron models, synapse dynamics, routing mechanisms, memory layouts, and learning rules. Consequently, choosing a specific neuron model early in the design process might inadvertently lock you into a single hardware platform. Conversely, targeting a specific platform often constrains the modeling choices available to you. Understanding these constraints upfront is crucial for successful deployment. The design axes in {ref}`chapter:hw_design_principles` make these constraints concrete, while the deployment stack in {ref}`chapter:toolchain` explains how the software maps a model onto the machine.

(sec:motivation-sizing)=
## Right-sizing the application

Awareness of the target hardware also lets you **right-size** the application and neural network to the application requirements. By understanding the resource limits, be it neuron count, synaptic memory, connection density, routing bandwidth, or available generic compute, you can choose a model that meets the target accuracy, latency, energy, and memory budget without carrying unnecessary capacity. This process ensures that the deployed model is not just theoretically sound, but practically viable within the hardware's specific limitations.

Resource sizing has the additional benefit of showing how much "heavy lifting" the neural network is actually doing. Imagine you are creating a network to perform audio scene classification. In your algorithm design flow, you choose to use wavelet transforms as a preprocessing step for your audio before passing it to your neural network. You lock into this decision, and proceed to train and optimize the neural network for the classification task. You notice fantastic performance straight away with an arbitrary choice of 1000 neurons. If you then sweep the network size against the application requirements, you might notice that progressively halving the network gives little to no loss of performance until you reach 62 neurons. This may suggest that your preprocessing is projecting the data to a space where the classes are linearly separable -- the preprocessing is doing the "heavy lifting". You may want to consider whether that is appropriate for your application.

:::{note}
**Sizing Studies**
A sizing study varies the model and deployment resources while checking whether the application requirements are still met.

It is recommended to run a sizing study to figure out how difficult your problem actually is and whether you are using an appropriate number of resources. This is particularly important in power-constrained domains or where energy efficiency is a key performance indicator.
:::

One must carefully balance **SNN resources vs. generic compute**. In sensor-edge applications performing inference on continuous temporal sensor output, the "neuromorphic" part of the chip is often just one component. Understanding the hardware tells you what kind of preprocessing you can afford to do on the accompanying conventional CPU or DSP cores. If the preprocessing is too heavy for the low-power generic compute available, the efficiency of the SNN accelerator becomes moot.

(sec:motivation-hardware-tooling)=
## Hardware and tooling are coupled

Knowing the **substrate and implementation methodology** of the target allows you to verify whether your model is resilient to physical constraints like component mismatch. Analog or mixed-signal neuromorphic platforms often have device-to-device variations (mismatch) that exact digital simulations traditionally ignore. If you know your target uses such a substrate, you must train or validate your model to be robust against these hardware-specific noise sources. These substrate choices are treated in more detail in {ref}`chapter:hw_design_principles`.

Finally, understanding **implementation inefficiencies** allows you to reason more precisely about encoding choices. For example, while rate encoding is a mathematically simple concept, on certain hardware architectures it can be disastrously inefficient in terms of power and bandwidth. Understanding how the hardware handles spike traffic allows you to concretely visualize why sparse temporal codes might be superior, moving beyond abstract theory to practical engineering necessity. The trade-offs between event traffic, spike representation, and memory movement are treated in {ref}`chapter:hw_design_principles` and {ref}`chapter:toolchain`.

Even a hardware-compatible model still has to pass through a toolchain. Partitioning, placement, routing, compilation, and machine control determine whether the model can actually be deployed efficiently, and sometimes whether it can be deployed at all. This is why the toolchain is not a post-processing detail; it is part of the design space, as discussed in {ref}`chapter:toolchain`.

As soon as interoperability is more completely supported, then it is likely that some of the above reasons become not so strictly important (see {ref}`chapter:interoperability`). Until that day comes, hardware constraints are part of the design conversation. A failed mapping, a routing bottleneck, a memory overflow, or an unexpectedly high energy trace is not only a deployment problem; it is feedback about the model, encoding, precision, preprocessing, and target platform. A practical deployment flow is therefore a hardware-software co-design loop: choose a model, map it, measure it, revise the model or the deployment assumptions, and repeat. To make that loop useful, we cannot rely on intuition alone; we need a concrete language to describe the cost of our design decisions. We need specific **performance metrics**.

(sec:motivation-performance-metrics)=
## Performance metrics 

Performance metrics should make the deployment contract explicit. NeuroBench is useful here because its systems track treats a benchmark result as a property of the deployed system, not only the trained network [@yik2025neurobench]. This matches the broader systems view used in traditional TinyML: accuracy is only meaningful when it is reported together with the memory, latency, energy, numerical precision, and tooling constraints that made the result possible [@mlsysbook2026]. It also means that the right metrics depend on the deployment mode. An edge device processing one sensor stream at a time should usually be judged by serial latency and energy per inference, while a server serving many users may care about throughput and latency under batching, because batching can amortize host, memory-transfer, and scheduling overheads.

For a neuromorphic deployment, the most useful first-pass metrics are:

:::{list-table} Deployment metrics worth reporting early
:label: tab:motivation-deployment-metrics
:header-rows: 1

* - Metric
  - Why it belongs in the design loop
* - Task quality
  - Accuracy, error, reward, or optimality gap defines whether the application requirement is met. NeuroBench makes this benchmark-specific: acoustic scene classification reports accuracy, while optimization benchmarks can report solution quality.
* - Execution time or latency
  - A model that is accurate too late is not deployable. Measure the mapped execution window on the target system, not only simulator steps or nominal operation counts.
* - Energy per sample or inference
  - Edge deployments often fail on battery life before they fail on peak compute. Energy should include the active compute domains used by the workload, including preprocessing when preprocessing is part of the deployed pipeline.
* - Idle, active, and dynamic power
  - Always-on systems spend much of their life waiting. Reporting idle and active power separately prevents a low-energy result from hiding leakage or wake-up costs, while dynamic power shows what changes with activity.
* - Memory and state footprint
  - Neuromorphic models carry weights, neuron state, routing state, and toolchain-specific buffers. This decides whether the mapped network fits and how much data movement the design will induce.
* - Serial latency, throughput, and workload size
  - For edge devices, inferences are often serial, so latency and energy per inference should be reported in that regime, as in TinyML benchmarks such as MLPerf Tiny [@banbury2021mlperftiny]. For server deployments, a single latency number is incomplete: report how throughput and tail latency change with batch size, input rate, sequence length, network size, or quality target.
:::

The important rule is to define the measurement boundary before comparing systems. If wavelet preprocessing, sensor formatting, host-side scheduling, or data movement is required for the deployed product, it belongs in the performance budget. NeuroBench makes this discipline explicit by defining system metrics per benchmark and by separating idle, active, and dynamic power [@yik2025neurobench]. The practical takeaway for this chapter is simple: do not choose a network because it is accurate in isolation. Choose the smallest mapped system that satisfies the application's quality, latency, energy, memory, and tooling constraints.
