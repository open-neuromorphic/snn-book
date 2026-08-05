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

No two neuromorphic processors look quite alike. The same spiking network can suit one chip well and the next one badly, simply because each design settles its trade-offs differently. This chapter is about those trade-offs and how to reason through them.

We take the design axes one at a time, starting from the substrate and the array template and working toward memory, acceleration, and software. Throughout, each axis is weighed against the same set of key performance indicators, namely latency, energy per inference, area and cost, maximum model size, accuracy, and flexibility. 

(sec:substrate)=
## The substrate decision: digital, analog, or mixed-signal

The substrate is the physical medium out of which the neurons and synapses are built, and it comes in three flavors, analog, digital, or mixed-signal. The choice is one of the earliest a designer makes and one of the hardest to undo, because it settles three things at once. It fixes the numerical precision the hardware can hold, the effort needed to port the design to a newer process node, and how mature the surrounding programming tools are.

```{figure} /assets/images/hw_analog_substrate.svg
:name: fig:hw-analog
:width: 70%
:align: center

How an analog neuromorphic substrate computes. Synaptic currents meet on a shared wire and sum by Kirchhoff's law, with no adder circuit, then charge the membrane capacitance of an analog neuron. Values live as voltages, currents, or charge, so device mismatch and noise enter the computation directly.
```

Analog circuits hold each neuron and synapse value as a physical quantity, typically a voltage, a charge, or a current, and let the device physics carry out the computation. Currents that meet on a shared wire, for instance, add themselves up with no adder circuit at all, which is why analog neurons can be tiny and sip very little power ({numref}`fig:hw-analog`). Neurogrid pushes this idea about as far as it goes. Its transistors run in the subthreshold regime, so the physics emulates the neural dynamics directly, and sixteen of its chips model a million neurons in real time on roughly three watts [@benjamin2014neurogrid]. DYNAP builds mixed-signal cores of adaptive exponential integrate-and-fire neurons and routes their spikes asynchronously [@moradi2018dynaps]. BrainScaleS-2 turns the same parallelism into speed. Because each neuron is a physical analog circuit that is never slowed to biological time, the chip runs about a thousand times faster than biology [@pehle2022brainscales2]. What all of these designs pay for this efficiency is a dependence on the exact behavior of the transistors. Two devices drawn identically still come off the line slightly different, and this mismatch, together with thermal and shot noise, feeds straight into the computation. Porting the design to a smaller process node is likewise no simple recompile. It usually means redesigning the analog blocks, since the device behavior itself shifts with the process.


Digital circuits store those same values as binary numbers and compute with logic gates. They spend more area and energy per neuron, but they earn it back elsewhere. Their results are exact and repeatable, and the design can be synthesized from a hardware description language, reconfigured, and reused as an intellectual-property (IP) block. It also inherits the density and speed gains of each new process node with little extra effort. This is why many neuromorphic processors are digital, from the million-neuron TrueNorth [@merolla2014million] and the learning-capable Loihi [@davies2018loihi] to the general-purpose ARM cores of SpiNNaker [@furber2014spinnaker] and the sub-square-millimeter ODIN [@frenkel2019odin].

The substrate also governs how freely weight precision can be chosen, and precision is the quiet lever behind both model size and accuracy. A digital design can hold its weights at eight, four, or even two bits, trading accuracy for memory in a very direct way, since halving the bits per weight halves the largest of the on-chip stores. NorthPole is built around exactly this freedom and supports eight-, four-, and two-bit operands [@modha2023northpole], and low-bit quantization is one of the main tools of {ref}`sec:software-mapping`. An analog array offers no such dial. Its effective precision is pinned by the device physics and the noise floor at three to four digits, so a task that needs more must either be reshaped to tolerate the noise or moved onto a digital substrate [@bocquet2020embracing].

Mixed-signal designs sit between these two poles. The most common form today is in-memory computing on a resistive crossbar, where the synaptic weights live as the conductances of memory devices. A single analog step then carries out a full multiply-accumulate inside the memory array, with Ohm's law doing the multiplication and Kirchhoff current summation along each column doing the addition. A fully hardware-implemented memristor CNN built this way reached more than ninety-six percent on MNIST at an energy efficiency more than two orders of magnitude better than a GPU, but only after a hybrid training procedure that adapted the network to the arrays' imperfections [@yao2020fully]. That caveat is a general one. Although *neuromorphic* is often taken to mean *analog*, the processors that ship today are digital or mostly digital, and digital logic also turns out to be the most convenient host for bolting on analog or in-memory blocks later.

Whether analog is the better long-term substrate remains an open question, and the disagreement runs deep rather than surface. Its advocates point out that fully parallel analog computation sheds two costs that digital systems can never quite escape, the clocking and synchronization overhead and the energy of shuttling operands to and from memory. The standard objection is precision. Analog in-memory systems typically resolve only three to four decimal digits, drift over time, and vary from one device to the next, so they lean on calibration or on a training procedure that keeps the physical chip in the loop [@bocquet2020embracing]. A third camp treats this unreliability as a resource rather than a flaw and designs algorithms that tolerate or even exploit device noise [@bocquet2020embracing]. What separates these groups is not the measurements so much as how much error they consider acceptable for a given task, and that is why the question stays open.

