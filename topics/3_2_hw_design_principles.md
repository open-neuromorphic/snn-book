---
authors:
  - name: Manolis Sifalakis
    affiliation: Innatera
    email: manolis.sifalakis@innatera.com
  - name: Amirreza Yousefzadeh
    affiliation: University of Twente
    email: a.yousefzadeh@utwente.nl
---
(chapter:hw_design_principles)=
# Hardware design principles

Choosing neuromorphic hardware is not a search for the fastest chip. It is a search for the set of design decisions that fits a particular application. The criteria that decide the fit are a small set of key performance indicators (KPIs): latency, energy per inference, area and cost, the maximum model size the hardware can hold, accuracy, and flexibility. These cannot be optimized independently, and improving one usually costs another. A larger on-chip memory raises the maximum model size but also the area and the energy per access; a more specialized datapath lowers energy on one kernel but reduces flexibility for the next algorithm.

Two claims recur throughout. First, every hardware design decision is a trade-off that only resolves once the workload is fixed; a choice that is right for a large brain-simulation machine can be wrong for a sensor that wakes a few times a second. Second, in a digital neuromorphic processor the energy budget is set by memory and communication, not by arithmetic. The memory section makes the second claim quantitative, and it is worth keeping in mind from the start: a useful rule of thumb is that reading an operand from on-chip memory costs about ten times the energy of the arithmetic performed on it [@tang2023open].

The chapter works through the design axes in order: the substrate, the array template, the scale regime, time-multiplexing, the event-driven datapath, spike representation, the network-on-chip, memory, hardware acceleration, and software and mapping. The aim is a working method: given a processor, identify the axes its designers chose and predict the consequences for a given application. Where the evidence is genuinely mixed, the competing positions are set out side by side rather than resolved, because the field has not resolved them either.

The discussion stays grounded in real processors throughout, and they are deliberately varied. Large digital arrays include TrueNorth, Loihi, SpiNNaker, and NorthPole [@merolla2014million; @davies2018loihi; @furber2014spinnaker; @modha2023northpole]; analog and mixed-signal systems include Neurogrid, DYNAP, and the accelerated BrainScaleS-2 [@benjamin2014neurogrid; @moradi2018dynaps; @pehle2022brainscales2]; compact edge processors include ODIN [@frenkel2019odin]; and a separate line of work computes inside memristor arrays [@yao2020fully]. Each chip made different choices on the axes below, and {numref}`tab:hw-architectures` collects them. The clearest example for each axis is drawn from whichever processor illustrates it best, rather than from a single design.

(sec:substrate)=
## The substrate decision: digital, analog, or mixed-signal

The substrate is the physical medium that implements neurons and synapses: analog, digital, or mixed-signal circuits. The choice fixes three things that are hard to change later: the numerical precision the hardware can hold, the effort needed to move the design to a newer process node, and the maturity of the programming tools.

Analog circuits store neuron and synapse variables as physical quantities, usually a voltage, charge, or current, and let device physics do the computation. Summing currents on a shared wire is, in effect, a free addition, which is why analog neurons can be very small and draw little power. Neurogrid takes this to its limit, running transistors in the subthreshold regime so that the device physics directly emulates the neural dynamics; sixteen of its chips model a million neurons in real time on about three watts [@benjamin2014neurogrid]. DYNAP builds mixed-signal cores of adaptive exponential integrate-and-fire neurons with asynchronous routing [@moradi2018dynaps], and BrainScaleS-2 instantiates each neuron as a physical analog circuit that is not throttled to biological time, so it runs roughly a thousand times faster than biology [@pehle2022brainscales2]. The cost shared by all of them is that the computation depends on the exact behavior of the transistors. Two devices drawn identically still differ after fabrication, an effect called mismatch, and this variation, together with thermal and shot noise, enters the result directly. Porting a design to a smaller technology node is not a recompilation; it is usually a redesign of the analog blocks, because the device behavior changes with the process.

Digital circuits store the same variables as binary numbers and compute with logic gates. They spend more area and energy per neuron, but the result is exact and repeatable, the design can be synthesized from a hardware description language, reconfigured, and reused as an intellectual-property (IP) block, and it inherits the density and speed gains of each new process node with little extra work. This is why most processors that have actually been deployed are digital, from the million-neuron TrueNorth [@merolla2014million] and the learning-capable Loihi [@davies2018loihi] to the general-purpose ARM cores of SpiNNaker [@furber2014spinnaker] and the sub-square-millimeter ODIN [@frenkel2019odin], and why the rest of this chapter concentrates on the digital case.

The substrate also sets how freely weight precision can be chosen, and precision is the quiet lever behind both model size and accuracy. A digital design can store weights at eight, four, or even two bits and trade accuracy for memory directly, because halving the bits per weight halves the largest of the on-chip stores; NorthPole is built around exactly this freedom, supporting eight-, four-, and two-bit operands [@modha2023northpole], and low-bit quantization is one of the main tools of {ref}`sec:software-mapping`. An analog array has no such dial, since its effective precision is fixed by the device physics and the noise floor at three to four digits, so a task that needs more precision must either be reshaped to tolerate the noise or moved to a digital substrate [@bocquet2020embracing].

