/**
 * Dynamical Systems Simulator - Python/PyScript Implementation
 *
 * Systems are defined in Python with signature:
 *   def step(x, state, p) -> (x_new, state_new)
 *
 * Where:
 *   x: current input/output (feedback)
 *   state: State namedtuple with internal variables
 *   p: SimpleNamespace with parameters
 */

// Global registry for Python-defined systems
window.pythonSystems = window.pythonSystems || {};
window.dynSimConfigs = window.dynSimConfigs || {};

window.registerPythonSystem = function (containerId, stepFunction, config) {
  console.log('[DynSim] Registering Python system:', containerId, config);

  try {
    window.pythonSystems[containerId] = {
      step: stepFunction,
      params: JSON.parse(config.params || '[]'),
      plotType: config.plotType || 'timeseries',
      plotConfig: JSON.parse(config.plotConfig || '{}'),
      initialState: JSON.parse(config.initialState || '{"t": 0}'),
      initialX: config.initialX ?? 0,
      height: config.height || 400,
      dt: config.dt || 0.01
    };

    console.log('[DynSim] Successfully registered system:', containerId);

    // Auto-initialize if DOM and dependencies are ready
    if (document.readyState === 'complete' && typeof Plotly !== 'undefined') {
      console.log('[DynSim] Auto-initializing immediately:', containerId);
      initializePythonSimulator(containerId);
    }
  } catch (e) {
    console.error('[DynSim] Error registering Python system:', e);
  }
};