(sec:array-template)=
## The dominant template: an array of tiny processors plus a network-on-chip

Almost every scalable digital neuromorphic processor is put together the same way. It is built from many small cores, each carrying its own local memory and compute, wired together by a network-on-chip (NoC). The pattern keeps reappearing across chips that otherwise have little in common. TrueNorth tiles 4096 fixed-function cores on a single die for a million neurons and 256 million synapses [@merolla2014million]. Loihi uses 128 programmable cores for about 130000 neurons with on-chip learning [@davies2018loihi]. SpiNNaker packs eighteen general-purpose ARM cores into each chip and scales to a million of them [@furber2014spinnaker]. NorthPole spreads 224 MB of SRAM across 256 cores and keeps every weight on-chip [@modha2023northpole]. NeuronFlow, AKIDA, and SENeCA follow the same template [@moreira2020neuronflow; @tang2023seneca]. The core count spans more than an order of magnitude and the per-core memory a wide range, yet the organizing idea never changes, and that consistency is what makes it a template rather than a coincidence. It echoes the decentralized layout of cortical tissue, where computation and storage are not held physically apart as they are in a von Neumann machine.

```{figure} /assets/images/hw_template.svg
:name: fig:hw-template
:width: 75%
:align: center

The template shared by most scalable digital neuromorphic processors. It is a tiled array of small cores, each holding its own compute and local memory, connected by a network-on-chip. The same pattern underlies TrueNorth, Loihi, SpiNNaker, NorthPole, NeuronFlow, and SENeCA.
```

In this picture the core plays the part of the neuron substrate and the NoC that of the axon substrate ({numref}`fig:hw-template`). Keeping each core's memory right beside its compute is the central efficiency argument against the von Neumann organization, where operands must travel back and forth to a separate, distant memory. Scalability then comes almost for free, because every core added brings compute and memory together. A larger chip, or several chips tiled side by side, raises capacity, on-chip bandwidth, and parallelism all at once. The difficulty does not vanish, though. It shifts into mapping, the problem of placing neurons and layers onto cores, and into load balancing, the problem of keeping those cores evenly busy. Mapping is therefore as much a hardware concern as a software one, and {ref}`sec:software-mapping` comes back to it.

Building real systems on this template teaches two practical lessons. The first is that scaling past a single chip simply reuses the same idea. Inter-chip links carry packets between dies, so a board of chips behaves like one larger array, which is how SpiNNaker reaches a million cores and how multi-chip Loihi and Neurogrid systems reach their scale [@furber2014spinnaker; @benjamin2014neurogrid]. The second is that the parallelism is only as good as the mapping behind it. Let one core hold a busy layer while its neighbors sit idle, and that core becomes the critical path with the rest of the array waiting on it, so a balanced placement counts for as much as raw core count.

The template is near-universal, yet its justification is contested, and the sharpest counterexample deserves to be stated plainly. A highly connected cortical model can run faster and at lower energy on a single GPU than on SpiNNaker or a CPU cluster, with energy per synaptic event reported as up to fourteen times lower on the GPU [@knight2018gpus]. When a commodity dense accelerator can win on a workload that looks tailor-made for neuromorphic hardware, the tiled array stops being an automatic default and becomes a choice to justify for each application. What the tiled array really trades on is sparsity and scale, the subjects of the next two sections. Where those are missing, its overheads can lose to a GPU or a plain accelerator.

(sec:scale-regime)=
## Scaled-up systems versus the extreme edge

The array template was designed for scale, and its advantages do not carry over automatically to a tiny chip running a tiny network. This gap is the central practical tension of the chapter, so the two regimes are worth spelling out.

At large scale the template performs well precisely because memory and compute are distributed, leaving no shared bottleneck, and every core added brings capacity, bandwidth, and parallelism together. SpiNNaker was built to simulate about a billion neurons in real time across a million cores [@furber2014spinnaker]. Neurogrid models a million neurons on roughly three watts [@benjamin2014neurogrid]. Multi-chip Loihi systems spread large networks across many tiles [@davies2021advancing]. The extreme edge is another regime entirely. Here we have thousands of neurons rather than millions, power budgets of a milliwatt or less, silicon area dictated by unit cost, and often a single sensor as the only input. ODIN is a good representative. It fits 256 neurons and 64k synapses into 0.086 square millimeters and spends only 12.7 picojoules per synaptic operation [@frenkel2019odin], and commercial parts such as BrainChip's AKIDA chase the same always-on, battery-powered niche.

The underlying bargain is that neuromorphic hardware spends silicon area to buy power efficiency. Per-neuron memory, parallel cores, routing tables, and the event-handling logic all take up area, and at the extreme edge area is the dominant cost, since cost scales with die size. Parallelism buys high throughput too, but an edge application rarely wants maximum throughput. It wants to keep up with the sensor rate and hit the deadline. A small clocked accelerator that finishes inside the frame budget and then goes to sleep can meet that same requirement at lower area and cost.

```{figure} /assets/images/hw_scale_regime.svg
:name: fig:hw-scale
:width: 65%
:align: center

A qualitative map of where each style of design tends to win, as a function of input activity sparsity and network size. Event-driven neuromorphic designs gain ground toward large, sparse workloads, while a small clocked accelerator is often the better bet for small or dense ones. A wide band between them is truly mixed.
```

