(neuron)=
# What is a neuron?

---
Artificial intelligence (AI) as a field was born from the drive to understand
and model key functions of biological nervous systems.
The neuromorphic field draws inspiration from the same source, with the added
goal of modelling the computational aspects of the brain much more closely
than the currently dominant AI approach - **deep learning**.

The core functional element of a nervous system is the **neuron**, which
Wikipedia defines as follows [@enwiki:1362551640]:

`An excitable cell that fires electric signals called action potentials across a
neural network in the nervous system.`

Neurons are cells that specialize in processing input stimuli from the
environment and producing signals of their own (known as **action potentials**
or **spikes**).
These processes, known as **encoding** and
**decoding** [@DayanAbbott_2001_TheoreticalNeuroscience], can be modelled using
various algorithms, some of which are covered in [](#chapter:encdec).
Models of spike-based processing are covered in [](#spiking).

Neurons come in many different shapes and display a variety of activation
patterns.
At the sensory (or **afferent**) end of the nervous system,
biosensors (such as the eye and the ear) serve as interfaces to the world,
allowing an organism to perceive and manipulate its environment.
Inside those biosensors, populations of specialized neurons inside serve
the function of converting raw stimuli into spikes that the rest of the
nervous system can understand.
For instance, in the eyes of most mammals, this function is carried out by
the **retina** - a layered set of at least five major types of neurons that
convert light into spikes.
Similarly, the **cochlea** inside the ear contains neurons that convert
sound into spikes.
All biological organisms have some mechanisms of sensing their
environment, although those mechanisms do not necessarily involve
a nervous system.
For instance, while single-celled organisms can sense the presence
of chemicals (such as food or toxins), they do so without the help
of a any neurons.

At the motor (or **efferent**) end of the nervous system, there are
neurons that deliver command spikes to various organs, such as muscles, glands
and internal organs. Efferent neurons provide the mechanism for moving
the body, reacting to stimuli and deliberately manipulating the environment.

Afferent and efferent neurons together form the **peripheral** nervous system.
In contrast, neurons in the **central** nervous system are responsible for
higher-order processing of all incoming spikes and producing other spikes
that can be interpreted as commands by different organs and tissues, such as
muscles, glands and internal organs.
This makes the central nervous system the "control center" of the body.

Altogether, the human brain has more than **80 billion neurons**, which
communicate with each other via electrically conductive connections known as
**synapses**, which are in excess of **100 trillion** in the human brain
[@Azevedo-2013-AutomaticIsotropic].
On average, each neuron connects to about **7000** other neurons,
creating biological **neural networks** which artificial and spiking neural
networks are modelled after.

Apart from neurons, our brain also has a number of other
types of cells, such as **glial cells**, which perform
various maintenance functions necessary to maintain a healthy brain.
Neurons are excitable cells that enable thought, sensation, perception,
movement, reasoning, speech, vision and other functions.
In contrast, glial cells support, protect, and nourish neurons by
forming **myelin** and participating in the brain's immune defense.

In this chapter, we will cover different types of  biological neurons and
glial cells. Also, as this is the first chapter, we will define
the notations for the neuron's stateful characteristics and variables,
which we will consistently use throughout the rest of this book.