class DynamicalSystemsSimulator {
  constructor(containerId, pythonSystem) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);

    if (!this.container) {
      console.error(`Container ${containerId} not found`);
      return;
    }

    this.pythonStep = pythonSystem.step;  // Python function proxy
    this.params = pythonSystem.params;
    this.plotType = pythonSystem.plotType;
    this.plotConfig = pythonSystem.plotConfig;
    this.initialState = pythonSystem.initialState;
    this.initialX = pythonSystem.initialX;
    this.isRunning = true;

    this.options = {
      height: pythonSystem.height,
      dt: pythonSystem.dt,
      maxPoints: 1000
    };

    // Current state
    this.x = this.initialX;
    this.state = { ...this.initialState };
    this.time = 0;  // Track time for plotting
    this.animationId = null;
    this.plotData = [];

    this.init();
  }

  init() {
    this.createHTML();  // This replaces innerHTML, removing the loader
    this.setupEventListeners();
    this.initPlot();
    this.startAnimation();
  }

  createHTML() {
    // Stacked layout: controls on top, full-width plot below
    this.container.innerHTML = `
      <div class="dynsim-container" style="font-family: Arial, sans-serif; font-size: 0.9em;">
        <div class="dynsim-controls" style="background: #f8f9fa; padding: 12px; border-radius: 6px; border: 1px solid #ddd; margin-bottom: 12px; box-sizing: border-box;">
          <div class="dynsim-params"></div>
        </div>

        <div style="width: 100%; height: ${this.options.height}px; border: 1px solid #ddd; border-radius: 6px; box-sizing: border-box; overflow: hidden;">
          <div class="dynsim-plot" style="width: 100%; height: 100%;"></div>
        </div>
      </div>
    `;

    this.updateUI();
  }

  updateUI() {
    const paramsDiv = this.container.querySelector('.dynsim-params');

    // First row: Input slider with reset button
    let html = `
      <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 8px;">
        <label style="font-weight: 600; font-size: 0.85em; color: #0056b3; white-space: nowrap;">Input (x):</label>
        <input type="range"
          class="dynsim-input"
          min="-2"
          max="2"
          step="0.1"
          value="${this.initialX}"
          style="flex: 1; height: 6px; min-width: 100px;">
        <span class="dynsim-input-value" style="background: #cfe2ff; padding: 2px 8px; border-radius: 3px; font-size: 0.85em; min-width: 40px; text-align: center; font-family: monospace;">${this.initialX.toFixed(2)}</span>
        <button class="dynsim-reset" style="background: transparent; border: none; cursor: pointer; padding: 4px; display: flex; align-items: center;" title="Reset">
          <svg width="20" height="20" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12a9 9 0 1 1-9 -9c2.5 0 4.8 1 6.5 2.5l.5 .5"/>
            <path d="M21 3v6h-6"/>
          </svg>
        </button>
      </div>
    `;

    // Second row: Parameter sliders with restart button
    html += `<div style="display: flex; gap: 12px; align-items: center;">`;

    html += this.params.map(param => `
        <label style="font-weight: 600; font-size: 0.85em; white-space: nowrap;">${param.label}:</label>
        <input type="range"
          class="dynsim-param"
          data-param="${param.id}"
          min="${param.min}"
          max="${param.max}"
          step="${param.step}"
          value="${param.value}"
          style="flex: 1; height: 6px; min-width: 100px;">
        <span class="dynsim-param-value" style="background: #e9ecef; padding: 2px 8px; border-radius: 3px; font-size: 0.85em; min-width: 40px; text-align: center; font-family: monospace;">${param.value.toFixed(2)}</span>
    `).join('');

    // Add pause button at end of second row
    html += `
        <button class="dynsim-pause" style="background: transparent; border: none; cursor: pointer; padding: 4px; display: flex; align-items: center;" title="Pause">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-pause-circle"><circle cx="12" cy="12" r="10"></circle><line x1="10" y1="15" x2="10" y2="9"></line><line x1="14" y1="15" x2="14" y2="9"></line></svg>
          </svg>
        </button>
      </div>
    `;

    paramsDiv.innerHTML = html;

    // Add event listener for input slider
    const inputSlider = paramsDiv.querySelector('.dynsim-input');
    inputSlider.addEventListener('input', (e) => {
      const valueSpan = e.target.closest('div').querySelector('.dynsim-input-value');
      valueSpan.textContent = parseFloat(e.target.value).toFixed(2);
    });

    // Add event listeners for parameter sliders
    paramsDiv.querySelectorAll('.dynsim-param').forEach(slider => {
      slider.addEventListener('input', (e) => {
        const valueSpan = e.target.closest('div').querySelector('.dynsim-param-value');
        valueSpan.textContent = parseFloat(e.target.value).toFixed(2);
      });
    });
  }

  setupEventListeners() {
    const resetBtn = this.container.querySelector('.dynsim-reset');
    const pauseBtn = this.container.querySelector('.dynsim-pause');

    resetBtn.addEventListener('click', () => this.reset());
    pauseBtn.addEventListener('click', () => this.togglePause());
  }

  initPlot() {
    const plotDiv = this.container.querySelector('.dynsim-plot');

    if (this.plotType === '3d') {
      Plotly.newPlot(plotDiv, [{
        x: [], y: [], z: [],
        mode: 'lines',
        type: 'scatter3d',
        line: { color: '#2196f3', width: 4 }
      }], {
        title: this.plotConfig.title,
        scene: {
          xaxis: { title: this.plotConfig.xaxis?.title || 'X' },
          yaxis: { title: this.plotConfig.yaxis?.title || 'Y' },
          zaxis: { title: this.plotConfig.zaxis?.title || 'Z' }
        },
        margin: { l: 0, r: 0, t: 30, b: 0 }
      });
    } else {
      Plotly.newPlot(plotDiv, [{
        x: [], y: [],
        mode: 'lines',
        line: { color: '#2196f3', width: 2 }
      }], {
        title: this.plotConfig.title,
        xaxis: this.plotConfig.xaxis,
        yaxis: this.plotConfig.yaxis,
        margin: { l: 50, r: 20, t: 40, b: 50 }
      });
    }
  }

  getParameters() {
    const sliders = this.container.querySelectorAll('.dynsim-param');
    return Array.from(sliders).map(slider => parseFloat(slider.value));
  }

  reset() {
    this.x = this.initialX;
    this.state = { ...this.initialState };
    this.time = 0;
    this.plotData = [];
    this.initPlot();
  }

  togglePause() {
    this.isRunning = !this.isRunning;
    const pauseBtn = this.container.querySelector('.dynsim-pause');
    if (this.isRunning) {
      pauseBtn.title = 'Pause';
      pauseBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-pause-circle"><circle cx="12" cy="12" r="10"></circle><line x1="10" y1="15" x2="10" y2="9"></line><line x1="14" y1="15" x2="14" y2="9"></line></svg>`;
    } else {
      pauseBtn.title = 'Play';
      pauseBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-play-circle"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg>`;
    }
  }

  animate() {
    // Only update the plot if the animation is running
    // >>> If is running
    if (this.isRunning) {
      const paramValues = this.getParameters();

      // Convert params array to dict object keyed by parameter ID
      const paramNames = this.params.map(p => p.id);
      const paramsDict = {};
      paramNames.forEach((name, i) => paramsDict[name] = paramValues[i]);

      // Add dt constant to params (from config, default 0.02)
      paramsDict.dt = this.options.dt;

      // Get current input value from slider
      const inputSlider = this.container.querySelector('.dynsim-input');
      const inputValue = parseFloat(inputSlider.value);

      // Call Python step wrapper: step(x, state, params) -> (x_new, state_new)
      try {
        const result = this.pythonStep(inputValue, this.state, paramsDict);
        this.x = result[0];  // New x (output from step)
        this.state = result[1];  // New state
      } catch (e) {
        console.error('Python step function error:', e);
        this.stopAnimation();
        return;
      }

      // Increment time
      this.time += this.options.dt;

      // Collect data for plotting
      if (this.plotType === '3d') {
        // For 3D plots, assume state has x, y, z
        this.plotData.push([this.state.x || this.x, this.state.y || 0, this.state.z || 0]);
      } else if (this.plotType === 'timeseries') {
        // For timeseries, plot (time, x)
        this.plotData.push([this.time, this.x]);
      } else {
        // For 2D plots, plot (x, y) - need to think about what y is
        // For now, assume state has y or we use some derivative
        this.plotData.push([this.x, this.state.y || 0]);
      }

      // Buffer management
      if (this.plotType === 'timeseries') {
        const windowSize = this.plotConfig.xaxis?.range?.[1] || 50;
        const pointsPerWindow = Math.ceil(windowSize / this.options.dt);
        const bufferPoints = Math.ceil(pointsPerWindow * 0.5);
        const targetPoints = pointsPerWindow + bufferPoints;

        if (this.plotData.length > targetPoints * 2) {
          this.plotData = this.plotData.slice(-targetPoints);
        }
      } else {
        if (this.plotData.length > this.options.maxPoints) {
          this.plotData.shift();
        }
      }
    } // <<< if is running
    this.updatePlot();
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  updatePlot() {
    const plotDiv = this.container.querySelector('.dynsim-plot');

    if (this.plotType === '3d') {
      const xData = this.plotData.map(d => d[0]);
      const yData = this.plotData.map(d => d[1]);
      const zData = this.plotData.map(d => d[2]);

      Plotly.animate(plotDiv, {
        data: [{ x: xData, y: yData, z: zData }]
      }, { transition: { duration: 0 }, frame: { duration: 0 } });
    } else if (this.plotType === 'timeseries') {
      const xData = this.plotData.map(d => d[0]);
      const yData = this.plotData.map(d => d[1]);

      const currentTime = this.time;
      const windowSize = this.plotConfig.xaxis?.range?.[1] - this.plotConfig.xaxis?.range?.[0] || 50;
      const originalEnd = this.plotConfig.xaxis?.range?.[1] || 50;

      let xRange;
      if (currentTime > originalEnd) {
        xRange = [currentTime - windowSize, currentTime];
      } else {
        xRange = this.plotConfig.xaxis?.range || [0, 50];
      }

      Plotly.react(plotDiv,
        [{ x: xData, y: yData, mode: 'lines', line: { color: '#2196f3', width: 2 } }],
        {
          title: this.plotConfig.title,
          xaxis: {
            title: this.plotConfig.xaxis?.title || 'Time',
            range: xRange
          },
          yaxis: this.plotConfig.yaxis,
          margin: { l: 50, r: 20, t: 40, b: 50 }
        }
      );
    } else {
      const xData = this.plotData.map(d => d[0]);
      const yData = this.plotData.map(d => d[1]);

      Plotly.animate(plotDiv, {
        data: [{ x: xData, y: yData }]
      }, { transition: { duration: 0 }, frame: { duration: 0 } });
    }
  }

  startAnimation() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.animate();
  }

  stopAnimation() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  destroy() {
    this.stopAnimation();
    this.container.innerHTML = '';
  }
}