:::{admonition} Why event-driven processing on a tiny chip?
:class: tip
The per-event control overhead that is negligible at scale turns into the dominant cost once each event touches only a handful of neurons. This is the small-workload trap, seen directly in the SENeCA project, where the event-driven machinery carries a fixed cost per event that a small network has no way to amortize [@tang2023open]. A few cases still make event-driven processing worthwhile at the edge. The first is always-on workloads whose input stays silent most of the time, such as keyword spotting and wake-up detection. The second is latency-critical sparse sensors such as event cameras. The third is the case where the wake-up cost and sleep-state leakage of a clocked alternative would swallow the savings it promises.
:::

So *neuromorphic is for the edge* is a slogan, not an analysis. The defensible version is conditional, and {numref}`fig:hw-scale` sketches it. Event-driven processing pays off at the edge when activity is truly rare and the network is still large enough to amortize the event machinery. Step outside that regime and a conventional tiny accelerator can win on both cost and energy. Two results from outside the neuromorphic community sharpen the warning. Spiking models often need very high activity sparsity, around ninety-three percent or more, before they beat an equivalent artificial neural network, and once the energy per spike per synapse is counted, even that advantage can vanish [@yan2024reconsidering]. At the extreme edge, where networks are small and not always sparse, that threshold is easy to miss. Recent reviews land on a compatible and more measured position. Neuromorphic hardware complements GPU-based deep learning on sparse, event-driven workloads and falls behind on dense ones, so the useful edge question is about a workload's sparsity and timing structure rather than about a brand of hardware [@muir2025road].

(sec:time-multiplexing)=
## Time-multiplexing versus physical parallelism

A single physical core can stand in for many logical neurons by reusing its datapath over time. This works because silicon switches millions of times faster than a biological neuron fires, so one datapath can march through many neurons in sequence within a single time step and still finish before the next step falls due. TrueNorth exploits this directly, sharing each core's logic across its 256 neurons [@merolla2014million], and digital arrays such as Loihi and SENeCA do the same.

Designs spread along a spectrum, from fully parallel, through partially parallel, to fully time-multiplexed, where a single datapath updates one neuron per step ({numref}`fig:hw-mux`). The governing parameter is the multiplexing ratio $M$, the number of logical neurons served by each physical datapath. For $N$ neurons, the number of physical datapaths and the per-step update latency move in opposite directions,

```{math}
:label: eq:mux
P \;=\; \left\lceil \frac{N}{M} \right\rceil, \qquad A_\text{compute} \;\propto\; \frac{N}{M}, \qquad t_\text{update} \;\propto\; M .
```

A higher ratio buys area efficiency and lowers communication overhead, because fewer physical datapaths emit fewer simultaneous packets. A lower ratio buys throughput, latency, and energy efficiency, because more neurons update in parallel. The area saving grows the more expensive the neuron model is, since one costly datapath is then amortized across many more neurons.

A quick calculation shows why high ratios are so practical. A datapath clocked at one gigahertz finishes a simple neuron update in a few nanoseconds, so within a one-millisecond time step it can work through on the order of $10^5$ neurons in sequence before the step comes due. A biological time step thus leaves enormous headroom on silicon, and that headroom is the physical reason one datapath can stand in for thousands of neurons with no loss of real-time behavior. The binding limit is not time at all but the memory bandwidth needed to stream those neuron states past the datapath, which brings the discussion back to memory.

```{figure} /assets/images/hw_multiplexing.svg
:name: fig:hw-mux
:width: 85%
:align: center

The two ends of the multiplexing spectrum. Fully parallel uses one datapath per neuron and updates in a single step. Fully time-multiplexed reuses one datapath across all neurons over many steps. Compute area scales as $N/M$ and update latency as $M$.
```

By {eq}`eq:mux`, the multiplexing ratio fixes both the largest network a core can hold and the latency it can reach, so it is best chosen per application. The far end of the spectrum belongs to analog systems that give every neuron its own physical circuit. Neurogrid and BrainScaleS-2 do not time-multiplex at all, and BrainScaleS-2 turns the resulting parallelism into raw speed, emulating its networks about a thousand times faster than biological time [@pehle2022brainscales2; @benjamin2014neurogrid]. Seen from there, time-multiplexing looks like a compromise, since reusing one datapath reintroduces the sequential, memory-fetch-bound behavior that neuromorphic computing set out to avoid in the first place. It is the pragmatic digital answer, and its price is exactly the serialization the analog camp objects to.

(sec:event-driven)=
## The event-driven datapath and sparsity exploitation

An event-driven core does work only when an event arrives and stays idle the rest of the time, so its power tracks activity rather than wall-clock time. Loihi makes this explicit by running without a global clock, advancing only as spikes arrive [@davies2018loihi], and commercial event-based parts such as AKIDA rest on the same principle. In this event-proportional model the energy of one inference is a static term plus a sum over the events actually processed,

```{math}
:label: eq:event-energy
E_\text{inf} \;\approx\; \underbrace{P_\text{static}\,T}_{\text{idle}} \;+\; \sum_{\text{events}} \big( e_\text{syn} + e_\text{nrn} + e_\text{gen} \big),
```

