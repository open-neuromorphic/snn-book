import { describe, expect, it } from 'vitest';

import { buildConfig } from './dynsim-widget.mjs';

function model(values) {
  return {
    get(key) {
      return values[key];
    },
  };
}

describe('buildConfig', () => {
  it('maps the legacy initialX option to the DynSim 0.3 input config', () => {
    const config = buildConfig(model({ initialX: 0.25 }));

    expect(config.initialX).toBe(0.25);
    expect(config.input).toEqual({
      label: 'Input (x)',
      min: -2,
      max: 2,
      step: 0.1,
      value: 0.25,
    });
  });

  it('keeps an explicitly configured input slider', () => {
    const input = { label: 'Current', min: 0, max: 1, step: 0.01, value: 0.4 };
    const config = buildConfig(model({ initialX: 0.25, input }));

    expect(config.input).toEqual(input);
  });
});
