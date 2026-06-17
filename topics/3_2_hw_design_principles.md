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

Choosing neuromorphic hardware is not a search for the fastest chip. It is a search for the set of design decisions that fits a particular application. The criteria that decide the fit are a small set of key performance indicators: latency, energy per inference, area and cost, the maximum model size the hardware can hold, accuracy, and flexibility. These cannot be optimized independently, and improving one usually costs another.

Two claims recur throughout. First, every hardware design decision is a trade-off that only resolves once the workload is fixed; a choice that is right for a large brain-simulation machine can be wrong for a sensor that wakes a few times a second. Second, in a digital neuromorphic processor the energy budget is set by memory and communication, not by arithmetic. The memory section makes the second claim quantitative.

The chapter works through the design axes in order: the substrate, the array template, the scale regime, time-multiplexing, the event-driven datapath, spike representation, the network-on-chip, memory, hardware acceleration, and software and mapping. The aim is a working method: given a processor, identify the axes its designers chose and predict the consequences for a given application.

One caveat belongs up front. The field has not agreed on whether spiking neural networks and neuromorphic hardware are inherently more efficient than conventional accelerators. That question runs underneath the whole chapter, so each section ends with a short *Where the field disagrees* note that states the strongest opposing view. The SENeCA architecture serves as a running example, traced across its three generations, so that the axes attach to one concrete design [@tang2023seneca].

(sec:substrate)=
## The substrate decision: digital, analog, or mixed-signal

The substrate is the physical medium that implements neurons and synapses: analog, digital, or mixed-signal circuits. The choice fixes three things that are hard to change later: the numerical precision the hardware can hold, the effort needed to move the design to a newer process node, and the maturity of the programming tools.

Analog circuits store neuron and synapse variables as physical quantities, usually a voltage, charge, or current, and let device physics do the computation. Summing currents on a wire is, in effect, a free addition, which is why analog neurons are small and low-power. The cost is that the computation depends on the exact behavior of the transistors: fabrication mismatch between nominally identical devices, together with thermal and shot noise, enters the result directly, and moving to a smaller node usually means redesigning the analog blocks rather than recompiling them. Digital circuits store the same variables as binary numbers and compute with logic gates. They spend more area and energy per neuron, but the result is exact and repeatable, the design can be synthesized, reconfigured, and reused as an IP block, and it inherits the gains of each new process node with little extra work. Most processors that have actually been deployed are digital for these reasons.

Mixed-signal designs sit between the two. The common form today is in-memory computing on a resistive crossbar: synaptic weights are stored as device conductances, and one analog step, Ohm's law followed by Kirchhoff current summation, performs a full multiply-accumulate inside the memory array, which is then wrapped in digital logic for control and readout. In principle this combines analog density with a digital interface; in practice the precision of the array and the cost of converting its outputs back to digital set the real limits, a point taken up in {ref}`sec:memory`.

A note on expectations: although *neuromorphic* is often read as *analog*, the deployable processors today are digital or mostly digital, and digital logic is also the most convenient host for adding analog or in-memory blocks later.

### Where the field disagrees

Whether analog is the better long-term substrate is unsettled. Advocates argue that fully parallel analog computation removes two costs digital systems cannot escape: the clocking and synchronization overhead, and the energy of moving operands to and from memory. The standard objection is precision. Analog in-memory systems typically resolve only three to four decimal digits, drift over time, and vary from device to device, so they need calibration or training that keeps the chip in the loop [@bocquet2020embracing]. A third position treats this unreliability as a resource rather than a defect, and designs algorithms that tolerate or exploit device noise [@bocquet2020embracing]. The camps disagree less about the measurements than about how much error is acceptable, which is why the question stays open.

(sec:array-template)=
## The dominant template: an array of tiny processors plus a network-on-chip

Almost every scalable digital neuromorphic processor uses the same construction: many small cores, each with its own local memory and compute, connected by a network-on-chip (NoC). The pattern recurs across chips that otherwise share little, including Loihi, TrueNorth and NorthPole, SpiNNaker, NeuronFlow, AKIDA, and SENeCA [@merolla2014million; @moreira2020neuronflow; @davies2021advancing; @tang2023seneca]. It mirrors the decentralized organization of cortical tissue, where computation and storage are not separated.