where $T$ is the inference window and $e_\text{syn}, e_\text{nrn}, e_\text{gen}$ are the per-event energies of the three pipeline stages described below. When $N_\text{ev}$ events are processed, the dynamic energy scales with $N_\text{ev}$, which is just the formal way of saying "power proportional to activity." That per-event energy is small but never free. ODIN, for instance, reports 12.7 picojoules per synaptic operation [@frenkel2019odin].

The datapath runs in three stages ({numref}`fig:hw-pipeline`) [@tang2023open]. During the **synaptic process** the core optionally applies a delay, reads the relevant weights, works out the addresses of the neurons the event affects, and, when on-device learning is enabled, updates the weights. This is also where convolutional connectivity gets expanded. During the **neuron process** the core updates the affected neuron states. This is the step that decides efficiency, and it can be fully parallel, partially parallel, or fully time-multiplexed as in {numref}`fig:hw-mux`. During **event generation** the core assembles address-event-representation (AER) packets from the addresses of the neurons that fired and reads the axon memory to find their targets. It can also compress those packets, feed them back for recurrence and learning, apply delays for skip connections, and fold in pooling.

```{figure} /assets/images/hw_event_pipeline.svg
:name: fig:hw-pipeline
:width: 90%
:align: center

The three-stage event pipeline. Each stage touches a different memory, the weights in the synaptic process, the neuron states in the neuron process, and the axon memory in event generation. The memory traffic, not the arithmetic, dominates the energy of an event.
```

Two quantities decide the outcome. The first is activation sparsity, the fraction of neurons active at any moment, and it is the main lever. Careful energy budgets of cortex place it near or below one percent, since the metabolic cost of a spike means only about one neuron in twenty-five to one in sixty can be substantially active at once [@lennie2003cost], and this very low activity is what the event-driven datapath feeds on, because idle neurons cost nothing. Weight sparsity, the fraction of zero-valued weights, is a separate and harder problem, since exploiting it means skipping scattered entries rather than whole inactive neurons. The second quantity is operation density, the number of arithmetic operations performed per delivered packet, and it decides whether data movement or computation dominates,

```{math}
:label: eq:op-density
D \;=\; \frac{\text{arithmetic operations performed}}{\text{packets delivered}} .
```

Suppose each delivered packet carries a fixed handling overhead $e_\text{ovh}$ and sets off $D$ operations at $e_\text{op}$ each. The energy per useful operation is then about $e_\text{ovh}/D + e_\text{op}$. When $D$ is large, as in a convolution where one event fans out to many synapses, the overhead is amortized away and the core runs efficiently. When $D$ is small, as in a tiny network where an event touches only a few neurons, the fixed overhead takes over and the event-driven style loses its advantage. This is the same small-workload trap met in {ref}`sec:scale-regime`, now put in quantitative terms.

A concrete contrast drives the point home. A single event entering a convolutional layer with a $3 \times 3$ kernel and sixty-four output channels fans out to about $3 \times 3 \times 64 \approx 576$ synaptic operations, a high operation density that swamps the packet overhead. The same event entering a small fully connected layer with only a handful of targets carries an operation density of just a few, so nearly all of its energy goes to handling the packet rather than to useful work. High-fan-out structure, of the kind convolution provides, is what makes the event-driven style efficient, and flat, low-fan-out structure is what defeats it.

The energy savings are therefore large on naturally sparse signals such as audio and event-based vision, though the per-event overhead always sets a floor. An interactive energy calculator, built on measured SENeCA per-instruction and per-component costs, lets a reader watch the sparsity-dependent synaptic term in {eq}`eq:event-energy` fall toward the sparsity-independent neuron-update floor [@tang2023open].

The clean theory of event-proportional power runs into a messier measurement record, and the gap between them is by now well documented. A recent reassessment finds that event handling, memory access, and instruction control are routinely left out of efficiency claims, which makes reported SNN advantages look rosier than they are [@yan2024reconsidering]. How much sparsity is actually usable is disputed as well. The one-to-ten-percent figure from cortex gets quoted often, but reaching high sparsity in a trained deep network usually calls for explicit regularization during training, which can cost accuracy and shift the energy break-even point.

(sec:spike-representation)=
## Spike representation: binary versus graded spikes

How much information a single spike carries is itself a design choice, and it bears on both accuracy and bandwidth. A binary spike carries one bit. The synapse simply accumulates its weight with no multiplication, which is the biologically faithful case and the cheapest per event. The first generation of large digital chips committed to it, TrueNorth and the original Loihi among them [@merolla2014million; @davies2018loihi]. A graded, or valued, spike instead carries a number. It costs a multiplication and a few more bits per packet, but it can reach the same accuracy with far fewer spikes. The trade is therefore between the cost of each event and the number of events needed.

