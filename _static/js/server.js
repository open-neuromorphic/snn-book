const path = require('path');
const express = require('express');
const getPort = require('get-port');
const compression = require('compression');
const morgan = require('morgan');
const { createRequestHandler } = require('@remix-run/express');
const { installGlobals } = require('@remix-run/node');
const fs = require('fs');

installGlobals();

const BUILD_DIR = path.join(process.cwd(), 'build');
const PROJECT_ROOT = path.join(process.cwd(), '..', '..', '..', '..', '..');

const app = express();

app.use(compression());

// http://expressjs.com/en/advanced/best-practice-security.html#at-a-minimum-disable-x-powered-by-header
app.disable('x-powered-by');

// Serve custom static files from project root _static directory
const customStaticPath = path.join(PROJECT_ROOT, '_static');
if (fs.existsSync(customStaticPath)) {
  app.use('/_static', express.static(customStaticPath, { maxAge: '1h' }));
  console.log('Custom static files enabled from:', customStaticPath);
}

// Remix fingerprints its assets so we can cache forever.
app.use('/myst_assets_folder', express.static('public/build', { immutable: true, maxAge: '1y' }));

// Everything else (like favicon.ico) is cached for an hour. You may want to be
// more aggressive with this caching.
app.use(express.static('public', { maxAge: '1h' }));

app.use(morgan('tiny'));