The core is the neuron substrate and the NoC is the axon substrate. Keeping each core's memory next to its compute is the central efficiency argument against the von Neumann organization, in which operands travel back and forth to a separate memory.

> **[Figure placeholder: the shared template across several real chips.]** Side-by-side block diagrams of Loihi, TrueNorth, SpiNNaker, and SENeCA, highlighting the common tiled-core-plus-NoC pattern.

Scalability then comes cheaply, because adding cores adds compute and memory together. The difficulty moves elsewhere, into mapping (placing neurons and layers onto cores) and load balancing. Mapping is therefore a hardware concern as much as a software one, and {ref}`sec:software-mapping` returns to it.

### Where the field disagrees

The template is near-universal, but its justification is contested. The sharpest counterexample is that a highly connected cortical model can run faster and at lower energy on a single GPU than on SpiNNaker or a CPU cluster, with energy per synaptic event reported as up to fourteen times lower on the GPU [@knight2018gpus]. If a commodity dense accelerator can win on a workload that looks neuromorphic, the tiled array is a choice to be justified per application rather than an automatic default. What the tiled array trades on is sparsity and scale, which the next two sections examine; where those are absent, its overheads can lose to a GPU or a plain accelerator.

(sec:scale-regime)=
## Scaled-up systems versus the extreme edge

The array template was designed for scale, and its advantages do not transfer automatically to a tiny chip running a tiny network. This gap is the central practical tension of the chapter.

At large scale the template works well because memory and compute are distributed, so there is no shared bottleneck: each added core brings capacity, bandwidth, and parallelism at once. Systems in the SpiNNaker and Loihi class reach brain-simulation scale, spread load across many cores, and gain event-driven power savings that grow with sparsity. The extreme edge is a different regime: thousands of neurons rather than millions, power budgets of a milliwatt or less, silicon area set by unit cost, and often a single sensor as the only input.

The underlying exchange is that neuromorphic hardware spends silicon area to buy power efficiency. Per-neuron memory, parallel cores, routing tables, and the event-handling logic all occupy area, and at the extreme edge area is the dominant cost. Parallelism also delivers high throughput, but an edge application rarely needs maximum throughput; it needs to meet the sensor rate and the deadline. A small clocked accelerator that finishes inside the frame budget and then sleeps can meet the same requirement at lower area and cost.

:::{admonition} Why event-driven processing on a tiny chip?
:class: tip
The per-event control overhead that is negligible at scale becomes the dominant cost when each event touches only a handful of neurons. This is the small-workload trap, observed directly in the SENeCA project: the event-driven machinery has a fixed cost per event that a small network cannot amortize [@tang2023open]. The cases that still justify event-driven processing at the edge are specific: always-on workloads whose input is silent most of the time, such as keyword spotting and wake-up detection; latency-critical sparse sensors such as event cameras; and designs where the wake-up cost and sleep-state leakage of a clocked alternative would eat the savings it promises.
:::

So *neuromorphic is for the edge* is a slogan rather than an analysis. The defensible version is conditional: event-driven processing pays off at the edge when activity is genuinely rare and the network is large enough to amortize the event machinery. Outside that regime a conventional tiny accelerator can win on both cost and energy.

> **[Figure placeholder: scale-regime map.]** Input activity rate and network size on the two axes, with marked regions where event-driven, clocked, or hybrid designs win.

### Where the field disagrees

One result sharpens the warning: spiking models often need very high activity sparsity, around ninety-three percent or more, before they beat an equivalent artificial neural network, and once the energy per spike per synapse is counted, the advantage can disappear [@yan2024reconsidering]. At the extreme edge, where networks are small and not always sparse, this threshold is easy to miss. Recent reviews take a more measured position: neuromorphic hardware complements GPU-based deep learning on sparse, event-driven workloads and underperforms on dense ones, so the useful edge question is about a workload's sparsity and timing structure, not about a brand of hardware [@muir2025road].

(sec:time-multiplexing)=
## Time-multiplexing versus physical parallelism

A single physical core can stand in for many logical neurons by reusing its datapath over time. This is possible because silicon switches millions of times faster than a biological neuron fires, so one datapath can update many neurons in sequence within a single time step.

