import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildConfig, createShadowDomController } from './dynsim-widget.mjs';

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

describe('createShadowDomController', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function makeDynSim(isConnected = true) {
    class SimulationController {
      constructor() {
        this.isRunning = true;
        this.animationId = null;
        this.stop = vi.fn();
        this.simulation = {
          paused: false,
          plotType: 'timeseries',
          spikes: 'S',
          spikeTimes: [0.1],
          step: vi.fn(),
          getPlotArrays: vi.fn(() => ({ x: [0.1], y: [1] })),
          getTimeseriesRange: vi.fn(() => [0, 0.2]),
        };
        this.view = {
          plotDiv: { isConnected },
          getInput: vi.fn(() => 0.1),
          getParameters: vi.fn(() => ({ decay: 0.09 })),
          updatePlot: vi.fn(),
          setPauseState: vi.fn(),
        };
      }
    }

    return { SimulationController };
  }

  it('continues animating when the plot is connected through a shadow root', () => {
    const requestAnimationFrame = vi.fn(() => 42);
    vi.stubGlobal('requestAnimationFrame', requestAnimationFrame);
    const controller = createShadowDomController(makeDynSim(), {});

    controller.animate();

    expect(controller.simulation.step).toHaveBeenCalledWith(0.1, { decay: 0.09 });
    expect(controller.view.updatePlot).toHaveBeenCalledWith(
      { x: [0.1], y: [1] },
      [0, 0.2],
      [0.1],
    );
    expect(requestAnimationFrame).toHaveBeenCalledOnce();
    expect(controller.animationId).toBe(42);
  });

  it('stops after the shadow-root plot is detached', () => {
    vi.stubGlobal('requestAnimationFrame', vi.fn());
    const controller = createShadowDomController(makeDynSim(false), {});

    controller.animate();

    expect(controller.stop).toHaveBeenCalledOnce();
    expect(controller.simulation.step).not.toHaveBeenCalled();
  });
});
