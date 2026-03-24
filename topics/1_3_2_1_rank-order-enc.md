(chapter:rank-order-enc)=

# Rank order encoding

Rank Order Encoding (ROE)[@Thorpe.Gautrais-1998-RankOrder] is an alternative
to temporal and rate encoding schemes, providing a balanced compromise between
information capacity, richness of representation, and interpretability.
In ROE, neurons are assumed to produce at most a single spike during a unit
period of time. While this is similar to some timing-based encoding schemes
(such as latency-based encoding), in ROE the key aspect is the _order_ in
which spikes arrive at the post-synaptic neuron, rather than the exact
arrival time.

## Formulation

Consider a post-synaptic neuron connected to $m$ pre-synaptic neurons.
The activation of the post-synaptic neuron at time $t$ (denoted as $A(t)$ below)
depends on the weighted _order_ of arrival of input spikes from the pre-synaptic
neurons:

$$
A(t) = \sum_{{j}\in{[0,m)}}{\left(w_{j}~m^{o(s_{j})}\right)},
$$

where ${m}\in(0,1)$ is a modulation factor (we will circle back to that later)
and $o_{s_{i}}\in[0,m)$ is the (integer) order of arrival of spike $s$ from
pre-synaptic neuron $j$.

By way of example, let the constant modulation factor be $0.9$.
Then, the first spike that arrives at the post-synaptic neuron is assigned order
$0$, and its contribution is $w_{0} \times~1~(=0.9^{0})$, which is just $w_{0}$.
The next spike is assigned order $1$, and its corresponding weight $w_{1}$
is scaled by the modulating factor $(0.9)^{1} = 0.9$. The next spike contributes
$w_{2}\times~0.81(=0.9^{2})$, and so forth for the remaining spikes, each
contributing a progressively smaller fraction of their corresponding weights.
In this way, the maximal possible activation of the post-synaptic neuron is
achieved only when the spikes arrive in the order that maximises the
contribution of the respective weights. If a pre-synaptic neuron does not spike,
the input order for that neuron is considered to be $+\infty$, effectively
setting the contribution of that neuron to $0$.

## Neuron threshold

An interesting feature of ROE is that the post-synaptic
neuron's spiking threshold is set relative to the maximal possible activation
determined by the weighted spike order as defined above.
By adding an appropriate threshold, the post-synaptic neuron can act as a
filter that is sensitive to the similarity of the input reflected in the
order of arrival of the input spikes. Here, an 'appropriate' threshold means
that it is attuned to the maximal possible activation of the neuron as
defined above. Setting the threshold to a value closer to the maximum means that
the neuron will act as a very narrow filter, spiking only when the spike order
is close to the optimal. For instance, a permutation that swaps the order of
two input spikes could substantially reduce the respective contributions
of those spikes towards the activation of the post-synaptic neuron.
Conversely, a lower threshold would allow the
neuron to 'admit' inputs that are further from the optimal order.

The formulation of the threshold might seem unintuitive at first since it is set
as a fraction of the maximal activation, which in turn depends on the input
weights. However, this is not a problem in practice - the weights change during
training, the threshold would also change proportionally.

An example of a neuron using ROE is given in Fig. [1](#fig-ROE).
Only a small fraction of the random permutations make the activation cross
the threshold, and even then the it happens towards the end,
when most of the weights have been activated.
Therefore, this neuron would be considered very sensitive to the
order of its input spikes. In this case, the order in which the weights
are activated must be very close to the optimal, and the post-synaptic neuron
must wait until the very last input spike in order to make a 'decision'
about whether to produce spike.
Setting the threshold to a smaller fraction of the maximal activation would
allow the neuron to be less sensitive to the order of input spikes and 'admit'
more diverse inputs.

```{figure} chapter1/assets/plots/rank-order-encoding.png
:alt: Rank Order Encoding
:name: fig-ROE

An example of Rank Order Encoding for a single neuron with 16 pre-synaptic
neurons. The green line represents the maximal activation achievable
when the input spikes arrive exactly in the order of decreasing synaptic
weights (the largest weight is activated first, the next largest weight is
activated second, and so forth). The bundle of faint lines represent random
inputs (spikes arriving in random order), with the solid red line and bars
representing their mean and standard deviation. The dashed orange line is the
threshold, which is set to 90% of the maximal activation.

```
