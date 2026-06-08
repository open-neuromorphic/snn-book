---
title: DynSim Widget Test
---

# DynSim Widget Test

This page validates the MyST `{anywidget}` path for interactive simulators without the
custom `server.js` injection.

```{anywidget} /_widgets/dynsim-widget.mjs
{
  "params": [
    {
      "id": "v_decay",
      "label": "Voltage Decay",
      "min": 0,
      "max": 0.12,
      "step": 0.01,
      "value": 0.09
    }
  ],
  "plotType": "timeseries",
  "plotConfig": {
    "title": "Leaky Integrate & Fire Neuron",
    "xaxis": {
      "title": "Time-Steps",
      "range": [0, 0.2]
    },
    "yaxis": {
      "title": "Voltage (V)",
      "range": [-0.5, 1.5]
    }
  },
  "initialState": {
    "V": 0,
    "S": 0
  },
  "initialX": 0.1,
  "height": 400,
  "dt": 0.001,
  "spikes": "S",
  "spikeThreshold": 1,
  "pythonCode": "def step(x, state, p):\n  V_new = (1 - p[\"v_decay\"])*state[\"V\"] + x\n  S = 0\n  if V_new > 1.0:\n    S = 1\n    V_new = 0.0\n  return (V_new, {\"V\": V_new, \"S\": S})"
}
```