Designs fall on a spectrum from fully parallel, through partially parallel, to fully time-multiplexed, where one datapath updates one neuron per step. The governing parameter is the multiplexing ratio, the number of logical neurons served per physical datapath. A higher ratio improves area efficiency and lowers communication overhead; a lower ratio improves throughput, latency, and energy efficiency. The area saving grows when the neuron model is expensive, because one costly datapath is amortized across more neurons.

The multiplexing ratio therefore sets both the largest network a core can hold and the latency it can reach, and it should be chosen per application. This connects directly to the scale regime: at the extreme edge, a high multiplexing ratio is how a design recovers the area it spent on dedicated per-neuron resources.

> **[Figure placeholder: one core at two multiplexing ratios.]** The same core shown fully parallel and fully time-multiplexed, with maximum neurons-per-core and per-inference latency moving in opposite directions.

### Where the field disagrees

Advocates of fully parallel analog and in-memory computing regard time-multiplexing as the compromise itself, because reusing one datapath reintroduces the sequential, memory-fetch-bound behavior that neuromorphic computing set out to avoid. On that view time-multiplexing is the pragmatic digital answer, and its price is exactly the serialization the analog camp objects to.

(sec:event-driven)=
## The event-driven datapath and sparsity exploitation

An event-driven core does work only when an event arrives and idles otherwise, so that power tracks activity rather than wall-clock time. In this event-proportional model an idle core draws almost nothing and energy scales with the number of events processed.

The datapath has three stages [@tang2023open]. In the synaptic process the core optionally applies a delay, reads the relevant weights, computes the addresses of the neurons the event affects (which is where convolutional connectivity is expanded), and, if on-device learning is enabled, updates weights. In the neuron process the core updates the affected neuron states; this is the step that decides efficiency, and it can be fully parallel, partially parallel, or fully time-multiplexed. In event generation the core forms address-event-representation (AER) packets from the addresses of the neurons that fired, reading the axon memory to find their targets, and optionally compresses the packets, feeds them back for recurrence and learning, applies delays for skip connections, and folds in pooling.

> **[Figure placeholder: the three-stage event pipeline.]** Synaptic process, neuron process, and event generation, with the memory each stage touches.

Two quantities decide the outcome. Activation sparsity, the fraction of neurons active at any moment, is the main lever; in cortex it sits around one to ten percent, and this low activity is what the event-driven datapath exploits. Weight sparsity, the fraction of zero weights, is a separate and harder problem. Operation density, the number of operations performed per delivered packet, determines whether data movement or computation dominates the energy.

The energy savings are large on naturally sparse signals such as audio and event-based vision. But the per-event overhead is a floor: for a small workload that floor dominates and removes the benefit. An interactive energy calculator, built on measured SENeCA per-instruction and per-component costs, lets a reader watch the sparsity-dependent synaptic term fall toward the sparsity-independent neuron-update floor [@tang2023open].

### Where the field disagrees

The clean theory of event-proportional power meets a messier measurement record. A recent reassessment shows that event handling, memory access, and instruction control are routinely left out of efficiency claims, so reported SNN advantages are often optimistic [@yan2024reconsidering]. The amount of usable sparsity is also disputed: the one-to-ten-percent figure from cortex is often quoted, but reaching high sparsity in a trained deep network usually requires explicit regularization, which can cost accuracy and move the energy break-even point.

(sec:spike-representation)=
## Spike representation: binary versus graded spikes

The amount of information a single spike carries is a design choice that affects both accuracy and bandwidth. A binary spike carries one bit: the synapse simply accumulates its weight, with no multiplication. A graded, or valued, spike carries a number, which costs a multiplication and more bits per packet but can reach the same accuracy with far fewer spikes.

The industry has moved toward graded spikes: the second-generation chips, including Loihi 2, NorthPole, and SpiNNaker 2, all adopted them [@davies2021advancing]. The choice trades NoC bandwidth and multiplier cost against spike count and accuracy, and a flexible core can support either, which is one more argument for flexibility. It also feeds back into the edge question: binary events are the cheapest per event, but if a small network needs many of them to stay accurate, the saving disappears.

### Where the field disagrees

