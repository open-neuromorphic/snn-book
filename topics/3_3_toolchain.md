---
authors:
  - name: Andrew Rowley
    affiliation: University of Manchester
    email: Andrew.Rowley@manchester.ac.uk
---

(chapter:toolchain)=
# The Neuromorphic Compilation Toolchain

If you were making your own neuromorphic (or any) hardware, an important consideration for user adoption is the software that goes with it.  Most users will not want to have to think about the low level details of how their problems map on to hardware.  Additionally, they may not know enough of those details to make the best use of the hardware.  The neuromorphic toolchain that you provide gives you the opportunity to apply your own deep knowledge to optimise the use of the hardware on the users' problems.  This is akin to providing a code compiler for a given hardware architecture, which can take the user's higher level description and convert it into optimised machine code.

In this chapter we will look at some of the common features of the toolchains that are provided for neuromorphic computing devices.  Examples will be drawn from two systems that the author is most familiar with; one being the digital system SpiNNaker, and the other being the analog system BrainScaleS.  There are, of course, many different systems, but these have been chosen as archetypes due to being some of the first such systems to demonstrate the potential to scale up the size of the networks that can be run on the hardware.  Operating at scale is where a toolchain becomes particularly critical, as it becomes increasingly hard to manually manage all parts of the hardware as the amount of it you need to use gets bigger.  In the description I will often mention processing, which is slightly biased towards digital systems; analog systems could still be considered to be processing the inputs though, just in a different form.  In any case I ask for forgiveness in advance for this terminology, but it will also reduce the verbosity somewhat.

We begin by looking at the mapping of general problems on to the hardware.


## Mapping

Neuromorphic hardware, being brain inspired, often consists of multiple repeating small processing elements with a network between them that can be programmed to specify the connections between those elements, that is, the communication that is required.  In a spiking neural network, this is the processing of the neurons and the transfer of spikes between the neurons.

The user will want to specify their network as groups of neurons in some form, with some connections between them, be that as layers which might be fully connected or have convolutional connectivity, or as specific Populations with Projections between them.  The first step of the mapping process is then to split up the neural processing work over the elements of the system.  This is often called partitioning of the problem.  This makes units that are of a size that each can be represented within one of the elements of the hardware, but it doesn't necessarily allocate specific elements yet.  This allows the user to approximate how much hardware is then required for the problem.

Many hardware platforms are of the scale that they can support multiple users simultaneously using different parts of a large system.  This might be through having several systems of different size or by having a large system that can be shared in some way.  Once the partitioning is done, the appropriately sized hardware unit or units can be allocated to the user using this information.  Usually it is wise to allocate a bit more hardware than the estimate requires.  Some systems may not have this flexibility, but at least at this point you can determine whether the user's problem will likely run at all or not, and avoid the user finding this out much later in the mapping process.

After an appropriate hardware unit is allocated, the elements of the hardware can now be selected for each of the sub units of the partitioning.  This is generally known as placement.  This will select the appropriate elements that best represent the partitions to be simulated. On digital hardware, this might be simple if all of the elements are the same.  On an analogue system this might attempt to match the requested parameters of the simulated neurons to the more naturally variable hardware elements, to make the simulation as accurate as possible.

There is in addition the potential to allow the user to constrain the placement specifically, so that certain partitions are placed on specific elements.  This is more often used in testing to arrange things in a way to test a case without having to make the problem too big.  More advanced users might also want to do this if they have some theories they would like to test out.

Placement may also have to account for some problem-specific constraints.  This could include elements of resource-sharing between partitions.  For example, on SpiNNaker, this is used where two or more partitions communicate using the SDRAM of a chip, and so must be placed on the same chip.  SpiNNaker 2 has a quad arrangement in addition to this, so this could also be a placement constraint.

Once it has been decided where things are going to be, it is then possible to ensure that elements that need to communicate are set up to do so.  Depending on the architecture, this may require some form of routing algorithm to run to work out how the traffic is moved from one place to another.  Once this is complete, the mapping will be done and the toolchain can next look at loading things on to the machine in preparation for execution.

