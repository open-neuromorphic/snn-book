const DYNSIM_URL = 'https://unpkg.com/dynsim@0.1.0/dist/dynsim.esm.js';
const PLOTLY_URL = 'https://cdn.plot.ly/plotly-2.27.0.min.js';
const PYSCRIPT_CSS_URL = 'https://pyscript.net/releases/2026.1.1/core.css';
const PYSCRIPT_URL = 'https://pyscript.net/releases/2026.1.1/core.js';

let dynsimPromise;
const controllers = new Map();

function readModel(model, key, fallback) {
  const value = model.get(key);
  return value === undefined ? fallback : value;
}

function loadStylesheet(href) {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

function loadScript(src, attributes = {}) {
  const existing = document.querySelector(`script[src="${src}"]`);
  if (existing?.dataset.loaded === 'true') return Promise.resolve();
  if (existing?.dataset.loading === 'true') {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', resolve, { once: true });
      existing.addEventListener('error', reject, { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = existing || document.createElement('script');
    Object.entries(attributes).forEach(([key, value]) => {
      script.setAttribute(key, value);
    });
    script.src = src;
    script.dataset.loading = 'true';
    script.addEventListener(
      'load',
      () => {
        script.dataset.loaded = 'true';
        resolve();
      },
      { once: true },
    );
    script.addEventListener('error', reject, { once: true });
    if (!existing) document.head.appendChild(script);
  });
}

async function waitFor(predicate, errorMessage, timeout = 30000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(errorMessage);
}

function injectExecuteBridge(packages) {
  if (window.executeDynSimCode || document.getElementById('dynsim-widget-execute-bridge')) return;

  const script = document.createElement('script');
  script.id = 'dynsim-widget-execute-bridge';
  script.type = 'py';
  script.setAttribute('config', JSON.stringify({ packages }));
  script.textContent = `
from pyscript import window
from pyscript.ffi import create_proxy, to_js
from js import Object

def execute_dynsim_code(python_code_str, container_id, config):
    user_namespace = {}
    exec(python_code_str, user_namespace)
    step = user_namespace["step"]

    def wrapped_step(x, state, params):
        py_state = state.to_py() if hasattr(state, "to_py") else state
        py_params = params.to_py() if hasattr(params, "to_py") else params
        result = step(float(x), py_state, py_params)
        return to_js(result, dict_converter=Object.fromEntries)

    window.registerPythonSystem(container_id, create_proxy(wrapped_step), config)

window.executeDynSimCode = create_proxy(execute_dynsim_code)
`;
  document.head.appendChild(script);
}

async function ensureDynSim(packages) {
  if (!dynsimPromise) {
    dynsimPromise = (async () => {
      loadStylesheet(PYSCRIPT_CSS_URL);
      await loadScript(PYSCRIPT_URL, { type: 'module' });
      await loadScript(PLOTLY_URL, { defer: '' });
      const dynsim = await import(DYNSIM_URL);
      await dynsim.autoInit();
      injectExecuteBridge(packages);
      await waitFor(
        () => typeof window.executeDynSimCode === 'function',
        'DynSim Python execution bridge did not initialize',
      );
      return dynsim;
    })();
  }
  return dynsimPromise;
}

function buildConfig(model) {
  return {
    params: readModel(model, 'params', []),
    plotType: readModel(model, 'plotType', 'timeseries'),
    plotConfig: readModel(model, 'plotConfig', {}),
    initialState: readModel(model, 'initialState', { t: 0 }),
    initialX: readModel(model, 'initialX', 0),
    height: readModel(model, 'height', 400),
    dt: readModel(model, 'dt', 0.02),
    pauseTime: readModel(model, 'pauseTime', null),
    spikes: readModel(model, 'spikes', null),
    spikeThreshold: readModel(model, 'spikeThreshold', null),
  };
}

function renderLoading(el, text) {
  el.innerHTML = '';
  el.style.position = 'relative';
  const loading = document.createElement('div');
  loading.className = 'visualization-loading';
  loading.style.minHeight = '220px';
  loading.style.display = 'grid';
  loading.style.placeItems = 'center';
  loading.style.border = '1px solid #d0d7de';
  loading.style.borderRadius = '6px';
  loading.style.background = '#f8f9fa';
  loading.style.color = '#4b5563';
  loading.textContent = text;
  el.appendChild(loading);
  return loading;
}

function renderError(el, error) {
  el.innerHTML = '';
  const message = document.createElement('pre');
  message.style.whiteSpace = 'pre-wrap';
  message.style.color = '#b00020';
  message.textContent = `DynSim widget failed to initialize:\n${error.message || error}`;
  el.appendChild(message);
}

function render({ model, el }) {
  const pythonCode = readModel(model, 'pythonCode', '');
  const packages = readModel(model, 'packages', ['numpy']);
  const containerId = `dynsim-widget-${crypto.randomUUID()}`;
  const container = document.createElement('div');
  let active = true;
  container.id = containerId;
  container.className = 'dynsim-python-container';
  container.style.minHeight = `${Number(readModel(model, 'height', 400))}px`;

  const loading = renderLoading(el, 'Loading DynSim...');
  el.appendChild(container);

  (async () => {
    try {
      const dynsim = await ensureDynSim(packages);
      if (!active) return;
      window.dynSimSystemsData = window.dynSimSystemsData || {};
      window.dynSimSystemsData[containerId] = {
        pythonCode,
        config: buildConfig(model),
      };
      await window.executeDynSimCode(pythonCode, containerId, window.dynSimSystemsData[containerId].config);
      if (!active) return;
      const config = dynsim.registry.getConfig(containerId);
      const controller = new dynsim.SimulationController({
        container,
        config,
        stepProvider: () => dynsim.registry.getStep(containerId),
      });
      controllers.set(containerId, controller);
      controller.start();
      loading.remove();
    } catch (error) {
      if (active) renderError(el, error);
    }
  })();

  return () => {
    active = false;
    controllers.get(containerId)?.destroy();
    controllers.delete(containerId);
    delete window.dynSimSystemsData?.[containerId];
    container.remove();
  };
}

export default { render };