Beneath the binary-versus-graded choice lies the older debate between rate and temporal coding. Rate coding, which represents a value by a spike count over a window, is robust but needs many time steps and redundant spikes, raising both latency and energy. Temporal codes such as time-to-first-spike claim much lower latency at similar or better accuracy. The question is open: some work reports ninety-three percent CIFAR-10 accuracy in a single time step [@chowdhury2021one], while common rate-coded pipelines still use one hundred to two hundred. Because the time-step count multiplies energy directly, this coding choice can outweigh the binary-versus-graded one, which is why the two are best considered together.

(sec:noc)=
## The network-on-chip: communication and its real cost

Because cores share a limited set of physical wires, a spike cannot travel as a bare electrical pulse; it travels as a routed packet that carries the identity of its source. This is address-event representation (AER). Physical wires cannot be added after fabrication, so connectivity is virtualized: the shared links are time-multiplexed to emulate the dense connections of a network. Routing can be destination-based or source-based, the latter used by SpiNNaker, and multicasting handles fan-out, where one source must reach many targets.

:::{admonition} The real cost of the NoC is memory, not bandwidth
:class: note
Across NeuronFlow, Loihi, SpiNNaker, Epiphany, and SENeCA, the NoC has not been the performance or energy bottleneck, because operation density is high enough that moving a packet is far cheaper than processing it. The cost that does bite is memory. Routing tables can be large: TrueNorth uses twenty-six bits per neuron to encode a single destination [@merolla2014million], and in NeuronFlow the routing table occupies about a quarter of on-chip memory [@moreira2020neuronflow]. Source-based routing shrinks these tables for structured networks and makes multicast cheap.
:::

The guideline is to keep the NoC itself simple but to budget deliberately for routing-table memory, which is an easily overlooked area and energy cost. That budgeting leads directly into the memory section.

### Where the field disagrees

The claim that the NoC is never the bottleneck holds only for certain workloads. In large-scale brain simulation, with very high fan-out and low operation density per packet, communication and its routing memory can dominate, which is part of why SpiNNaker invested so heavily in its routing fabric. The accurate statement is conditional: for inference workloads with high operation density the NoC is cheap, whereas at biological connectivity and scale communication has been found to be a first-order cost.

(sec:memory)=
## Memory is the real challenge

In a distributed near-memory processor, on-chip memory dominates both area and energy, which makes memory organization the central design decision rather than an implementation detail. This section is the analytical core of the chapter, and most of the axes seen so far reappear here [@yousefzadeh2025memory].

The key point is that bringing compute next to memory does not remove the memory wall; it moves it. The tiled, near-memory template ends the von Neumann pattern of shuttling operands to and from a distant main memory, and at the system level it works. Inside a single core, though, the local memory becomes the limiting resource. SRAM today, and non-volatile alternatives such as STT-MRAM in the near future, dominate the per-inference area and energy. The wall has not disappeared; it now sits between the datapath and the on-chip memory a short distance away [@yousefzadeh2025memory].

It is worth seeing where the bits go. A digital neuromorphic core spends its memory on five things: synaptic weights, neuron states, the routing tables that virtualize connectivity over the NoC, the instruction and control memory that drives the datapath, and the axon memory that lists each neuron's outgoing connections. Against these, the arithmetic is small. A single inference spends far more energy reading and writing state than computing on it.

The clearest example is the neuron-state growth of convolutional networks. A neuromorphic core allocates state memory per neuron, so a convolutional layer, where one small filter is reused across a large feature map, behaves very differently than on a conventional DNN accelerator. The accelerator stores only the shared filter weights; the neuromorphic core stores a state for every neuron in every feature map, and the neuron count far exceeds the parameter count. On SENeCA this gap reaches about two orders of magnitude, roughly two hundred times more memory for the same network [@yousefzadeh2025memory]. CNN deployment on neuromorphic hardware is therefore a memory problem before it is a compute problem.

Memory placement is itself a design lever. The same value costs very different amounts depending on where it is stored: a register-file access is cheap but the register file is small, while SRAM scales but every access costs more. The SENeCA loop controller is a concrete case. Keeping the inner-loop instruction stream in a small dedicated store next to the compute elements, instead of re-fetching it from general SRAM each iteration, lowers both the energy and the latency of control [@tang2023seneca]. Choosing what to keep in registers, what to keep in local SRAM, and what to regenerate on demand is one of the highest-leverage decisions in the design.