Mixed-signal designs sit between the two. The common form today is in-memory computing on a resistive crossbar: synaptic weights are stored as the conductances of memory devices, and a single analog step, Ohm's law followed by Kirchhoff current summation along each column, performs a full multiply-accumulate inside the memory array. A fully hardware-implemented memristor CNN built this way reached more than ninety-six percent on MNIST with an energy efficiency more than two orders of magnitude better than a GPU, but only after a hybrid training procedure that adapted the network to the arrays' imperfections [@yao2020fully]. That caveat is general: although *neuromorphic* is often read as *analog*, the deployable processors today are digital or mostly digital, and digital logic is also the most convenient host for adding analog or in-memory blocks later.

Whether analog is the better long-term substrate is unsettled, and the disagreement is substantive rather than cosmetic. Advocates argue that fully parallel analog computation removes two costs that digital systems cannot escape: the clocking and synchronization overhead, and the energy of moving operands to and from memory. The standard objection is precision. Analog in-memory systems typically resolve only three to four decimal digits, drift over time, and vary from device to device, so they need calibration or a training procedure that keeps the physical chip in the loop [@bocquet2020embracing]. A third position treats this unreliability as a resource rather than a defect, and designs algorithms that tolerate or even exploit device noise [@bocquet2020embracing]. These camps disagree less about the measurements than about how much error is acceptable for a given task, which is why the question stays open.

(sec:array-template)=
## The dominant template: an array of tiny processors plus a network-on-chip

Almost every scalable digital neuromorphic processor uses the same construction: many small cores, each with its own local memory and compute, connected by a network-on-chip (NoC). The pattern recurs across chips that otherwise share little. TrueNorth tiles 4096 fixed-function cores on one die for a million neurons and 256 million synapses [@merolla2014million]; Loihi uses 128 programmable cores for about 130000 neurons with on-chip learning [@davies2018loihi]; SpiNNaker fills each chip with eighteen general-purpose ARM cores and scales to a million of them [@furber2014spinnaker]; and NorthPole distributes 224 MB of SRAM across 256 cores, keeping every weight on-chip [@modha2023northpole]. NeuronFlow, AKIDA, and SENeCA follow the same template [@moreira2020neuronflow; @tang2023seneca]. It mirrors the decentralized organization of cortical tissue, where computation and storage are not physically separated as they are in a von Neumann machine.

```{figure} /assets/images/hw_template.svg
:name: fig:hw-template
:width: 75%
:align: center

The template shared by most scalable digital neuromorphic processors: a tiled array of small cores, each holding its own compute and local memory, connected by a network-on-chip. The same pattern underlies TrueNorth, Loihi, SpiNNaker, NorthPole, NeuronFlow, and SENeCA.
```

The core is the neuron substrate and the NoC is the axon substrate ({numref}`fig:hw-template`). Keeping each core's memory next to its compute is the central efficiency argument against the von Neumann organization, in which operands travel back and forth to a separate, distant memory. Scalability then comes cheaply, because adding cores adds compute and memory together: a larger chip, or several chips tiled side by side, increases capacity, on-chip bandwidth, and parallelism at the same time. The difficulty does not disappear, though; it moves into mapping, the problem of placing neurons and layers onto cores, and into load balancing, the problem of keeping those cores evenly occupied. Mapping is therefore a hardware concern as much as a software one, and {ref}`sec:software-mapping` returns to it.

Two practical points follow from building real systems on this template. The first is that scaling beyond one chip reuses the same idea: inter-chip links carry packets between dies, so a board of chips behaves like a larger array, which is how SpiNNaker reaches a million cores and how multi-chip Loihi and Neurogrid systems reach their scale [@furber2014spinnaker; @benjamin2014neurogrid]. The second is that the parallelism is only as good as the mapping. If one core holds a busy layer while its neighbors sit idle, that core becomes the critical path and the rest of the array waits on it, so a balanced placement matters as much as raw core count.

The template is near-universal, but its justification is contested, and the sharpest counterexample is worth stating plainly. A highly connected cortical model can run faster and at lower energy on a single GPU than on SpiNNaker or a CPU cluster, with energy per synaptic event reported as up to fourteen times lower on the GPU [@knight2018gpus]. If a commodity dense accelerator can win on a workload that looks tailor-made for neuromorphic hardware, then the tiled array is a choice to be justified per application rather than an automatic default. What the tiled array trades on is sparsity and scale, examined in the next two sections; where those are absent, its overheads can lose to a GPU or a plain accelerator.

(sec:scale-regime)=
## Scaled-up systems versus the extreme edge

The array template was designed for scale, and its advantages do not transfer automatically to a tiny chip running a tiny network. This gap is the central practical tension of the chapter, so it is worth being explicit about the two regimes.

At large scale the template works well because memory and compute are distributed, so there is no shared bottleneck: each added core brings capacity, bandwidth, and parallelism at once. SpiNNaker was built to simulate about a billion neurons in real time across a million cores [@furber2014spinnaker], Neurogrid models a million neurons on roughly three watts [@benjamin2014neurogrid], and multi-chip Loihi systems spread large networks across many tiles [@davies2021advancing]. The extreme edge is a different regime: thousands of neurons rather than millions, power budgets of a milliwatt or less, silicon area set by unit cost, and often a single sensor as the only input. ODIN is representative, fitting 256 neurons and 64k synapses into 0.086 square millimeters and spending only 12.7 picojoules per synaptic operation [@frenkel2019odin], and commercial parts such as BrainChip's AKIDA target the same always-on, battery-powered niche.