The field has since drifted toward graded spikes. The second-generation chips, Loihi 2, NorthPole, and SpiNNaker 2 among them, all carry numeric values rather than bare events [@davies2021advancing; @modha2023northpole]. NorthPole takes this trend to its limit. It drops spikes altogether and computes on eight-, four-, and two-bit activations like a dense inference accelerator [@modha2023northpole]. The choice trades NoC bandwidth and multiplier cost against spike count and accuracy, and a flexible core can support either, which is one more argument for flexibility. It also loops back to the edge question of {ref}`sec:scale-regime`. Binary events are the cheapest per event, but if a small network needs many of them to stay accurate, the larger event count can undo the per-event saving.

A little bandwidth arithmetic makes the trade concrete. In a network of about a million neurons an AER packet needs roughly twenty bits just to name its source, so a binary spike is about twenty bits on the wire. A graded spike tacks on an eight- to sixteen-bit value, which brings the packet to one and a half or two times that size. If carrying the value lets the network reach the same accuracy with a third as many spikes, total bandwidth still drops. Whether it does depends on the task, and that dependence is the practical case for a core that can switch representations.

Underneath the binary-versus-graded choice sits the older and still unsettled debate between rate and temporal coding. Rate coding represents a value by a spike count over a window. It is robust but demands many time steps and redundant spikes, which drives up both latency and energy. Temporal codes such as time-to-first-spike represent a value by *when* a neuron fires, and claim much lower latency at similar or better accuracy. The dispute is very much live. Some work reports ninety-three percent CIFAR-10 accuracy in a single time step [@chowdhury2021one], whereas common rate-coded pipelines still spend one hundred to two hundred. Since the energy of {eq}`eq:event-energy` is paid once per time step, the step count multiplies energy directly, so this coding choice can outweigh the binary-versus-graded one, which is why the two are best weighed together.

(sec:noc)=
## The network-on-chip: communication and its real cost

Cores share a limited set of physical wires, so a spike cannot travel as a bare electrical pulse. Instead it travels as a routed packet that carries the identity of its source, an arrangement known as address-event representation (AER). Wires cannot be added after fabrication, so connectivity is virtualized, and the shared links are time-multiplexed to emulate the dense, point-to-point wiring of a biological network. Routing comes in two flavors. It can be destination-based, where the packet carries its own list of targets, as in TrueNorth. Or it can be source-based, where the packet names only its origin and each router works out the targets, the style SpiNNaker chose and built a dedicated multicast router around [@merolla2014million; @furber2014spinnaker]. Multicasting is what handles fan-out, letting one source reach many targets without sending a separate packet to each.

A rough count shows why routing tables grow. Suppose each of $N$ neurons has to name its targets explicitly, and each drives a fan-out of $F$ targets chosen from $N$ possibilities. A destination list then costs about $F \log_2 N$ bits per neuron, so high fan-out and large $N$ together make destination-based tables costly. Source-based routing sidesteps the per-target lists by computing destinations from the source address and a compact rule. It trades table memory for a lookup at each router, a bargain that pays off when the connectivity is structured, as it is in a convolution.

:::{admonition} The real cost of the NoC is memory, not bandwidth
:class: note
Across NeuronFlow, Loihi, SpiNNaker, Epiphany, and SENeCA, the NoC has not turned out to be the performance or energy bottleneck, because operation density is high enough that moving a packet is far cheaper than processing it. The cost that does bite is memory. Routing tables can grow large. TrueNorth spends twenty-six bits per neuron just to encode a single destination [@merolla2014million], and in NeuronFlow the routing table takes up about a quarter of on-chip memory [@moreira2020neuronflow]. Source-based routing shrinks these tables for structured networks and makes multicast cheap, at the price of a lookup at each hop.
:::

The guideline that follows is to keep the NoC itself simple while budgeting deliberately for routing-table memory, an easily overlooked area and energy cost that leads straight into the memory section. The claim that the NoC is never the bottleneck holds only for certain workloads, and the exception is instructive. In large-scale brain simulation, with very high fan-out and low operation density per packet, communication and its routing memory can take over, which is part of why SpiNNaker invested so heavily in its routing fabric [@furber2014spinnaker]. The accurate statement is a conditional one. For inference workloads with high operation density the NoC is cheap, whereas at biological connectivity and scale communication has repeatedly proven to be a first-order cost.

(sec:memory)=
## Memory is the real challenge

In a distributed near-memory processor, on-chip memory dominates both area and energy, and that alone promotes memory organization from an implementation detail to the central design decision. This section is the analytical core of the chapter, and most of the axes seen so far come back into play here [@yousefzadeh2025memory].

The key point is that bringing compute next to memory does not tear down the memory wall. It only moves it. The tiled, near-memory template does away with the von Neumann habit of shuttling operands to and from a distant main memory, and at the system level this works. NorthPole carries the idea all the way, dropping off-chip memory entirely and spreading 224 MB of SRAM across its cores so that no weight ever leaves the chip [@modha2023northpole]. Inside a single core, though, the local memory becomes the limiting resource. SRAM today, and non-volatile alternatives such as STT-MRAM in the near future, dominate the per-inference area and energy. The wall has not vanished. It has simply moved to the short gap between the datapath and the on-chip memory beside it [@yousefzadeh2025memory]. A digital neuromorphic core spends its memory on five things, the synaptic weights, the neuron states, the routing tables that virtualize connectivity over the NoC, the instruction and control memory that drives the datapath, and the axon memory that lists each neuron's outgoing connections. Set against these, the arithmetic is a small line item. A single inference burns far more energy reading and writing state than computing on it, as {numref}`fig:hw-energy` summarizes. The ten-to-one gap between a memory access and an arithmetic operation shown there is a rule of thumb used throughout this chapter [@horowitz2014computing; @tang2023open].