// Middleware to inject custom scripts into HTML
app.use((req, res, next) => {
  const originalSend = res.send;
  const originalWrite = res.write;
  const originalEnd = res.end;

  // Intercept res.send (used by some responses)
  res.send = function(data) {
    if (typeof data === 'string' && data.includes('</head>')) {
      data = injectScripts(data);
    }
    return originalSend.call(this, data);
  };

  // Intercept res.end (used by Remix)
  const chunks = [];
  let intercepting = false;

  res.write = function(chunk) {
    if (chunk) {
      chunks.push(chunk);
      intercepting = true;
      return true;
    }
    return originalWrite.apply(this, arguments);
  };

  res.end = function(chunk) {
    if (chunk) {
      chunks.push(chunk);
    }

    // Only process if we have intercepted chunks
    if (intercepting && chunks.length > 0) {
      const buffer = Buffer.concat(chunks);
      const body = buffer.toString('utf8');

      if (body && body.includes('</head>')) {
        const modifiedBody = injectScripts(body);
        return originalEnd.call(this, modifiedBody);
      } else {
        return originalEnd.call(this, buffer);
      }
    }

    return originalEnd.call(this, chunk);
  };

  function injectScripts(html) {
    let customScripts = '';

    // Add PyScript (CSS + JS) for Python-powered visualizations
    customScripts += '\n  <link rel="stylesheet" href="https://pyscript.net/releases/2026.1.1/core.css" />';
    customScripts += '\n  <script type="module" src="https://pyscript.net/releases/2026.1.1/core.js"></script>';

    // Add Plotly.js (peer dependency of dynsim)
    customScripts += '\n  <script src="https://cdn.plot.ly/plotly-2.27.0.min.js" defer></script>';

    // Add dynsim — handles simulator UI, Python bridge, and auto-init
    customScripts += '\n  <script src="/_static/js/dynsim.umd.js" defer></script>';

    // PyScript bootstrap: exec user Python code and register systems.
    // We wrap the step function ourselves with to_js conversion, then call
    // _dynsimJsRegister directly. This avoids a race condition where
    // dynsim's Python bridge may not have set up registerPythonSystem yet
    // (it wraps step with to_js; without it, Pyodide proxies leak through
    // and state["S"] spike detection breaks).
    const pyBootstrap = `
  <script type="py" config='{"packages":["numpy"]}'>
import numpy as np
from pyscript import window
from pyscript.ffi import create_proxy
from pyodide.ffi import to_js
from js import Object

def execute_dynsim_code(python_code_str, container_id, config):
    user_namespace = {"np": np, "numpy": np}
    exec(python_code_str, user_namespace)
    raw_step = user_namespace["step"]

    def wrapped_step(x, state, params):
        s = state.to_py() if hasattr(state, 'to_py') else state
        p = params.to_py() if hasattr(params, 'to_py') else params
        result = raw_step(float(x), s, p)
        return to_js(result, dict_converter=Object.fromEntries)

    # Always use _dynsimJsRegister (set by dynsim autoInit synchronously)
    # instead of registerPythonSystem (set by Python bridge, may not exist yet)
    window._dynsimJsRegister(container_id, create_proxy(wrapped_step), config)

window.executeDynSimCode = create_proxy(execute_dynsim_code)
  </script>`;
    customScripts += pyBootstrap;

    // SPA navigation handler: re-initialize dynsim containers after React
    // hydration rebuilds the DOM or SPA navigation renders new pages.
    // Uses DynSim.initializeContainer (singleton — destroys old controller
    // before creating a new one) to avoid overlapping Plotly calls.
    const spaObserver = `
  <script>
  (function() {
    // Poll for uninitialized containers every second.
    // Uses DynSim.initializeContainer (singleton — destroys old controller
    // before creating a new one) to avoid overlapping Plotly calls.
    async function pollForContainers() {
      if (!window.DynSim || !window.dynSimSystemsData) return;
      if (typeof Plotly === 'undefined') return;

      var containers = document.querySelectorAll('.dynsim-python-container');
      for (var i = 0; i < containers.length; i++) {
        var container = containers[i];
        var id = container.id;
        if (!id) continue;

        var systemData = window.dynSimSystemsData[id];
        if (!systemData) continue;

        // Skip if this exact DOM element already has a live controller
        if (container.querySelector('.dynsim-container')) continue;

        // System not registered yet — need to run Python code first
        if (!window.DynSim.registry.has(id)) {
          if (!window.executeDynSimCode) continue; // PyScript not ready yet
          console.log('[DynSim SPA] Registering new system:', id);
          try {
            window.executeDynSimCode(systemData.pythonCode, id, systemData.config);
          } catch (e) {
            console.error('[DynSim SPA] Error registering:', id, e);
            continue;
          }
          // executeDynSimCode → _dynsimJsRegister → initializeContainer (singleton)
          // Controller already created, done.
          continue;
        }

        // System registered but no controller on this element
        // (React hydration destroyed the old element, this is the new one)
        console.log('[DynSim SPA] Re-initializing:', id);
        window.DynSim.initializeContainer(id);
      }
    }
    setInterval(pollForContainers, 1000);

    if (document.body || document.readyState !== 'loading') pollForContainers();
  })();
  </script>`;
    customScripts += spaObserver;

    // Add custom CSS from _static/css
    if (fs.existsSync(customStaticPath)) {
      const cssPath = path.join(customStaticPath, 'css');
      if (fs.existsSync(cssPath)) {
        const cssFiles = fs.readdirSync(cssPath, { withFileTypes: true })
          .filter(dirent => dirent.isFile() && dirent.name.endsWith('.css'))
          .map(dirent => dirent.name);

        cssFiles.forEach(file => {
          customScripts += `\n  <link rel="stylesheet" href="/_static/css/${file}" />`;
        });
      }
    }

    // Add auto-generated dynsim systems data file
    if (fs.existsSync(customStaticPath)) {
      const jsPath = path.join(customStaticPath, 'js');
      if (fs.existsSync(jsPath)) {
        const dataFiles = fs.readdirSync(jsPath, { withFileTypes: true })
          .filter(dirent => dirent.isFile() && dirent.name.startsWith('0-dynsim') && dirent.name.endsWith('.js'))
          .map(dirent => dirent.name);

        dataFiles.forEach(file => {
          customScripts += `\n  <script src="/_static/js/${file}" defer></script>`;
        });
      }
    }

    // Note: injecting into </head> or </body> both cause React hydration errors (#418/#423)
    // because the pre-compiled Remix theme doesn't expect these elements. This is cosmetic —
    // React recovers by re-rendering. The real fix is upstream support for custom scripts in
    // the MyST book-theme template. Injecting in </head> is conventional and allows `defer`.
    return html.replace('</head>', `  ${customScripts}\n</head>`);
  }

  next();
});

app.all(
  '*',
  createRequestHandler({
    build: require(BUILD_DIR),
    mode: process.env.NODE_ENV,
  }),
);

async function start() {
  // Find an open port if the env is not specified
  const host = process.env.HOST || 'localhost';
  const port = process.env.PORT || (await getPort({ port: getPort.makeRange(3000, 3100) }));
  app.listen(port, host, () => {
    console.log(`Server started at http://${host}:${port}`);
  });
}

start();