Before we move on, it is worth considering that, although the mapping has been described like a sequence of events with no consequences, the way in which one algorithm works can clearly have an effect on those that follow it.  This is quite pronounced in the relationship between placement and routing, since the placement will determine, to some extent, how efficient routing can be.  This has been seen on SpiNNaker, where routing remains one of the biggest challenges in terms of speed of operation.  Thus it was decided to make a multi-stage routing algorithm, which can route between areas of the machine.  However this depends on the placement putting partitions on adjacent chips, reducing the choices that the placement algorithm can make.  This did reduce the routing time for a particularly large example from over three days to around one hour.


## Data Conversion

Having completed mapping, the process of converting the data into an appropriate form and loading it on to the machine can begin.  This is likely to be a combination of machine-specific elements and, where there is on-hardware-execution of software, additionally down to decisions made in that software.  The critical objective here is to translate from concepts easy for the user to understand into representations that work well on the hardware.

To give some examples, on SpiNNaker it is necessary to convert the routing information calculated during mapping into the binary representation used by the routers themselves.  Once this has been done correctly, it will always be the same since the routers will never change.  In contrast, the representation of neurons is purely software, so the data conversion has to be similarly fluid.  To this end, the user representation, conversion code and machine representation are also kept close to each other in the SpiNNaker code base.

The data conversion may require a loss of precision and/or a change in representation.  For example, if the weights are represented with a small number of bits on the hardware, but the software allows the user to specify weights with 32-bit or even 64-bit floating point representation within the high-level software, these will have to be converted to the hardware format, both losing precision and changing representation on the way.  Users might find this surprising at first, so it is useful to allow them to read back the values to see what actual values are in use.  It is also important that the user is warned if it is not possible to represent the value that they have used.


## Loading

With the data in the right format, the values in the hardware representation can be loaded on to the machine for use during simulation.  On hardware where values might change quickly once loaded, this will need to be done as quickly as possible.  In any case, any parallelism that can be exploited here is useful, as it means that the time before the  simulation starts is reduced, leading to a better user experience.

Although speed is important it is also worth noting that correctness is more important here.  If the hardware allows verification of the loaded data, it would be prudent to use it to ensure the simulation is what the user asked for.  Popular techniques include CRC codes amongst other things.

It may also be possible to speed up the loading of data by taking advantage of repetition or randomly generated data, as networks are commonly specified with the same parameters for every neuron or using some random pattern that can be defined using standard generation techniques.  If the hardware can execute user programs in any form, this could be used to execute a data expansion algorithm to allow a small amount of data to be loaded and then expanded on the machine.  Standard compression techniques may also be useful here if there isn't any such pattern.

## Machine Control

Once it has been determined how the hardware is to be used, the software can now also be used to communicate with the hardware and control the simulation of the neural network.  This is a useful part of an integrated toolkit that handles all aspects of the hardware and avoids most users from having to consider the low level details.

As has already been mentioned, machine control may be required during the mapping process, in the form of allocating some hardware to be used.  This step is most useful if the actual current state of the hardware is read by the software, so that the exact elements available at this time are known.  Once this has been done, it may be possible to power down the machine to perform the mapping process, and so save some additional power.  This will only work if the machine that comes back up when the power is restored is identical, as otherwise it is possible that partitions will be mapped to elements that are no longer available, requiring at best a correction, and at worst a restart of the whole mapping process.

In addition to getting a machine representation, the machine control will also be involved in loading the data.  Following these steps, the software can now start the simulation on the machine.  This may require some careful coordination; for example, analogue hardware could require that the initial voltages are set all at once, since the neurons will start emulation immediately.  On digital systems, it may be necessary to synchronise the start of the simulation to ensure (or attempt to ensure) the the neurons move to the same time step at the same time and avoid odd looking output data.

