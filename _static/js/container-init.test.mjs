import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import {
  shouldInitializeContainer,
  markInitialized,
  findUninitializedContainers,
} from './container-init.mjs';

const SYSTEM_ID = 'dynsim-abc123';
const SYSTEMS_DATA = {
  [SYSTEM_ID]: {
    pythonCode: 'def step(x, s, p): return (x, s)',
    config: { plotType: 'timeseries', height: 400 },
  },
};

let dom, document;

beforeEach(() => {
  dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
  document = dom.window.document;
});

function makeContainer(id = SYSTEM_ID) {
  const div = document.createElement('div');
  div.id = id;
  div.className = 'dynsim-python-container';
  document.body.appendChild(div);
  return div;
}

describe('shouldInitializeContainer', () => {
  it('returns shouldInit: true for a fresh container with matching system data', () => {
    const container = makeContainer();
    const result = shouldInitializeContainer(container, SYSTEMS_DATA);
    expect(result.shouldInit).toBe(true);
    expect(result.systemData).toBe(SYSTEMS_DATA[SYSTEM_ID]);
  });

  it('rejects container without id', () => {
    const div = document.createElement('div');
    div.className = 'dynsim-python-container';
    const result = shouldInitializeContainer(div, SYSTEMS_DATA);
    expect(result.shouldInit).toBe(false);
    expect(result.reason).toBe('no-id');
  });

  it('rejects when systemsData is null', () => {
    const container = makeContainer();
    const result = shouldInitializeContainer(container, null);
    expect(result.shouldInit).toBe(false);
    expect(result.reason).toBe('no-systems-data');
  });

  it('rejects when no matching system exists', () => {
    const container = makeContainer('dynsim-unknown');
    const result = shouldInitializeContainer(container, SYSTEMS_DATA);
    expect(result.shouldInit).toBe(false);
    expect(result.reason).toBe('no-matching-system');
  });

  it('rejects when container already has .dynsim-container child', () => {
    const container = makeContainer();
    const child = document.createElement('div');
    child.className = 'dynsim-container';
    container.appendChild(child);

    const result = shouldInitializeContainer(container, SYSTEMS_DATA);
    expect(result.shouldInit).toBe(false);
    expect(result.reason).toBe('already-has-child');
  });

  it('rejects when data-dynsim-init is already set', () => {
    const container = makeContainer();
    container.dataset.dynsimInit = 'true';

    const result = shouldInitializeContainer(container, SYSTEMS_DATA);
    expect(result.shouldInit).toBe(false);
    expect(result.reason).toBe('already-flagged');
  });
});

describe('markInitialized', () => {
  it('sets data-dynsim-init attribute on the container', () => {
    const container = makeContainer();
    expect(container.dataset.dynsimInit).toBeUndefined();

    markInitialized(container);
    expect(container.dataset.dynsimInit).toBe('true');
  });

  it('prevents subsequent shouldInitializeContainer from returning true', () => {
    const container = makeContainer();
    expect(shouldInitializeContainer(container, SYSTEMS_DATA).shouldInit).toBe(true);

    markInitialized(container);
    expect(shouldInitializeContainer(container, SYSTEMS_DATA).shouldInit).toBe(false);
    expect(shouldInitializeContainer(container, SYSTEMS_DATA).reason).toBe('already-flagged');
  });
});

describe('markInitialized survives DOM operations (simulating React)', () => {
  it('attribute persists after moving element to a new parent', () => {
    const container = makeContainer();
    markInitialized(container);

    // Simulate React moving the element (remove + re-append)
    const newParent = document.createElement('div');
    document.body.appendChild(newParent);
    container.remove();
    newParent.appendChild(container);

    expect(container.dataset.dynsimInit).toBe('true');
    expect(shouldInitializeContainer(container, SYSTEMS_DATA).shouldInit).toBe(false);
  });

  it('fresh element (same id) does NOT have the attribute', () => {
    const original = makeContainer();
    markInitialized(original);
    original.remove();

    // Simulate React creating a brand-new element with the same id
    const fresh = makeContainer();
    expect(fresh.dataset.dynsimInit).toBeUndefined();
    expect(shouldInitializeContainer(fresh, SYSTEMS_DATA).shouldInit).toBe(true);
  });
});

describe('findUninitializedContainers', () => {
  it('finds containers that need initialization', () => {
    makeContainer();
    const results = findUninitializedContainers(document, SYSTEMS_DATA);
    expect(results).toHaveLength(1);
    expect(results[0].container.id).toBe(SYSTEM_ID);
  });

  it('skips already-initialized containers', () => {
    const container = makeContainer();
    markInitialized(container);

    const results = findUninitializedContainers(document, SYSTEMS_DATA);
    expect(results).toHaveLength(0);
  });

  it('skips containers with no matching system data', () => {
    makeContainer('dynsim-unknown');
    const results = findUninitializedContainers(document, SYSTEMS_DATA);
    expect(results).toHaveLength(0);
  });

  it('handles multiple containers, returning only uninitialized ones', () => {
    const c1 = makeContainer();
    markInitialized(c1);

    // Second system
    const SYSTEM_ID_2 = 'dynsim-def456';
    const data = {
      ...SYSTEMS_DATA,
      [SYSTEM_ID_2]: { pythonCode: 'x', config: {} },
    };
    makeContainer(SYSTEM_ID_2);

    const results = findUninitializedContainers(document, data);
    expect(results).toHaveLength(1);
    expect(results[0].container.id).toBe(SYSTEM_ID_2);
  });
});