The underlying exchange is that neuromorphic hardware spends silicon area to buy power efficiency. Per-neuron memory, parallel cores, routing tables, and the event-handling logic all occupy area, and at the extreme edge area is the dominant cost, because cost scales with die size. Parallelism also delivers high throughput, but an edge application rarely needs maximum throughput; it needs to meet the sensor rate and the deadline. A small clocked accelerator that finishes inside the frame budget and then sleeps can satisfy the same requirement at lower area and cost.

```{figure} /assets/images/hw_scale_regime.svg
:name: fig:hw-scale
:width: 65%
:align: center

A qualitative map of where each style of design tends to win, as a function of input activity sparsity and network size. Event-driven neuromorphic designs gain ground toward large, sparse workloads; a small clocked accelerator is often better for small or dense ones; a wide band between them is genuinely mixed.
```

:::{admonition} Why event-driven processing on a tiny chip?
:class: tip
The per-event control overhead that is negligible at scale becomes the dominant cost when each event touches only a handful of neurons. This is the small-workload trap, observed directly in the SENeCA project: the event-driven machinery has a fixed cost per event that a small network cannot amortize [@tang2023open]. The cases that still justify event-driven processing at the edge are specific: always-on workloads whose input is silent most of the time, such as keyword spotting and wake-up detection; latency-critical sparse sensors such as event cameras; and designs where the wake-up cost and sleep-state leakage of a clocked alternative would eat the savings it promises.
:::

The conclusion is that *neuromorphic is for the edge* is a slogan rather than an analysis. The defensible version is conditional, and {numref}`fig:hw-scale` sketches it: event-driven processing pays off at the edge when activity is genuinely rare and the network is large enough to amortize the event machinery. Outside that regime a conventional tiny accelerator can win on both cost and energy. Two results from outside the neuromorphic community sharpen the warning. Spiking models often need very high activity sparsity, around ninety-three percent or more, before they beat an equivalent artificial neural network, and once the energy per spike per synapse is counted, the advantage can disappear entirely [@yan2024reconsidering]. At the extreme edge, where networks are small and not always sparse, that threshold is easy to miss. Recent reviews reach a compatible and more measured position: neuromorphic hardware complements GPU-based deep learning on sparse, event-driven workloads and underperforms on dense ones, so the useful edge question is about a workload's sparsity and timing structure, not about a brand of hardware [@muir2025road].

(sec:time-multiplexing)=
## Time-multiplexing versus physical parallelism

A single physical core can stand in for many logical neurons by reusing its datapath over time. This is possible because silicon switches millions of times faster than a biological neuron fires, so one datapath can update many neurons in sequence within a single time step and still finish before the next time step is due. TrueNorth uses this directly, sharing each core's logic across its 256 neurons [@merolla2014million], and digital arrays such as Loihi and SENeCA do the same.

Designs fall on a spectrum from fully parallel, through partially parallel, to fully time-multiplexed, where one datapath updates one neuron per step ({numref}`fig:hw-mux`). The governing parameter is the multiplexing ratio $M$, the number of logical neurons served per physical datapath. For $N$ neurons, the number of physical datapaths and the per-step update latency scale in opposite directions:

```{math}
:label: eq:mux
P \;=\; \left\lceil \frac{N}{M} \right\rceil, \qquad A_\text{compute} \;\propto\; \frac{N}{M}, \qquad t_\text{update} \;\propto\; M .
```

A higher ratio improves area efficiency and lowers communication overhead, because fewer physical datapaths emit fewer simultaneous packets; a lower ratio improves throughput, latency, and energy efficiency, because more neurons update in parallel. The area saving grows when the neuron model is expensive, since one costly datapath is then amortized across more neurons.

A short calculation shows why high ratios are practical. A datapath clocked at one gigahertz completes a simple neuron update in a few nanoseconds, so within a one-millisecond time step it can update on the order of $10^5$ neurons in sequence before the step is due. A biological time step therefore leaves enormous headroom on silicon, which is the physical reason one datapath can stand in for thousands of neurons with no loss of real-time behavior. The binding limit is not time but the memory bandwidth needed to stream those neuron states past the datapath, which returns the discussion to memory.

```{figure} /assets/images/hw_multiplexing.svg
:name: fig:hw-mux
:width: 85%
:align: center

The two ends of the multiplexing spectrum. Fully parallel uses one datapath per neuron and updates in a single step; fully time-multiplexed reuses one datapath across all neurons over many steps. Compute area scales as $N/M$ and update latency as $M$.
```

By {eq}`eq:mux`, the multiplexing ratio sets both the largest network a core can hold and the latency it can reach, so it should be chosen per application. The opposite end of the spectrum is taken by analog systems that give each neuron its own physical circuit. Neurogrid and BrainScaleS-2 do not time-multiplex at all, and BrainScaleS-2 turns the resulting parallelism into raw speed, emulating its networks about a thousand times faster than biological time [@pehle2022brainscales2; @benjamin2014neurogrid]. From that vantage point time-multiplexing looks like a compromise, because reusing one datapath reintroduces the sequential, memory-fetch-bound behavior that neuromorphic computing set out to avoid. Time-multiplexing is the pragmatic digital answer, and its price is exactly the serialization the analog camp objects to.

(sec:event-driven)=
## The event-driven datapath and sparsity exploitation

An event-driven core does work only when an event arrives and idles otherwise, so that power tracks activity rather than wall-clock time. Loihi makes this explicit by running without a global clock, advancing only as spikes arrive [@davies2018loihi], and commercial event-based parts such as AKIDA are built on the same principle. In this event-proportional model the energy of one inference is a static term plus a sum over the events actually processed:

```{math}
:label: eq:event-energy
E_\text{inf} \;\approx\; \underbrace{P_\text{static}\,T}_{\text{idle}} \;+\; \sum_{\text{events}} \big( e_\text{syn} + e_\text{nrn} + e_\text{gen} \big),
```

where $T$ is the inference window and $e_\text{syn}, e_\text{nrn}, e_\text{gen}$ are the per-event energies of the three pipeline stages below. If $N_\text{ev}$ events are processed, the dynamic energy scales with $N_\text{ev}$, which is the formal statement of "power proportional to activity." The per-event energy is small but not free: ODIN, for instance, reports 12.7 picojoules per synaptic operation [@frenkel2019odin].

The datapath has three stages ({numref}`fig:hw-pipeline`) [@tang2023open]. In the **synaptic process** the core optionally applies a delay, reads the relevant weights, computes the addresses of the neurons the event affects (which is where convolutional connectivity is expanded), and, if on-device learning is enabled, updates weights. In the **neuron process** the core updates the affected neuron states; this is the step that decides efficiency, and it can be fully parallel, partially parallel, or fully time-multiplexed as in {numref}`fig:hw-mux`. In **event generation** the core forms address-event-representation (AER) packets from the addresses of the neurons that fired, reads the axon memory to find their targets, and optionally compresses the packets, feeds them back for recurrence and learning, applies delays for skip connections, and folds in pooling.

```{figure} /assets/images/hw_event_pipeline.svg
:name: fig:hw-pipeline
:width: 90%
:align: center

The three-stage event pipeline. Each stage touches a different memory: weights in the synaptic process, neuron states in the neuron process, and the axon memory in event generation. The memory traffic, not the arithmetic, dominates the energy of an event.
```

Two quantities decide the outcome. Activation sparsity, the fraction of neurons active at any moment, is the main lever; in cortex it sits around one to ten percent, and this low activity is exactly what the event-driven datapath exploits, since idle neurons cost nothing. Weight sparsity, the fraction of zero-valued weights, is a separate and harder problem, because exploiting it requires skipping scattered entries rather than skipping whole inactive neurons. Operation density, the number of arithmetic operations performed per delivered packet, decides whether data movement or computation dominates:

```{math}
:label: eq:op-density
D \;=\; \frac{\text{arithmetic operations performed}}{\text{packets delivered}} .
```

If each delivered packet carries a fixed handling overhead $e_\text{ovh}$ and triggers $D$ operations at $e_\text{op}$ each, the energy per useful operation is approximately $e_\text{ovh}/D + e_\text{op}$. When $D$ is large, as in a convolution where one event fans out to many synapses, the overhead is amortized and the core is efficient; when $D$ is small, as in a tiny network where an event touches a few neurons, the fixed overhead dominates and the event-driven style loses its advantage. This is the same small-workload trap met in {ref}`sec:scale-regime`, now stated quantitatively.

As a concrete contrast, a single event entering a convolutional layer with a $3 \times 3$ kernel and sixty-four output channels expands to about $3 \times 3 \times 64 \approx 576$ synaptic operations, a high operation density that easily amortizes the packet overhead. The same event entering a small fully connected layer with only a handful of targets carries an operation density of a few, so almost all of its energy goes to handling the packet rather than to useful work. High-fan-out structure, as in convolution, is what makes the event-driven style efficient; flat, low-fan-out structure is what defeats it.

The energy savings are therefore large on naturally sparse signals such as audio and event-based vision, but the per-event overhead is a floor. An interactive energy calculator, built on measured SENeCA per-instruction and per-component costs, lets a reader watch the sparsity-dependent synaptic term in {eq}`eq:event-energy` fall toward the sparsity-independent neuron-update floor [@tang2023open].

The clean theory of event-proportional power meets a messier measurement record, and the gap is now well documented. A recent reassessment shows that event handling, memory access, and instruction control are routinely left out of efficiency claims, so reported SNN advantages are often optimistic [@yan2024reconsidering]. The amount of usable sparsity is also disputed: the one-to-ten-percent figure from cortex is often quoted, but reaching high sparsity in a trained deep network usually requires explicit regularization during training, which can cost accuracy and move the energy break-even point.

(sec:spike-representation)=
## Spike representation: binary versus graded spikes

The amount of information a single spike carries is a design choice that affects both accuracy and bandwidth. A binary spike carries one bit: the synapse simply accumulates its weight, with no multiplication, which is the biologically faithful case and the cheapest per event. The first generation of large digital chips committed to it, including TrueNorth and the original Loihi [@merolla2014million; @davies2018loihi]. A graded, or valued, spike carries a number, which costs a multiplication and more bits per packet but can reach the same accuracy with far fewer spikes. The trade is therefore between the cost of each event and the number of events needed.

The industry has since moved toward graded spikes: the second-generation chips, including Loihi 2, NorthPole, and SpiNNaker 2, all carry numeric values rather than bare events [@davies2021advancing; @modha2023northpole]. NorthPole is the extreme of this trend, abandoning spikes altogether and computing on eight-, four-, and two-bit activations like a dense inference accelerator [@modha2023northpole]. The choice trades NoC bandwidth and multiplier cost against spike count and accuracy, and a flexible core can support either, which is one more argument for flexibility. It also feeds back into the edge question of {ref}`sec:scale-regime`: binary events are the cheapest per event, but if a small network needs many of them to stay accurate, the per-event saving is undone by the larger event count.

