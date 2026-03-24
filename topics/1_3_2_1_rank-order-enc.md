(chapter:rank-order-enc)=

# Rank order encoding

Rank Order Encoding (ROE)[@Thorpe.Gautrais-1998-RankOrder] is an alternative
to temporal and rate encoding schemes, providing a balanced compromise between
information capacity, richness of representation, and interpretability.
The core tenet of ROE is that the important aspect of spikes is the _order_
in which they arrive at the postsynaptic neuron, regardless of the exact
timing or of spike generation at the source neuron or arrival time at the
target neuron.

## Formulation

Consider an efferent (post-synaptic) neuron connected to $m$ afferent
(pre-synaptic). The activation of the efferent neuron at time $t$
(denoted as $A(t)$ below) depends on the weighted _order_ of arrival of
input spikes:

$$
A(t) = \sum_{{j}\in{[0,m)}}{\left(w_{j}~m^{o(s_{j})}\right)},
$$

where ${m}\in(0,1)$ is a modulation factor (we will circle back to that later)
and $o_{s_{i}}\in[0,m)$ is the (integer) order of arrival of a spike $s$ from
input neuron $j$.

By way of example, let the constant modulation factor be $0.9$.
Then, the first spike that arrives at the afferent neuron is assigned order
$0$, and its contribution is $w_{0} \times~1~(=0.9^{0})$, which is just $w_{0}$.
The next spike is assigned order $1$, and its corresponding weight $w_{1}$
is scaled by the modulating factor $(0.9)^{1} = 0.9$. The next spike contributes
$w_{2}\times~0.81(=0.9^{2})$, and so forth for the remaining spikes, each
contributing an increasingly reduced amount of their corresponding weights.
In this way, the maximal possible activation of the afferent neuron is achieved
only when the spikes arrive in the order that maximises the contribution of the
respective weights. If an efferent neuron doesn't spike, the input order for
that neuron is considered to be $+\infty$, effectively setting the contribution
of that neuron to $0$.

## Neuron threshold

An interesting feature of the rank order encoding is that the afferent neuron's
spiking threshold is set relative to the maximal possible activation defined
by the weighted spike order above. By adding an appropriate threshold, the
neuron can act as a filter with a different degree of sensitivity to the input
order. Here, 'appropriate' means a threshold that is attuned to the maximal
possible activation of the neuron as defined above. Setting the threshold closer
to the maximum means that the neuron will act as a very narrow filter and
spiking only when the input order is close to the optimal. Conversely, a lower
threshold would allow the neuron to 'admit' inputs that are further from the
optimal order.

The formulation of the threshold might seem awkward at first since it is set as
a percentage of the maximal activation, which in turn depends on the input
weights. However, this is not a problem in practice - the weights change during
training, the threshold would also change proportionally.

An example of a neuron using ROE is given in Fig. [1](#fig-ROE).
Only a small fraction of the random activations cross the threshold, and even
then the it happens towards the end, when most of the weights have been
activated. Therefore, this neuron would be considered very sensitive to the
order of its inputs since it effectively has to wait until the very last input
spike in order to make a 'decision'.
Setting the threshold to a lower percentage of the maximal activation would
allow the neuron to be less sensitive to input order and 'admit' more inputs.

```{figure} chapter1/assets/plots/rank-order-encoding.png
:alt: Rank order encoding
:name: fig-ROE

An example of rank order encoding for a single neuron with 16 afferent neurons.
The green line represents the maximal activation achievable when the inputs
spikes arrive exactly in the order of decreasing synaptic weights, in other
words, the largest weight is activated first, the next largest weight is
activated second, and so forth. The bundle of faint lines represent random
inputs (spikes arriving in random order), with the solid red line and bars
representing their mean and standard deviation. The dashed orange line is the
threshold, which is set to 90% of the maximal activation.

```


