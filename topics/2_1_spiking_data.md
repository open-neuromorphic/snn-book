(spiking_data)=
# Working with spikes

Three parts:
1. Converting data to spikes
2. Using spiking datasets
3. Structuring spiking datasets

## Data Structures

### Sparse Representations
- AER/COO/CSR formats for memory efficiency
- Temporal-spatial indexing schemes
- Trade-offs: memory vs. computation speed

### Batching Variable-Length Sequences
- Padding strategies for mini-batches
- Efficient data loaders
- Memory allocation patterns

## Preprocessing Pipelines

### Format Conversions
- Neuromorphic formats (AEDAT, HDF5)
- Frame-to-event conversions
- Temporal resampling

### Data Augmentation
- Temporal jittering
- Spatial transformations
- Rate scaling while preserving causality

## Framework Integration

### Data Loading
- Custom PyTorch/TensorFlow loaders
- Collate functions for spike tensors
- Memory mapping for large datasets

### Real-world Challenges
- Sensor noise filtering
- Timestamp synchronization
- Quality assessment metrics