The bandwidth arithmetic makes the trade concrete. In a network of about a million neurons an AER packet needs roughly twenty bits just to name its source, so a binary spike is about twenty bits on the wire. A graded spike adds an eight- to sixteen-bit value, one and a half to two times the packet size; if carrying that value lets the network reach the same accuracy with a third as many spikes, the total bandwidth still falls. Whether it does is a property of the task, which is the practical case for a core that can switch representations.

Beneath the binary-versus-graded choice lies the older and unsettled debate between rate and temporal coding. Rate coding, which represents a value by a spike count over a window, is robust but needs many time steps and redundant spikes, raising both latency and energy. Temporal codes such as time-to-first-spike, which represent a value by *when* a neuron fires, claim much lower latency at similar or better accuracy. The dispute is live: some work reports ninety-three percent CIFAR-10 accuracy in a single time step [@chowdhury2021one], while common rate-coded pipelines still use one hundred to two hundred. Because the energy of {eq}`eq:event-energy` is paid once per time step, the number of time steps multiplies energy directly, so this coding choice can outweigh the binary-versus-graded one, which is why the two are best considered together.

(sec:noc)=
## The network-on-chip: communication and its real cost

Because cores share a limited set of physical wires, a spike cannot travel as a bare electrical pulse; it travels as a routed packet that carries the identity of its source. This is address-event representation (AER). Physical wires cannot be added after fabrication, so connectivity is virtualized: the shared links are time-multiplexed to emulate the dense, point-to-point connections of a biological network. Routing can be destination-based, where the packet carries its targets, as in TrueNorth, or source-based, where the packet carries only its origin and each router computes the targets, the style SpiNNaker chose and built a dedicated multicast router around [@merolla2014million; @furber2014spinnaker]; multicasting handles fan-out, where one source must reach many targets without sending a separate packet to each.

The reason routing tables grow is visible in a rough count. If each of $N$ neurons must name its targets explicitly, and each drives a fan-out of $F$ targets chosen from $N$ possibilities, a destination list costs about $F \log_2 N$ bits per neuron, so high fan-out and large $N$ together make destination-based tables expensive. Source-based routing avoids per-target lists by computing destinations from the source address and a compact rule, trading table memory for a lookup at each router, which pays off precisely when connectivity is structured, as in a convolution.

:::{admonition} The real cost of the NoC is memory, not bandwidth
:class: note
Across NeuronFlow, Loihi, SpiNNaker, Epiphany, and SENeCA, the NoC has not been the performance or energy bottleneck, because operation density is high enough that moving a packet is far cheaper than processing it. The cost that does bite is memory. Routing tables can be large: TrueNorth uses twenty-six bits per neuron to encode a single destination [@merolla2014million], and in NeuronFlow the routing table occupies about a quarter of on-chip memory [@moreira2020neuronflow]. Source-based routing shrinks these tables for structured networks and makes multicast cheap, at the cost of a lookup at each hop.
:::

The guideline is to keep the NoC itself simple but to budget deliberately for routing-table memory, which is an easily overlooked area and energy cost and which leads directly into the memory section. The claim that the NoC is never the bottleneck holds only for certain workloads, and the exception is instructive. In large-scale brain simulation, with very high fan-out and low operation density per packet, communication and its routing memory can dominate, which is part of why SpiNNaker invested so heavily in its routing fabric [@furber2014spinnaker]. The accurate statement is conditional: for inference workloads with high operation density the NoC is cheap, whereas at biological connectivity and scale communication has repeatedly been found to be a first-order cost.

(sec:memory)=
## Memory is the real challenge

In a distributed near-memory processor, on-chip memory dominates both area and energy, which makes memory organization the central design decision rather than an implementation detail. This section is the analytical core of the chapter, and most of the axes seen so far reappear here [@yousefzadeh2025memory].

The key point is that bringing compute next to memory does not remove the memory wall; it moves it. The tiled, near-memory template ends the von Neumann pattern of shuttling operands to and from a distant main memory, and at the system level it works. NorthPole takes the idea to its conclusion, eliminating off-chip memory entirely and distributing 224 MB of SRAM across its cores so that no weight ever leaves the chip [@modha2023northpole]. Inside a single core, though, the local memory becomes the limiting resource. SRAM today, and non-volatile alternatives such as STT-MRAM in the near future, dominate the per-inference area and energy. The wall has not disappeared; it now sits between the datapath and the on-chip memory a short distance away [@yousefzadeh2025memory]. A digital neuromorphic core spends its memory on five things: synaptic weights, neuron states, the routing tables that virtualize connectivity over the NoC, the instruction and control memory that drives the datapath, and the axon memory that lists each neuron's outgoing connections. Against these, the arithmetic is small, which is the concrete meaning of the ten-to-one rule from the introduction: a single inference spends far more energy reading and writing state than computing on it, as {numref}`fig:hw-energy` summarizes.

```{figure} /assets/images/hw_energy_breakdown.svg
:name: fig:hw-energy
:width: 80%
:align: center

Schematic split of the energy of one inference into compute, communication, and memory access. The proportions are illustrative, but the ordering is the robust result reported across digital neuromorphic measurements: memory access and data movement dominate, and a single memory access costs roughly ten times an arithmetic operation [@tang2023open; @yousefzadeh2025memory].
```