```{figure} /assets/images/hw_energy_breakdown.svg
:name: fig:hw-energy
:width: 80%
:align: center

Schematic split of the energy of one inference into compute, communication, and memory access. The proportions are illustrative, but the ordering is the robust result reported across digital neuromorphic measurements. Memory access and data movement dominate, and a single on-chip memory access costs roughly ten times an arithmetic operation, with off-chip access far more [@horowitz2014computing; @tang2023open; @yousefzadeh2025memory].
```

The clearest illustration is the way neuron state balloons in convolutional networks. A neuromorphic core allocates state memory per neuron, so a convolutional layer behaves very differently here than on a conventional DNN accelerator. In a convolution one small filter is reused across a large feature map, which keeps the parameter count tiny while the neuron count runs large. For a layer producing an $H \times W \times C_\text{out}$ feature map from a $k \times k \times C_\text{in}$ filter bank, the shared parameter count is $k^2 C_\text{in} C_\text{out}$ while the neuron-state count is $H W C_\text{out}$, so their ratio is

```{math}
:label: eq:cnn-mem
\frac{\text{neuron states}}{\text{parameters}} \;=\; \frac{H\,W}{k^2\,C_\text{in}} .
```

For a first convolutional layer with a $224 \times 224$ map and a $3 \times 3$ filter over three input channels, {eq}`eq:cnn-mem` works out to about $1900$. The layer holds on the order of three million neuron states but fewer than two thousand weights. A DNN accelerator stores only the shared weights and streams activations through a small buffer, whereas a neuromorphic core keeps persistent state for every one of those neurons. Across a full CNN the difference reaches about two orders of magnitude, roughly two hundred times more memory for the same network on the measured SENeCA examples [@yousefzadeh2025memory]. Deploying a CNN on neuromorphic hardware is therefore a memory problem long before it is a compute problem.

Since memory dominates, where a value lives is itself a design lever. The same datum costs wildly different amounts depending on its home. A register-file access is cheap but the register file is small, while SRAM scales but charges more for every access. Keeping a hot inner-loop instruction stream in a small dedicated store next to the compute elements, rather than re-fetching it from general SRAM on every iteration, lowers both the energy and the latency of control, as measured on SENeCA's loop controller [@tang2023seneca]. Deciding what to keep in registers, what to keep in local SRAM, and what to regenerate on demand is one of the highest-leverage choices in the whole design. Several techniques shrink the footprint directly, and {ref}`sec:software-mapping` treats them in detail. Depth-first inference consumes activations as they are produced instead of storing a whole layer, cutting activation memory by orders of magnitude. Spike grouping updates a neuron state once for several events that target it, removing redundant reads and writes. Weight and event compression shrink the two largest stores. None of these touch the silicon. They save energy purely by moving and storing fewer bits.

Non-volatile memories such as PCM, RRAM, MRAM, and FeRAM offer a longer-term lever for density and for eliminating standby leakage, which matters for an always-on device that sits idle most of the time. Their drawbacks are just as concrete. Device-to-device variation, costly writes, and limited precision remain unsolved, and any one of them can wipe out the density gain for a given workload [@yousefzadeh2025memory]. The strongest opposing view holds that analog in-memory computing removes the memory wall outright by carrying out the multiply-accumulate inside the memory array, so weights never move at all, as the memristor CNN of {ref}`sec:substrate` shows [@yao2020fully]. The counterpoint, now increasingly well documented, is that the wall simply reappears at the array boundary. In crossbar in-memory accelerators the analog-to-digital converters and their supporting peripheral circuits typically eat sixty to eighty percent of both energy and area [@ibrayev2024pruning], and wire parasitics cap how large a usable crossbar can get. The disagreement is about where the memory wall sits, not whether it exists at all. Digital measurements and in-memory results point the same way. Data movement and data conversion, not arithmetic, are the dominant cost in every substrate. The practical discipline that follows is to hold every other design decision up to a single test. Does it move or store fewer bits? A decision that does neither is unlikely to shift the energy number that matters.

(sec:acceleration)=
## Adding hardware acceleration without losing programmability

A core can sit anywhere on a spectrum from fully programmable to fully fixed-function, and real chips fill the whole range. At one end, SpiNNaker runs every neuron and synapse model in software on general-purpose ARM cores, which makes it maximally flexible but burns energy interpreting instructions [@furber2014spinnaker]. At the other, TrueNorth hardwires a fixed neuron and synapse model into each core with no programmability and no on-chip learning, which makes it extremely efficient on the one model it implements and useless on any other [@merolla2014million]. Loihi sits in between, exposing programmable microcode and configurable learning rules while keeping dedicated datapaths for the common operations [@davies2018loihi], and SpiNNaker 2 adds multiply-accumulate and transcendental-function accelerators alongside its ARM cores [@mayr2019spinnaker2]. Sliding toward the fixed-function end lowers energy on the targeted kernel but narrows the range of algorithms the chip can run well.

