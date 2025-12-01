(ann-to-snn_conversion)=
# ANN-to-SNN Conversion

**Core idea:** Train a conventional ANN, then convert it to an SNN
- **Rate-based conversion**: Map ANN activations to spike rates
- **Threshold balancing**: Adjust SNN thresholds to match ANN outputs
- **Temporal coding**: Convert activation magnitudes to spike timing patterns

**When to use:** When you need SNN benefits but have established ANN training pipelines.
Or need to train deep SNNs