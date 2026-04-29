---
authors:
  - name: Petrut Bogdan
    affiliation: Innatera
    email: petrut.bogdan@innatera.com
---
(chapter:motivation)=
# Why should I care about hardware?

Knowing which hardware will be the deployment target is strictly necessary to understand which **operators** are available. Unlike the standardized world of CPUs and GPUs where operators are universally supported, neuromorphic hardware is fragmented. Currently, there is no standardisation between neuromorphic platforms; each supports a specific set of neuron models, synapse dynamics, and learning rules. Consequently, choosing a specific neuron model early in the design process might inadvertently lock you into a single hardware platform. Conversely, targeting a specific platform often constrains the modeling choices available to you. Understanding these constraints upfront is crucial for successful deployment.

Awareness of the target hardware allows you to **ablate** a larger model until you reach a suitable scale effectively. By understanding the resource limits—be it neuron count, synaptic memory, or connection density—you can systematically reduce a larger model to fit the target while maintaining performance. This process ensures that the deployed model is not just theoretically sound but also practically viable within the hardware's specific limitations. 

Ablation has the additional benefit of promoting understanding of how much "heavy lifting" your neural network is actually doing. By means of a hypoethetical, imagine you are creating a network to perform audio scene classification. In your algorithm design flow, you have chosen to use wavelet transforms as a preprocessing step for your audio before passing it to your neural network. You lock into this decision, and proceed to train and optimize your neural network to perform the classification task. You notice fantastic performance straight away with your arbitrary choice of 1000 neurons. If you were to perform an ablation study, you might notice that progressively halving the size of your network gives little to no loss of performance until you reach 62 neurons. This may suggest that your preprocessing is projecting the data to a space where the classes are linearly separable -- the preprocessing is doing the "heavy lifting". You may want to consider whether that is appropriate for your application.

:::{note}
**Ablation Studies**
The term "ablation" comes from the medical field (surgical removal of tissue) but in machine learning refers to removing parts of a model to assess their contribution.

It is recommended to run an ablation study to figure out how difficult your problem actually is and whether you are using an appropriate number of resources. This is particularly important in power-constrained domains or where energy efficiency is a key performance indicator.
:::

One must carefully balance **SNN resources vs. generic compute**. In sensor-edge applications performing inference on continuous temporal sensor output, the "neuromorphic" part of the chip is often just one component. Understanding the hardware tells you what kind of preprocessing you can afford to do on the accompanying conventional CPU or DSP cores. If the preprocessing is too heavy for the low-power generic compute available, the efficiency of the SNN accelerator becomes moot.

Knowing the **substrate and implementation methodology** of the target allows you to verify whether your model is resilient to physical constraints like component mismatch. Analog or mixed-signal neuromorphic platforms often have device-to-device variations (mismatch) that exact digital simulations traditionally ignore. If you know your target uses such a substrate, you must train or validate your model to be robust against these hardware-specific noise sources.

Finally, understanding **implementation inefficiencies** allows you to reason more precisely about encoding choices. For example, while rate encoding is a mathematically simple concept, on certain hardware architectures it can be disastrously inefficient in terms of power and bandwidth. Understanding how the hardware handles spike traffic allows you to concretely visualize why sparse temporal codes might be superior, moving beyond abstract theory to practical engineering necessity.

As soon as interoperability is more completely supported, then it is likely that some of the above reasons become not so strictly important (See chapter {ref}`chapter:interoperability`). Until that day comes, the burden of ensuring efficiency and correctness lies heavily with the algorithm designer. To navigate this implementation gap effectively, we cannot rely on intuition alone; we need a concrete language to describe the cost of our design decisions. We need specific **performance metrics**.

## Performance metrics 