The clearest illustration is the neuron-state growth of convolutional networks. A neuromorphic core allocates state memory per neuron, so a convolutional layer behaves very differently than on a conventional DNN accelerator. In a convolution, one small filter is reused across a large feature map, so the parameter count is tiny while the neuron count is large. For a layer producing an $H \times W \times C_\text{out}$ feature map from a $k \times k \times C_\text{in}$ filter bank, the shared parameter count is $k^2 C_\text{in} C_\text{out}$ while the neuron-state count is $H W C_\text{out}$, so their ratio is

```{math}
:label: eq:cnn-mem
\frac{\text{neuron states}}{\text{parameters}} \;=\; \frac{H\,W}{k^2\,C_\text{in}} .
```

For a first convolutional layer with a $224 \times 224$ map and a $3 \times 3$ filter over three input channels, {eq}`eq:cnn-mem` is about $1900$: the layer has on the order of three million neuron states but fewer than two thousand weights. A DNN accelerator stores only the shared weights and streams activations through a small buffer; a neuromorphic core stores persistent state for every one of those neurons. Across a full CNN this difference reaches about two orders of magnitude, roughly two hundred times more memory for the same network on the measured SENeCA examples [@yousefzadeh2025memory]. CNN deployment on neuromorphic hardware is therefore a memory problem before it is a compute problem.

Because memory dominates, where a value is kept is itself a design lever. The same datum costs very different amounts depending on its home: a register-file access is cheap but the register file is small, while SRAM scales but every access costs more. Keeping a hot inner-loop instruction stream in a small dedicated store next to the compute elements, instead of re-fetching it from general SRAM each iteration, lowers both the energy and the latency of control, as measured on SENeCA's loop controller [@tang2023seneca]. Choosing what to keep in registers, what to keep in local SRAM, and what to regenerate on demand is one of the highest-leverage decisions in the design. Several techniques reduce the footprint directly, and {ref}`sec:software-mapping` covers them in detail: depth-first inference consumes activations as they are produced instead of storing a whole layer, cutting activation memory by orders of magnitude; spike grouping updates a neuron state once for several events that target it, removing redundant reads and writes; and weight and event compression shrink the two largest stores. None of these change the silicon; they save energy by moving and storing fewer bits.

Non-volatile memories (PCM, RRAM, MRAM, FeRAM) are a longer-term lever for density and for eliminating standby leakage, which matters for an always-on device that is idle most of the time. Their limitations are equally concrete: device-to-device variation, costly writes, and limited precision remain unsolved, and any one of them can cancel the density gain for a given workload [@yousefzadeh2025memory]. The strongest opposing view is that analog in-memory computing removes the memory wall entirely by performing the multiply-accumulate inside the memory array, so weights never move, as the memristor CNN of {ref}`sec:substrate` demonstrates [@yao2020fully]. The counterpoint, increasingly well documented, is that the wall returns at the array boundary: in crossbar in-memory accelerators the analog-to-digital converters and supporting peripheral circuits typically consume sixty to eighty percent of both energy and area [@ibrayev2024pruning], and wire parasitics limit how large a usable crossbar can be. The disagreement is about where the memory wall sits, not whether it exists, and both digital measurements and in-memory results point the same way: data movement and data conversion, not arithmetic, are the dominant cost in every substrate. The practical discipline that follows is a single test for every other design decision: does it move or store fewer bits? A decision that does neither is unlikely to change the energy number that matters.

(sec:acceleration)=
## Adding hardware acceleration without losing programmability

A core can sit anywhere on a spectrum from fully programmable to fully fixed-function, and real chips span the whole range. At one end, SpiNNaker runs every neuron and synapse model in software on general-purpose ARM cores, which makes it maximally flexible but spends energy interpreting instructions [@furber2014spinnaker]. At the other end, TrueNorth hardwires a fixed neuron and synapse model into each core with no programmability and no on-chip learning, which makes it extremely efficient on the one model it implements and unable to run any other [@merolla2014million]. Loihi sits in between, exposing programmable microcode and configurable learning rules while keeping dedicated datapaths for the common operations [@davies2018loihi], and SpiNNaker 2 adds multiply-accumulate and transcendental-function accelerators alongside its ARM cores [@mayr2019spinnaker2]. Moving toward the fixed-function end lowers energy on the targeted kernel but narrows the range of algorithms the chip can run well.

:::{admonition} Dedicated is not automatically faster
:class: warning
Flexible commercial CPUs and GPUs have beaten domain-specific accelerators when their flexibility allowed a better algorithm. A dedicated core wins only when the application matches the hardware closely. Independent benchmarks of Loihi make the point: it shows little or no advantage on feed-forward networks while delivering very large gains on recurrent and temporally structured ones, so the result depends on the workload rather than on the label "dedicated" [@davies2021advancing; @ostrau2022benchmarking].
:::

A productive middle path is to start from a flexible core and add dedicated datapaths only for the kernels that dominate, which can be watched across the three SENeCA generations [@tang2023seneca]. The first generation pairs a RISC-V core with the NoC: flexible but slow. The second adds vector units that accelerate the vector-matrix and convolution kernels that dominate most networks. The third adds a loop controller that takes over fine-grained control, giving a three-level control hierarchy of general core, loop controller, and compute elements, so that the expensive general core is not occupied issuing every inner-loop instruction. Number formats are part of the design: BF16 and integer representations trade dynamic range and overflow behavior against cost in the neuron states and partial sums. The ten-to-one rule explains the priority order: since even floating-point arithmetic costs about ten times less than a memory access [@tang2023open], accelerating arithmetic in isolation yields little, and the accelerators earn their keep mainly by reducing the memory traffic around the kernel. The resulting rule of thumb is to place accelerators on the dominant kernels, namely vector-matrix and convolution, and to leave pre- and post-processing on the general core.

