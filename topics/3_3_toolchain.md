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

The user will want to specify their network as groups of neurons in some form, with some connections between then, be that as layers which might be fully connected or have convolutional connectivity, or as specific Populations with Projections between them.  The first step of the mapping process is then to split up the neural processing work over the elements of the system.  This is often called partitioning of the problem.  This makes units that are of a size that each can be represented within one of the elements of the hardware, but it doesn't necessarily allocate specific elements yet.  This allows the user to approximate how much hardware is then required for the problem.

Many hardware platforms are of the scale that they can support multiple users simultaneously using different parts of a large system.  This might be through having several systems of different size or by having a large system that can be shared in some way.  Once the partitioning is done, the appropriately sized hardware unit or units can be allocated to the user using this information.  Usually it is wise to allocate a bit more hardware than the estimate requires.  Some systems may not have this flexibility, but at least at this point you can determine whether the user's problem will likely run at all or not, and avoid the user finding this out much later in the mapping process.

After an appropriate hardware unit is allocated, the elements of the hardware can now be selected for each of the sub units of the partitioning.  This is generally known as placement.  This will select the appropriate elements that best represent the partitions to be simulated. On digital hardware, this might be simple if all of the elements are the same.  On an analogue system this might attempt to match the requested parameters of the simulated neurons to the more naturally variable hardware elements, to make the simulation as accurate as possible.

There is in addition the potential to allow the user to constrain the placement specifically, so that certain partitions are placed on specific elements.  This is more often used in testing to arrange things in a way to test a case without having to make the problem too big.  More advanced users might also want to do this if they have some theories they would like to test out.

Placement may also have to account for some problem-specific constraints.  This could include elements of resource-sharing between partitions.  For example, on SpiNNaker, this is used where two or more partitions communicate using the SDRAM of a chip, and so must be placed on the same chip.  SpiNNaker 2 has a quad arrangement in addition to this, so this could also be a placement constraint.

Once it has been decided where things are going to be, it is then possible to ensure that elements that need to communicate are set up to do so.  Depending on the architecture, this may require some form of routing algorithm to run to work out how the traffic is moved from one place to another.  Once this is complete, the mapping will be done and the toolchain can next look at loading things on to the machine in preparation for execution.

Before we move on, it is worth considering that, although the mapping has been described like a sequence of events with no consequences, the way in which one algorithm works can clearly have an effect on those that follow it.  This is quite pronounced in the relationship between placement and routing, since the placement will determine, to some extent, how efficient routing can be.  This has been seen on SpiNNaker, where routing remains one of the biggest challenges in terms of speed of operation.  Thus it was decided to make a multi-stage routing algorithm, which can route between areas of the machine.  However this depends on the placement putting partitions on adjacent chips, reducing the choices that the placement algorithm can make.  This did reduce the routing time for a particularly large example from over three days to around one hour.

## Machine Control

Once it has been determined how the hardware is to be used, the software can now also be used to communicate with the hardware and control the simulation of the neural network.  This is a useful part of an integrated toolkit that handles all aspects of the hardware and avoids most users from having to consider the low level details.

As has already been mentioned, machine control may be required during the mapping process, in the form of allocating some hardware to be used.  This step is most useful if the actual current state of the hardware is read by the software, so that the exact elements available at this time are known.  Once this has been done, it may be possible to power down the machine to to perform the mapping process, and so save some additional power.  This will only work if the machine that comes back up when the power is restored is identical, as otherwise it is possible that partitions will be mapped to elements that are no longer available, requiring at best a correction, and at worst a restart of the whole mapping process.