window.DynamicalSystemsSimulator = DynamicalSystemsSimulator;

function initializePythonSimulator(containerId) {
  const pythonSystem = window.pythonSystems[containerId];
  if (!pythonSystem) {
    console.error(`No Python system registered for ${containerId}`);
    return;
  }

  new DynamicalSystemsSimulator(containerId, pythonSystem);
}

// Auto-initialize simulators when DOM, Plotly, and PyScript are ready
let initAttempts = 0;
const MAX_INIT_ATTEMPTS = 20; // 10 seconds max wait

function initializeSimulators() {
  initAttempts++;

  // Check if Plotly is loaded
  if (typeof Plotly === 'undefined') {
    console.warn('Plotly not loaded yet, retrying in 50ms...');
    setTimeout(initializeSimulators, 50);
    return;
  }

  // Check if PyScript is ready (check for pyscript global or wait for Python systems to register)
  // Python systems register themselves, so we just need to initialize them
  const containerIds = Object.keys(window.pythonSystems);
  const configIds = Object.keys(window.dynSimConfigs || {});

  console.log(`[DynSim] Init attempt ${initAttempts}: ${containerIds.length} systems registered, ${configIds.length} configs found`);
  console.log('[DynSim] PyScript status:', typeof pyscript !== 'undefined' ? 'loaded' : 'not loaded');

  if (containerIds.length === 0) {
    // No systems registered yet, wait a bit
    if (initAttempts < MAX_INIT_ATTEMPTS) {
      console.warn(`PyScript systems not registered yet (attempt ${initAttempts}/${MAX_INIT_ATTEMPTS}), retrying in 50ms...`);
      setTimeout(initializeSimulators, 50);
    } else {
      console.error('Timeout waiting for PyScript systems to register. Check that PyScript is loading correctly.');
      console.log('Available configs:', window.dynSimConfigs);
      console.log('PyScript global exists?', typeof pyscript !== 'undefined');
      console.log('Script tags with type="py":', document.querySelectorAll('script[type="py"]').length);

      // Check if there are any PyScript errors
      const pyScripts = document.querySelectorAll('script[type="py"]');
      console.log('PyScript tags found:', pyScripts);
    }
    return;
  }

  console.log('[DynSim] Initializing Python systems:', containerIds);

  // Initialize all registered Python systems
  containerIds.forEach(containerId => {
    // Check if not already initialized
    const container = document.getElementById(containerId);
    if (container && !container.querySelector('.dynsim-container')) {
      console.log(`[DynSim] Initializing system in container: ${containerId}`);
      initializePythonSimulator(containerId);
    } else if (!container) {
      console.error(`[DynSim] Container ${containerId} not found in DOM`);
    } else {
      console.log(`[DynSim] Container ${containerId} already initialized`);
    }
  });
}