Such a design can close most of the gap to a fixed-function chip while remaining reprogrammable, but it pays in two ways: silicon area, and toolchain effort. Each new instruction or datapath needs a compiler intrinsic, a model of its timing and energy, and test coverage, or algorithm designers cannot reach it without writing assembly by hand. A chip with a rich custom instruction set but a thin compiler is, in practice, a slow chip, because most of its speed is unreachable. This is the hidden half of the specialization trade, and the reason {ref}`sec:software-mapping` treats software as part of the hardware design. The flexible, incremental approach has a genuine cost of its own: it rarely reaches the absolute best efficiency on a fixed benchmark, which a fully dedicated design like TrueNorth can. Whether that trade is worth it depends on how quickly the target algorithms are expected to change, which is itself an open and fast-moving question.

(sec:software-mapping)=
## Software and mapping as first-class hardware design

On a flexible architecture, mapping and software optimization are part of hardware design, because they realize performance the silicon has already paid for. Three techniques make this concrete. Spike grouping updates the same neuron states once for several events that target them, removing redundant memory reads and writes and roughly halving energy and latency in measured results [@tang2023seneca]. Event-driven depth-first convolution fuses layers so that activations are consumed before they accumulate in memory, saving activation memory by orders of magnitude and lowering latency, instead of dedicating memory to every neuron of a CNN as {eq}`eq:cnn-mem` would otherwise require [@yousefzadeh2025memory].

Depth-first execution is worth making concrete, because it attacks {eq}`eq:cnn-mem` directly. Instead of computing a whole $H \times W \times C$ activation map and storing it before the next layer starts, a depth-first schedule produces only the few rows a downstream kernel needs, consumes them at once, and discards them, so the activation memory drops from the full map to a sliding window on the order of $k \times W \times C$. For a deep network this is the difference between storing every neuron's state and storing a thin band of it, which is where the orders-of-magnitude saving comes from.

Quantization and sparsification are the baseline hardware-aware optimizations, reducing the bits per weight and the number of nonzero operations respectively, and both feed directly into the memory and energy models of the previous sections. The broader point is that mapping choices change a platform's effective KPIs as much as silicon changes do, so a platform's performance is only meaningful together with its mapping strategy. This is the strongest practical reason to keep the core flexible. There is broad agreement that algorithm-hardware co-design is necessary, but not on who should own it, and the major platforms have answered differently. SpiNNaker exposes a familiar modeling interface through PyNN, and Loihi ships the Lava framework so that applications need not be written against the silicon directly [@furber2014spinnaker; @davies2021advancing]. The opposite philosophy publishes the instruction set and the energy model so that algorithm designers can optimize against the hardware as it is, the route SENeCA took [@tang2023open]. Recent reviews argue that a high-level, example-based programming model is the missing piece for commercial adoption [@muir2025road]. The two positions disagree on how much of the mapping a user should see, and both have merit; the first maximizes achievable efficiency, the second maximizes the number of people who can deploy at all.

(sec:synthesis)=
## Synthesis: a design-decision to consequence map

The lasting value of the chapter is a method, not a catalog of chips. The method fits in two tables. {numref}`tab:hw-axes` maps each design axis to the KPIs it most affects and marks whether the axis is still contested; {numref}`tab:hw-architectures` shows how a range of real processors resolved those same axes, so the abstract decisions can be read against concrete chips.

```{list-table} Design decisions and the KPIs they most affect. A check in the last column marks an axis where the field has not converged, discussed in the corresponding section.
:header-rows: 1
:name: tab:hw-axes

* - Design axis
  - Latency
  - Energy
  - Area & cost
  - Max model size
  - Accuracy
  - Flexibility
  - Contested
* - Substrate (digital / analog / mixed)
  -
  - strong
  - strong
  - strong
  - analog-limited
  - digital-high
  - yes
* - Array template + NoC
  - mapping
  - near-memory win
  - routing tables
  - scales
  -
  -
  - yes
* - Scale regime (edge vs scaled)
  -
  - sparsity-dependent
  - dominant at edge
  -
  -
  -
  - yes
* - Multiplexing ratio $M$
  - $\propto M$
  - lower at low $M$
  - $\propto 1/M$
  - higher at high $M$
  -
  -
  - yes
* - Event-driven vs clocked
  - low if sparse
  - $\propto$ activity
  - event logic
  -
  -
  -
  - yes
* - Spike representation
  - fewer steps if graded
  - multiply vs count
  - multiplier
  -
  - graded higher
  - both on flexible core
  - yes
* - NoC routing scheme
  -
  - cheap at high density
  - routing memory
  - fan-out limits
  -
  -
  - yes
* - Memory organization
  - access-bound
  - dominant
  - dominant
  - sets it
  -
  -
  - yes
* - Degree of acceleration
  - lower on kernels
  - lower on kernels
  - per datapath
  -
  - numerics
  - lower if specialized
  - yes
* - Mapping strategy
  - strong
  - strong
  -
  - depth-first raises it
  - quantization trade
  - needs flexible core
  - yes
```

