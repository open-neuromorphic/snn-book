import { describe, it, expect, vi, beforeEach } from 'vitest';
import { writeFileSync, mkdirSync } from 'fs';

// Mock fs so the plugin doesn't write files during tests
vi.mock('fs', () => ({
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
}));

// Fresh import per test file (module-level systemsData is shared)
let plugin;
beforeEach(async () => {
  vi.resetModules();
  vi.mocked(writeFileSync).mockClear();
  const mod = await import('./dynamical-systems.mjs');
  plugin = mod.default;
});

function getDirective() {
  return plugin.directives.find(d => d.name === 'dynsim');
}

function getLastWrittenData() {
  const written = vi.mocked(writeFileSync).mock.calls.at(-1)[1];
  const match = written.match(/window\.dynSimSystemsData = ({[\s\S]*?});/);
  expect(match).not.toBeNull();
  return JSON.parse(match[1]);
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
  });
});

describe('dynsim directive run()', () => {
  it('returns an html node with a container div', () => {
    const result = getDirective().run({
      body: 'def step(x, state, p): return (x, state)',
      options: {},
    });

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('html');
    expect(result[0].value).toMatch(/class="dynsim-python-container"/);
    expect(result[0].value).toMatch(/id="dynsim-/);
  });

  it('applies default config values', () => {
    getDirective().run({
      body: 'def step(x, state, p): return (x, state)',
      options: {},
    });

    const data = getLastWrittenData();
    const system = Object.values(data)[0];

    expect(system.config.plotType).toBe('timeseries');
    expect(system.config.initialState).toBe('{"t": 0}');
    expect(system.config.initialX).toBe(0);
    expect(system.config.height).toBe(400);
    expect(system.config.dt).toBe(0.02);
    expect(system.config.params).toBe('[]');
    expect(system.config.plotConfig).toBe('{}');
    expect(system.config.spikes).toBeNull();
    expect(system.config.spikeThreshold).toBeNull();
    expect(system.config.input).toBeNull();
  });

  it('passes through spike options', () => {
    getDirective().run({
      body: 'def step(x, state, p): return (x, state)',
      options: { spikes: 'S', spikeThreshold: 1.0 },
    });

    const data = getLastWrittenData();
    const system = Object.values(data)[0];

    expect(system.config.spikes).toBe('S');
    expect(system.config.spikeThreshold).toBe(1.0);
  });

  it('passes through input slider config', () => {
    const inputConfig = '{"label": "I", "min": -0.5, "max": 1, "step": 0.01, "value": 0.1}';
    getDirective().run({
      body: 'def step(x, state, p): return (x, state)',
      options: { input: inputConfig },
    });

    const data = getLastWrittenData();
    const system = Object.values(data)[0];

    expect(system.config.input).toBe(inputConfig);
  });

  it('respects custom height in container style', () => {
    const result = getDirective().run({
      body: 'def step(x, state, p): return (x, state)',
      options: { height: 600 },
    });

    expect(result[0].value).toContain('min-height: 600px');
  });

  it('stores python code in the data file', () => {
    const code = 'def step(x, state, p):\n    return (x * 2, state)';
    getDirective().run({ body: code, options: {} });

    const data = getLastWrittenData();
    const system = Object.values(data)[0];

    expect(system.pythonCode).toBe(code);
  });

  it('generates unique IDs for each invocation', () => {
    const r1 = getDirective().run({ body: 'def step(x, s, p): return (x, s)', options: {} });
    const r2 = getDirective().run({ body: 'def step(x, s, p): return (x, s)', options: {} });

    const id1 = r1[0].value.match(/id="(dynsim-[^"]+)"/)[1];
    const id2 = r2[0].value.match(/id="(dynsim-[^"]+)"/)[1];
    expect(id1).not.toBe(id2);
  });
});