:::{admonition} Dedicated is not automatically faster
:class: warning
Flexible commercial CPUs and GPUs have beaten domain-specific accelerators whenever their flexibility opened the door to a better algorithm. A dedicated core wins only when the application matches the hardware closely. Independent benchmarks of Loihi make the point. It shows little or no advantage on feed-forward networks yet delivers very large gains on recurrent and temporally structured ones, so the outcome turns on the workload rather than on the label "dedicated" [@davies2021advancing; @ostrau2022benchmarking].
:::

A productive middle path is to begin with a flexible core and add dedicated datapaths only for the kernels that dominate, a progression visible across the three SENeCA generations [@tang2023seneca]. The first generation pairs a RISC-V core with the NoC and is flexible but slow. The second adds vector units that accelerate the vector-matrix and convolution kernels found in most networks. The third adds a loop controller that takes over fine-grained control, producing a three-level control hierarchy of general core, loop controller, and compute elements, so the expensive general core is no longer tied up issuing every inner-loop instruction. Number formats are part of this design too, with BF16 and integer representations trading dynamic range and overflow behavior against cost in the neuron states and partial sums. The ten-to-one rule explains the priority order. Since even floating-point arithmetic costs about ten times less than an on-chip memory access, and orders of magnitude less than an off-chip one [@horowitz2014computing; @tang2023open], accelerating arithmetic on its own buys little, and the accelerators earn their keep mainly by thinning the memory traffic around the kernel. The rule of thumb that emerges is to place accelerators on the dominant kernels, namely vector-matrix and convolution, and to leave pre- and post-processing on the general core.

Such a design can close most of the gap to a fixed-function chip while staying reprogrammable, but it charges for this in two ways, in silicon area and in toolchain effort. Each new instruction or datapath needs a compiler intrinsic, a model of its timing and energy, and test coverage, or else algorithm designers cannot reach it short of writing assembly by hand. A chip with a rich custom instruction set but a thin compiler is, in practice, a slow chip, because most of its speed stays out of reach. This is the hidden half of the specialization trade, and the reason {ref}`sec:software-mapping` treats software as part of the hardware design. The flexible, incremental approach carries a real cost of its own. It rarely reaches the absolute best efficiency on a fixed benchmark, which a fully dedicated design like TrueNorth can. Whether the trade is worth making depends on how fast the target algorithms are expected to change, which is itself an open and fast-moving question.

On-chip learning is a special case of the same trade. A chip that adapts in the field, such as Loihi, ODIN, or BrainScaleS-2, has to add a plasticity datapath and, more consequentially, memory to hold the per-synapse state and eligibility traces a learning rule needs, which can rival the weight memory itself [@davies2018loihi; @frenkel2019odin; @pehle2022brainscales2]. Inference-only chips such as TrueNorth and NorthPole skip all of this, which is part of why they pack in so densely [@merolla2014million; @modha2023northpole]. Paying for learning is therefore as much a memory decision as a compute one. Continual on-device adaptation justifies it, a fixed deployed model does not.

(sec:software-mapping)=
## Software and mapping as first-class hardware design

On a flexible architecture, mapping and software optimization are part of hardware design, because they cash in performance the silicon has already paid for. A few techniques make this concrete. Spike grouping updates the same neuron states once for several events that target them, removing redundant memory reads and writes and roughly halving energy and latency in measured results [@tang2023seneca]. Event-driven depth-first convolution fuses layers so that activations are consumed before they pile up in memory, saving activation memory by orders of magnitude and lowering latency, rather than dedicating memory to every neuron of a CNN as {eq}`eq:cnn-mem` would otherwise demand [@yousefzadeh2025memory].

Depth-first execution is worth spelling out, because it attacks {eq}`eq:cnn-mem` head-on. Rather than compute a whole $H \times W \times C$ activation map and store it before the next layer starts, a depth-first schedule produces only the few rows a downstream kernel needs, consumes them at once, and throws them away. Activation memory then shrinks from the full map to a sliding window on the order of $k \times W \times C$. For a deep network this is the difference between storing every neuron's state and storing a thin band of it, and that is where the orders-of-magnitude saving comes from.

Quantization and sparsification are the baseline hardware-aware optimizations. They cut the bits per weight and the number of nonzero operations respectively, and both feed straight into the memory and energy models of the previous sections. The broader point is that mapping choices shift a platform's effective KPIs as much as silicon changes do, so a platform's performance means little apart from its mapping strategy. This is the strongest practical reason to keep the core flexible. Everyone agrees that algorithm-hardware co-design is necessary, but not on who should own it, and the major platforms have answered the question differently. SpiNNaker exposes a familiar modeling interface through PyNN, and Loihi ships the Lava framework so that applications need not be written against the silicon directly [@furber2014spinnaker; @davies2021advancing]. The opposite philosophy publishes the instruction set and the energy model so that algorithm designers can optimize against the hardware as it actually is, the route SENeCA took [@tang2023open]. Recent reviews argue that a high-level, example-based programming model is the piece still missing for commercial adoption [@muir2025road]. The two positions differ on how much of the mapping a user should see, and both have merit. The first maximizes achievable efficiency, the second maximizes the number of people who can deploy at all.