// Debug: Log what's available
console.log('[DynSim] Checking environment...');
console.log('[DynSim] window.pyscript:', typeof window.pyscript);
console.log('[DynSim] window.PyScript:', typeof window.PyScript);
console.log('[DynSim] Plotly:', typeof Plotly);

// Listen for PyScript ready event (if it exists)
document.addEventListener('py:ready', () => {
  console.log('[DynSim] PyScript py:ready event fired!');
});

document.addEventListener('py:done', () => {
  console.log('[DynSim] PyScript py:done event fired!');
});

// Process containers and execute Python code using PyScript bootstrap
async function setupPyScriptContainers() {
  console.log('[DynSim] Setting up PyScript containers...');

  // Wait for data file to load (retry up to 20 times = 10 seconds)
  let dataWaitAttempts = 0;
  while (!window.dynSimSystemsData && dataWaitAttempts < 20) {
    console.warn('[DynSim] window.dynSimSystemsData not found - waiting for data file to load...');
    await new Promise(resolve => setTimeout(resolve, 500));
    dataWaitAttempts++;
  }

  if (!window.dynSimSystemsData) {
    console.error('[DynSim] Timeout waiting for data file to load. No systems will be initialized.');
    return;
  }

  console.log('[DynSim] Found', Object.keys(window.dynSimSystemsData).length, 'system definitions');

  // Wait for PyScript bootstrap to be ready (window.executeDynSimCode)
  console.log('[DynSim] Waiting for PyScript bootstrap...');
  let pyScriptWaitAttempts = 0;
  while (!window.executeDynSimCode && pyScriptWaitAttempts < 40) {
    await new Promise(resolve => setTimeout(resolve, 500));
    pyScriptWaitAttempts++;
  }

  if (!window.executeDynSimCode) {
    console.error('[DynSim] Timeout waiting for PyScript bootstrap. Check that PyScript loaded correctly.');
    return;
  }

  console.log('[DynSim] PyScript bootstrap ready!');

  // Find all container divs
  const containers = document.querySelectorAll('.dynsim-python-container');
  console.log('[DynSim] Found', containers.length, 'container divs');

  for (const container of containers) {
    const containerId = container.id;
    const systemData = window.dynSimSystemsData[containerId];

    if (!systemData) {
      console.error('[DynSim] No system data found for container:', containerId);
      continue;
    }

    console.log(`[DynSim] Processing container:`, containerId);

    try {
      const { pythonCode, config } = systemData;

      console.log('[DynSim] Python code length:', pythonCode.length);
      console.log('[DynSim] Config:', config);

      // Store config globally (for reference)
      window.dynSimConfigs = window.dynSimConfigs || {};
      window.dynSimConfigs[containerId] = config;

      // Call PyScript bootstrap to execute user's Python code, passing config directly
      console.log('[DynSim] Calling executeDynSimCode for:', containerId);
      window.executeDynSimCode(pythonCode, containerId, config);

      console.log('[DynSim] Executed Python code for:', containerId);
    } catch (e) {
      console.error('[DynSim] Error processing container:', containerId, e);
    }
  }

  console.log('[DynSim] Finished setting up PyScript containers. Registered systems:', Object.keys(window.pythonSystems).length);
}

// Start initialization when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', async () => {
    await setupPyScriptContainers();
    initializeSimulators();
  });
} else {
  // DOM already loaded (e.g., script loaded late)
  (async () => {
    await setupPyScriptContainers();
    initializeSimulators();
  })();
}