Machine control may then also go deeper than just commands from the outside, and additionally require some control processes to be implemented on the hardware.  Again using SpiNNaker as an example, synchronization between SpiNNaker boards is critical to avoid effects caused by drifting clock generators.  This is handled at startup by delaying synchronisation signals on elements closer to the host vs. those further away having less of a delay, in an attempt to have the signal reach all elements simultaneously.  In addition, during simulation, elements continually fine-tune the duration of a time-step to a reference signal generated on one of the boards.

After the simulation has been started, the software should interact less with the machine to avoid interference with the running processes that might affect the outcome.  Of course if the hardware allows, some monitoring could take place here to pick up errors that might happen and stop the simulation.  If this is not possible, the software can wait for the hardware to finish the simulation.  If the expected duration is known, the wait can be matched to this before any checks are done to determine completion.  If the completion does not happen, additional data can then be read to hopefully determine the cause and allow some level of debugging data to be generated.

There are circumstances where the duration of the simulation is not known in advance.   In these cases, some interaction from the user or some other external signal can be used to trigger the end of the simulation.  


## Data Extraction 

Once the simulation has completed, any data that has been recorded can be extracted.  Although it is possible to return control to the user and wait for them to initiate the reading of data, this deprives the software of the opportunity to extract data in bulk with improved efficiency.  On SpiNNaker for example, the network and cores are configured to allow high rate extraction of data and allow the bulk reading of all the data efficiently, but this setup would be slow to execute at each request.

In a similar way to data loading, the extracted data will in all probability need to be converted from the most efficient storage method on the machine into a more standardized format that the user expects.  This conversion may be more efficiently done as the user requests the particular part of the data, as the standard formats can be poor in terms of memory efficiency.

If the simulation is long and the hardware doesn't have much space for data storage during the simulation, there are some options.  One of these is to live-extract the data during the simulation if the platform supports this.  The potentially large volumes of data to be extracted may require a very high bandwidth of communication to make this possible.  The extraction could also interfere with the network operation if the same medium is used as is used for general network communication.  On SpiNNaker this is indeed the case, even for spike data; although multicast is used, an additional target still requires additional routing and creates a central point which will naturally mean a concentration of traffic which can result in additional dropping of packets.

An alternative is to only record a subset of the data, either by limiting the duration of the recording, or by limiting the data per time step.  For example, if recording neuron membrane voltages or spikes, a subset of the spikes can be recorded.  This may be enough to get valid statistics from the simulation, so the user should be offered this at least, possibly in combination with other options.

Another option, where the hardware supports it, is to calculate the duration of the simulation that would fill the memory available, and then split the run of the simulation into runs for this duration, extracting the data after each and caching this for later reconstruction.  This requires that the hardware can be set back up to continue the execution of the subsequent runs.  This is more easily done on digital platforms therefore, but it is not precluded from analogue systems if the set up can be done precisely and quickly enough.


# Back to the User

When the simulation has been run so far to the satisfaction of the user, they can be given the option of what to do next.  This could include simply reading and analysing the data.  It might instead be to change some parameters and run the simulation again, either from the start again, or from the end of the previous simulation.

If the user does want to make changes, it is important to verify that these changes won't break the way that the simulation has already been set up.  If the hardware has been optimised for the previous network, some changes may be hard to accommodate without restarting things from scratch.  This happens on SpiNNaker when a user wants to add a new connection between two populations of neurons that were not previously connected.  This requires changes to the routing that was done previously, and this is normally easier to do from the beginning, and so this sort of change is simply unsupported without a reset to the start of simulation.


# Conclusion

This chapter has discussed the ideas around the requirements of a neuromorphic toolchain.  The various steps that the toolchain must consider and how these might be handled with different types of hardware were introduced.

It is unlikely that these details will be sufficient on their own, but hopefully help to give an overview of the things that need to be done.  But, with work, a toolchain can make the hardware easy for the user to implement their networks in a flexible way.