(sec:synthesis)=
## Synthesis: a design-decision to consequence map

The lasting value of the chapter is a method, not a catalog of chips, and the method fits in two tables. {numref}`tab:hw-axes` maps each design axis to the KPIs it most affects and flags whether the axis is still contested. {numref}`tab:hw-architectures` then shows how a range of real processors resolved those same axes, so the abstract decisions can be read against concrete chips.

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

The spread in {numref}`tab:hw-architectures` is the real lesson. The same template carries designs that disagree on every axis, from TrueNorth's fixed-function binary cores to SpiNNaker's software neurons, from Neurogrid's real-time analog to BrainScaleS-2's thousand-fold acceleration, and from ODIN's single 256-neuron core to SpiNNaker's million. Tracing one design through its own decisions makes the cause and effect plain. {numref}`fig:hw-seneca` follows SENeCA across three generations as a worked example of incremental specialization. Latency per inference falls from about 7000 to 1100 to 550 microseconds, and energy from about 34 to 7 to 3 microjoules, as flexibility is selectively traded for dedicated datapaths and better control [@tang2023seneca].

```{figure} /assets/images/hw_seneca_generations.svg
:name: fig:hw-seneca
:width: 80%
:align: center

A worked example of incremental specialization, with one application traced through three generations of a single flexible architecture. Latency and energy per inference both fall by roughly an order of magnitude as vector units and a loop controller are added [@tang2023seneca]. Other processors in {numref}`tab:hw-architectures` sit at fixed points on the same spectrum rather than moving along it.
```

The practical guidance below reflects one well-supported design philosophy, the flexible-digital approach that several recent processors follow. It is not the only defensible one. A team building a product around a single, frozen workload may sensibly invert the first and fourth points and commit to a dedicated datapath from the start, the choice TrueNorth made and the reason it is so efficient on the one model it runs. With that caveat, the recurring guidance boils down to a short checklist:

- Start flexible, and specialize only where measurement justifies it.
- Keep the NoC simple, and budget for routing-table memory.
- Match the multiplexing ratio to the workload.
- Add accelerators incrementally, and only for the dominant kernels.
- Separate control from computation.
- Treat memory organization as the first-order problem.
- Exploit event sparsity in software, where the gains are nearly free.

A brief example shows the method at work. Consider a battery-powered keyword spotter that must wake on a rare trigger word. The scale regime is the extreme edge, so area and standby power dominate and a network of a few thousand neurons is the target. The input stays silent most of the time, the one case where event-driven processing clearly pays, so an event-driven core or a heavily duty-cycled clocked accelerator both fit. Binary spikes are appealing because each event is cheap, but only if accuracy holds up, so the representation has to be checked against the task. Memory, not arithmetic, sets the energy, so the weights should be quantized aggressively and kept entirely on-chip. The same walk through {numref}`tab:hw-axes` works for any application, and it is the real deliverable of this chapter.

:::{admonition} How to read a neuromorphic datasheet
:class: tip
A specification sheet mixes three kinds of numbers. Some reveal a design decision. Neurons per core and the multiplexing ratio expose the time-multiplexing choice, memory per core and weight precision expose the substrate and the memory budget, and the spike type and routing scheme expose the NoC. Others depend on an unstated workload. Energy per inference, operations per second per watt, and latency all assume a particular network size and activity sparsity, and {eq}`eq:event-energy` shows why two sparsities can produce very different numbers on the same chip. A last group is marketing. Peak synaptic operations per second and best-case sparsity figures describe a corner case a real application rarely reaches. The useful habit is to ask, for every headline number, which network and which activity level produced it. Standardized benchmark suites such as NeuroBench try to make these numbers comparable across chips by fixing the workload and the measurement method [@yik2025neurobench].
:::

(sec:outlook)=
## Open challenges and outlook

Several parts of the template are still weak, and naming them helps a designer deploy with clear eyes.

The small-workload overhead is the first. When an event updates only a few neurons, the per-event control cost on the general core dominates even with accelerators present, exactly the low operation density of {eq}`eq:op-density`. Dedicated control accelerators that shave the fixed cost per event are a promising direction. New model families are the second. Transformers and on-device learning will demand accelerator blocks and execution models beyond today's focus on spiking and convolution, and hybrid designs that run both artificial and spiking networks on one die, such as Tianjic, are one answer to that pressure [@pei2019tianjic]. Weight sparsity is a third. Unlike activation sparsity, it stays hard to exploit on synchronous vector units, because the nonzero weights are scattered, and it remains an open problem. The memory wall is the long-horizon theme, where new memory technologies, 3D integration, shared-memory mappings, and in-memory and in-material processing are the levers on offer, each carrying the precision and conversion-overhead caveats discussed in {ref}`sec:memory` [@yousefzadeh2025memory; @ibrayev2024pruning].

The field also still lacks a workload where neuromorphic hardware wins outright, and its compilers, mappers, and debuggers trail far behind the CUDA and TensorFlow ecosystems, which several reviews single out as the real barrier to adoption [@muir2025road]. On that reading, improving the toolchain may matter more than any single architectural advance, because the design space mapped in this chapter is only useful insofar as a designer can actually navigate it.