Several techniques reduce the footprint directly; {ref}`sec:software-mapping` covers them in detail. Depth-first inference consumes activations as they are produced instead of storing a whole layer, which cuts activation memory by orders of magnitude. Spike grouping updates a neuron state once for several events that target it, removing redundant reads and writes. Weight and event compression shrink the two largest stores. None of these change the silicon; they save energy by moving and storing fewer bits.

Non-volatile memories (PCM, RRAM, MRAM, FeRAM) are a longer-term lever for density and for eliminating standby leakage, which matters for an always-on device. Their limitations are equally concrete: device-to-device variation, costly writes, and limited precision remain unsolved, and any one of them can cancel the density gain for a given workload [@yousefzadeh2025memory].

This reframes the rest of the chapter. Unless memory organization is treated as a first-order problem, a digital neuromorphic processor can lose the edge-efficiency advantage that motivates it. A useful test for every other design decision is whether it moves or stores fewer bits; a decision that does neither is unlikely to change the energy number that matters.

> **[Figure placeholder: the motivating energy breakdown.]** Energy of a single inference split into compute, memory access, and communication, showing that memory access dominates arithmetic. The interactive energy calculator from {ref}`sec:event-driven` is a live version of this figure [@tang2023open].

### Where the field disagrees

The strongest objection is that analog in-memory computing removes the memory wall entirely by performing the multiply-accumulate inside the memory array, so weights never move. The counterpoint, increasingly well documented, is that the wall returns at the array boundary: in crossbar in-memory accelerators the analog-to-digital converters and supporting peripheral circuits typically consume sixty to eighty percent of both energy and area [@ibrayev2024pruning], and wire parasitics limit how large a usable crossbar can be. The disagreement is about where the memory wall sits, not whether it exists. Both digital measurements and in-memory results point the same way: data movement and data conversion, not arithmetic, are the dominant cost in every substrate.

(sec:acceleration)=
## Adding hardware acceleration without losing programmability

A productive way to build an efficient core is to start from a flexible one and add dedicated datapaths only for the kernels that dominate the workload. The design space runs from fully programmable cores (RISC-V, ARM) at one end to fixed-function neuro-synaptic datapaths at the other, with programmable-microcode designs in between.

:::{admonition} Dedicated is not automatically faster
:class: warning
Flexible commercial CPUs and GPUs have beaten domain-specific accelerators when their flexibility allowed a better algorithm. A dedicated core wins only when the application matches the hardware closely. The energy comparison between Loihi and SENeCA is a clear illustration of how much the result depends on the workload.
:::

The SENeCA generations show the incremental approach [@tang2023seneca]. The first generation pairs a RISC-V core with the NoC: flexible but slow. The second adds Neural Processing Elements, vector units that accelerate the vector-matrix and convolution kernels. The third adds a loop controller that takes over fine-grained control, giving a three-level control hierarchy of general core, loop controller, and compute elements. Number formats are part of the design: BF16 and integer representations trade dynamic range and overflow behavior against cost in the neuron states and partial sums. A useful reference point is that even floating-point arithmetic costs about ten times less than a memory access [@tang2023open], which is why accelerating arithmetic in isolation yields little. The resulting rule is to place accelerators on the dominant kernels, namely vector-matrix and convolution, and to leave pre- and post-processing on the general core.

Such a design can close most of the gap to a fixed-function chip while remaining reprogrammable, but it pays in two ways: silicon area, and toolchain effort. Every custom datapath or instruction needs compiler support, and without it development falls back to hand-written assembly.

### Where the field disagrees

Benchmark claims for dedicated neuromorphic chips are contested. Independent analyses find that Loihi offers little or no advantage, and sometimes a deficit, on feed-forward networks, while showing very large gains, reported as up to a thousand to ten thousand times lower energy, on recurrent and temporally structured workloads [@davies2021advancing; @ostrau2022benchmarking]. The claim that *neuromorphic is more efficient* is therefore empty until the workload is named. The flexible, incremental approach has its own cost: it rarely reaches the absolute best efficiency on a fixed benchmark, which a fully dedicated design can. Whether that trade is worth it depends on how quickly the target algorithms are expected to change.

