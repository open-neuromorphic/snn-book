---
authors:
  - name: Andrew Rowley
    affiliation: University of Manchester
    email: Andrew.Rowley@manchester.ac.uk
---

(chapter:toolchain)=
# The Neuromorphic Compilation Toolchain

If you were making your own neuromorphic (or any) hardware, an important consideration for user adoption is the software that goes with it.  Most users will not want to have to think about the low level details of how their problems map on to hardware.  Additionally, they may not know enough of those details to make the best use of the hardware.  The neuromorphic toolchain that you provide gives you the opportunity to apply your own deep knowledge to optimise the use of the hardware on the users' problems.  This is akin to providing a code compiler for a given hardware architecture, which can take the user's higher level description and convert it into optimised machine code.

In this chapter we will look at some of the common features of the toolchains that are provided for neuromorphic computing devices.  Examples will be drawn from two systems that the author is most familiar with; one being the digital system SpiNNaker, and the other being the analogy system BrainScaleS.  There are, of course, many different systems, but these have been chosen as archetypes due to being some of the first such systems to demonstrate the potential to scale up the size of the networks that can be run on the hardware.  Operating at scale is where a toolchain becomes particularly critical, as it becomes increasingly hard to manually manage all parts of the hardware as the amount of it you need to use gets bigger.  In the description I will often mention processing, which is slightly biased towards digital systems; analog systems could still be considered to be processing the inputs though, just in a different form.  In any case I ask for forgiveness in advance for this terminology, but it will also reduce the verbosity somewhat.

We begin by looking at the mapping of general problems on to the hardware.


## Mapping

Neuromorphic hardware, being brain inspired, often consists of multiple repeating small processing elements with a network between them that can be programmed to specify the connections between those elements, that is, the communication that is required.  In a spiking neural network, this is the processing of the neurons and the transfer of spikes between the neurons.

The user will want to specify their network as groups of neurons in some form, with some connections between then, be that as layers which might be fully connected or have convolutional connectivity, or as specific Populations with Projections between them.  The first nob of the mapping process is then to split up the neural processing work over the elements of the system.  This is often called partitioning of the problem.