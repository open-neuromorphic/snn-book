import { describe, expect, it } from 'vitest';

import plugin from './dynamical-systems.mjs';

function getDirective() {
  return plugin.directives.find(d => d.name === 'dynsim');
}

describe('dynsim plugin structure', () => {
  it('exports a plugin with the dynsim directive', () => {
    expect(plugin.name).toBe('Dynamical Systems Simulator');
    expect(getDirective()).toBeDefined();
    expect(getDirective().body.required).toBe(true);
  });

  it('declares all expected options', () => {
    const opts = Object.keys(getDirective().options);
    expect(opts).toContain('params');
    expect(opts).toContain('plotType');
    expect(opts).toContain('plotConfig');
    expect(opts).toContain('initialState');
    expect(opts).toContain('initialX');
    expect(opts).toContain('input');
    expect(opts).toContain('height');
    expect(opts).toContain('dt');
    expect(opts).toContain('spikes');
    expect(opts).toContain('spikeThreshold');
    expect(opts).toContain('packages');
  });
});

describe('dynsim directive run()', () => {
  it('returns an AnyWidget node using the DynSim widget adapter', () => {
    const result = getDirective().run({
      body: 'def step(x, state, p): return (x, state)',
      options: {},
    });

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('anywidget');
    expect(result[0].esm).toBe('/_widgets/dynsim-widget.mjs');
  });

  it('applies default config values', () => {
    const [widget] = getDirective().run({
      body: 'def step(x, state, p): return (x, state)',
      options: {},
    });

    expect(widget.model).toMatchObject({
      params: [],
      plotType: 'timeseries',
      plotConfig: {},
      initialState: { t: 0 },
      initialX: 0,
      input: null,
      height: 400,
      dt: 0.02,
      spikes: null,
      spikeThreshold: null,
      packages: ['numpy'],
    });
  });

  it('passes through spike options', () => {
    const [widget] = getDirective().run({
      body: 'def step(x, state, p): return (x, state)',
      options: { spikes: 'S', spikeThreshold: 1.0 },
    });

    expect(widget.model.spikes).toBe('S');
    expect(widget.model.spikeThreshold).toBe(1.0);
  });

  it('parses input slider config', () => {
    const inputConfig = '{"label": "I", "min": -0.5, "max": 1, "step": 0.01, "value": 0.1}';
    const [widget] = getDirective().run({
      body: 'def step(x, state, p): return (x, state)',
      options: { input: inputConfig },
    });

    expect(widget.model.input).toEqual({
      label: 'I',
      min: -0.5,
      max: 1,
      step: 0.01,
      value: 0.1,
    });
  });

  it('passes custom display and package options to the widget model', () => {
    const [widget] = getDirective().run({
      body: 'def step(x, state, p): return (x, state)',
      options: { height: 600, packages: '["numpy", "scipy"]' },
    });

    expect(widget.model.height).toBe(600);
    expect(widget.model.packages).toEqual(['numpy', 'scipy']);
  });

  it('stores Python code in the widget model', () => {
    const code = 'def step(x, state, p):\n    return (x * 2, state)';
    const [widget] = getDirective().run({ body: code, options: {} });

    expect(widget.model.pythonCode).toBe(code);
  });

  it('reports which JSON option is invalid', () => {
    expect(() => getDirective().run({
      body: 'def step(x, state, p): return (x, state)',
      options: { params: 'not-json' },
    })).toThrow('Invalid JSON for dynsim option "params"');
  });

  it('accepts already-parsed model options', () => {
    const params = [{ id: 'decay', value: 0.1 }];
    const [widget] = getDirective().run({
      body: 'def step(x, state, p): return (x, state)',
      options: { params },
    });

    expect(widget.model.params).toBe(params);
  });
});