```{list-table} How a range of real processors resolved the design axes. The point is the spread of choices, not a ranking.
:header-rows: 1
:name: tab:hw-architectures

* - Processor
  - Substrate
  - Scale (neurons)
  - Spikes
  - Routing
  - On-chip learning
  - Target
* - TrueNorth [@merolla2014million]
  - digital, fixed-function
  - 1M (4096 cores)
  - binary
  - destination
  - no
  - low-power inference
* - Loihi / Loihi 2 [@davies2018loihi]
  - digital, asynchronous
  - ~130k per chip
  - binary then graded
  - table-based
  - yes (programmable)
  - research, adaptive
* - NorthPole [@modha2023northpole]
  - digital, no off-chip memory
  - non-spiking
  - 8/4/2-bit activations
  - on-chip mesh
  - no
  - dense inference
* - SpiNNaker / 2 [@furber2014spinnaker; @mayr2019spinnaker2]
  - digital (ARM cores)
  - ~1B (1M cores)
  - software-defined
  - source-based multicast
  - yes (software)
  - brain simulation
* - BrainScaleS-2 [@pehle2022brainscales2]
  - mixed-signal analog
  - 512 per chip
  - analog, ~1000x speed
  - event-based
  - yes (hybrid)
  - accelerated modeling
* - Neurogrid [@benjamin2014neurogrid]
  - subthreshold analog
  - 1M (16 cores)
  - analog
  - tree multicast
  - no
  - real-time simulation
* - DYNAP [@moradi2018dynaps]
  - mixed-signal, async
  - 256 per core
  - analog
  - hierarchical async
  - no
  - low-power edge
* - ODIN [@frenkel2019odin]
  - digital
  - 256 (single core)
  - binary
  - single-core crossbar
  - yes (SDSP)
  - extreme edge
* - SENeCA [@tang2023seneca]
  - digital (RISC-V + vector)
  - configurable
  - binary or graded
  - network-on-chip
  - yes (programmable)
  - flexible edge
```

The spread in {numref}`tab:hw-architectures` is the real lesson: the same template carries designs that disagree on every axis, from TrueNorth's fixed-function binary cores to SpiNNaker's software neurons, from Neurogrid's real-time analog to BrainScaleS-2's thousand-fold acceleration, and from ODIN's single 256-neuron core to SpiNNaker's million. Tracing one design through its own decisions makes the cause and effect visible. {numref}`fig:hw-seneca` follows SENeCA across three generations as a worked example of incremental specialization: latency per inference falls from about 7000 to 1100 to 550 microseconds, and energy from about 34 to 7 to 3 microjoules, as flexibility is selectively traded for dedicated datapaths and better control [@tang2023seneca].

```{figure} /assets/images/hw_seneca_generations.svg
:name: fig:hw-seneca
:width: 80%
:align: center

A worked example of incremental specialization: one application traced through three generations of a single flexible architecture. Latency and energy per inference both fall by roughly an order of magnitude as vector units and a loop controller are added [@tang2023seneca]. Other processors in {numref}`tab:hw-architectures` sit at fixed points on the same spectrum rather than moving along it.
```

The practical guidance that survives across these designs reduces to a short checklist:

- Start flexible, and specialize only where measurement justifies it.
- Keep the NoC simple, and budget for routing-table memory.
- Match the multiplexing ratio to the workload.
- Add accelerators incrementally, and only for the dominant kernels.
- Separate control from computation.
- Treat memory organization as the first-order problem.
- Exploit event sparsity in software, where the gains are nearly free.

:::{admonition} How to read a neuromorphic datasheet
:class: tip
A specification sheet mixes three kinds of numbers. Some reveal a design decision: neurons per core and the multiplexing ratio expose the time-multiplexing choice; memory per core and weight precision expose the substrate and the memory budget; the spike type (binary or graded) and the routing scheme expose the NoC. Some depend on an unstated workload: energy per inference, operations per second per watt, and latency all assume a particular network size and activity sparsity, and {eq}`eq:event-energy` shows why two sparsities can give very different numbers on the same chip. Some are marketing: peak synaptic operations per second and best-case sparsity figures describe a corner case that a real application rarely reaches. The useful habit is to ask, for every headline number, which network and which activity level produced it.
:::

(sec:outlook)=
## Open challenges and outlook

Several parts of the template are still weak, and naming them helps a designer deploy with realistic expectations.

The small-workload overhead is the first. When an event updates only a few neurons, the per-event control cost on the general core dominates even when accelerators are present, exactly the low operation density of {eq}`eq:op-density`, so dedicated control accelerators that lower the fixed cost per event are a promising direction. New model families are the second: transformers and on-device learning will require accelerator blocks and execution models beyond today's focus on spiking and convolution, and hybrid designs that run both artificial and spiking networks on one die, such as Tianjic, are one response to that pressure [@pei2019tianjic]. Weight sparsity is a third: unlike activation sparsity, it remains hard to exploit on synchronous vector units, because the nonzero weights are scattered, and it is still an open problem. The memory wall is the long-horizon theme, where new memory technologies, 3D integration, shared-memory mappings, and in-memory and in-material processing are the available levers, each carrying the precision and conversion-overhead caveats discussed in {ref}`sec:memory` [@yousefzadeh2025memory; @ibrayev2024pruning].

The field also still lacks a workload where neuromorphic hardware wins decisively, and its compilers, mappers, and debuggers remain far behind the CUDA and TensorFlow ecosystems, which several reviews identify as the real barrier to adoption [@muir2025road]. On that reading, improving the toolchain may matter more than any single architectural advance, because the design space mapped in this chapter is only useful to the extent that a designer can actually navigate it.
