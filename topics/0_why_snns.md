---
numbering: false
---
(why_snns)=
# Why spiking neurons?

Artificial Neural Networks (ANNs) excel at pattern recognition and decision-making, but biological brains are fundamentally more capable. Brains solve harder problems while consuming vastly less energy. The key difference lies in how neurons compute.

**Biological neurons are hybrid systems**: They gather analog information internally through continuous chemical and electrical processes, but communicate digitally via discrete electrical pulses called spikes [@Neumann2012]. This combination gives brains both the precision of digital computation and the efficiency of analog processing.

**Spiking neurons** are computational models that capture this dual nature. They integrate incoming signals over time and emit discrete spikes when certain conditions are met. When networks of spiking neurons are deployed on specialized neuromorphic hardware, they achieve:
- **Higher computational expressivity**: Time-based encoding carries more information
- **Greater energy efficiency**: Events are processed only when spikes occur
- **Lower latency**: Asynchronous processing enables real-time responses

**The challenge**: SNNs are harder to understand and train than conventional ANNs. The temporal dynamics and discrete spike events require different mathematical tools and training methods.

**Our goal**: Give you the intuition and practical skills to design, build, train, and deploy SNNs effectively. We start with the fundamentals and build toward real-world applications on neuromorphic hardware.