(sec:software-mapping)=
## Software and mapping as first-class hardware design

On a flexible architecture, mapping and software optimization are part of hardware design, because they realize performance the silicon has already paid for. Three techniques make this concrete. Spike grouping updates the same neuron states once for several events that target them, removing redundant memory reads and writes and roughly halving energy and latency in measured results [@tang2023seneca]. Event-driven depth-first convolution fuses layers so that activations are consumed before they accumulate in memory, saving activation memory by orders of magnitude and lowering latency, instead of dedicating memory to every neuron of a CNN [@yousefzadeh2025memory]. Hard-attention processing for high-resolution event vision uses a small network to locate regions of interest and further networks to process them at full resolution, with the flexible core handling the pre- and post-processing; it improves energy and latency without losing accuracy.

Quantization and sparsification are the baseline hardware-aware optimizations, reducing the bits per weight and the number of nonzero operations respectively. The broader point is that mapping choices change a platform's effective KPIs as much as silicon changes do, so a platform's performance is only meaningful together with its mapping strategy. This is the strongest practical reason to keep the core flexible.

### Where the field disagrees

There is broad agreement that algorithm-hardware co-design is necessary, but not on who should own it. One camp exposes the hardware: the SENeCA instruction set and energy model were published so that algorithm designers could optimize against them directly [@tang2023open]. Another hides the hardware behind a high-level, example-based programming model, and argues that this abstraction is the missing piece for commercial adoption [@muir2025road]. The two positions disagree on how much of the mapping a user should see, and both have merit.

(sec:synthesis)=
## Synthesis: a design-decision to consequence map

The lasting value of the chapter is a method, not a catalog of chips. The method fits in one table that maps each design axis to the KPIs it most affects and marks whether the axis is still contested.

> **[Table placeholder: design-decision to consequence map.]** One row per design axis (substrate, array template, scale regime, multiplexing ratio, event-driven versus clocked, spike representation, NoC routing, memory organization, degree of acceleration, mapping strategy) and one column per KPI (latency, energy per inference, area and cost, maximum model size, accuracy, flexibility). A final *contested?* column points to the *Where the field disagrees* note in the matching section, so the table also marks what is settled and what is still argued.

> **[Figure placeholder: SENeCA across three generations.]** One application traced through the design decisions, using the SENeCA numbers as the spine: about 7000 microseconds and 34 microjoules per inference in the first generation, about 1100 microseconds and 7 microjoules in the second, and about 550 microseconds and 3 microjoules in the third, so the KPIs can be seen moving as decisions are made [@tang2023seneca].

The practical guidance from building SENeCA reduces to a short checklist:

- Start flexible, and specialize only where measurement justifies it.
- Keep the NoC simple, and budget for routing-table memory.
- Match the multiplexing ratio to the workload.
- Add accelerators incrementally, and only for the dominant kernels.
- Separate control from computation.
- Treat memory organization as the first-order problem.
- Exploit event sparsity in software, where the gains are nearly free.

> **[Sidebar placeholder: how to read a datasheet.]** For a vendor specification sheet: which numbers reveal a design decision, which depend on an unstated workload, and which are marketing.

(sec:outlook)=
## Open challenges and outlook

Several parts of the template are still weak, and naming them helps a designer deploy with realistic expectations.

The small-workload overhead is the first: when an event updates only a few neurons, the per-event control cost on the general core dominates even when accelerators are present, so dedicated control accelerators are a promising direction. New model families are the second: transformers and on-device learning will require accelerator blocks and execution models beyond today's focus on spiking and convolution. Weight sparsity is a third: it remains hard to exploit on synchronous vector units and is still an open problem. The memory wall is the long-horizon theme, where new memory technologies, 3D integration, shared-memory mappings, and in-memory and in-material processing are the available levers, each carrying the precision and conversion-overhead caveats discussed in {ref}`sec:memory` [@yousefzadeh2025memory; @ibrayev2024pruning].

The field also still lacks a workload where neuromorphic hardware wins decisively, and its compilers, mappers, and debuggers remain far behind the CUDA and TensorFlow ecosystems, which several reviews identify as the real barrier to adoption [@muir2025road]. On that reading, improving the toolchain may matter more than any single architectural advance.
