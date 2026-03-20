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

    // Add dynsim from CDN — handles simulator UI, Python bridge, and auto-init
    customScripts += '\n  <script src="https://unpkg.com/dynsim@0.2.0" defer></script>';

    // Minimal PyScript bootstrap: exec user Python code and register systems
    // (type conversion is handled by dynsim's built-in Python bridge)
    const pyBootstrap = `
  <script type="py" config='{"packages":["numpy"]}'>
import numpy as np
from pyscript import window
from pyscript.ffi import create_proxy

def execute_dynsim_code(python_code_str, container_id, config):
    user_namespace = {"np": np, "numpy": np}
    exec(python_code_str, user_namespace)
    step = user_namespace["step"]
    window.registerPythonSystem(container_id, create_proxy(step), config)

window.executeDynSimCode = create_proxy(execute_dynsim_code)
  </script>`;
    customScripts += pyBootstrap;

    // MutationObserver for SPA navigation: initialize dynsim containers added after page load
    // Only triggers when a .dynsim-python-container is actually found in added nodes
    const spaObserver = `
  <script>
  (function() {
    console.log('[DynSim SPA] Observer script loaded');
    var pending = {};

    async function initializeContainer(container) {
      var id = container.id;
      if (!id || !window.dynSimSystemsData) return;
      var systemData = window.dynSimSystemsData[id];
      if (!systemData) return;
      if (container.querySelector('.dynsim-container')) return;
      if (pending[id]) return;
      pending[id] = true;

      var attempts = 0;
      while (!window.executeDynSimCode && attempts < 40) {
        await new Promise(function(r) { setTimeout(r, 500); });
        attempts++;
      }
      if (!window.executeDynSimCode) {
        console.error('[DynSim SPA] executeDynSimCode not available after waiting');
        return;
      }

      console.log('[DynSim SPA] Initializing container:', id);
      try {
        window.executeDynSimCode(systemData.pythonCode, id, systemData.config);
      } catch (e) {
        console.error('[DynSim SPA] Error initializing container:', id, e);
      }
    }

    function checkNode(node) {
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      var containers = [];
      if (node.matches && node.matches('.dynsim-python-container')) {
        containers.push(node);
      }
      if (node.querySelectorAll) {
        var found = node.querySelectorAll('.dynsim-python-container');
        for (var i = 0; i < found.length; i++) containers.push(found[i]);
      }
      for (var j = 0; j < containers.length; j++) {
        // Small delay to let React finish the current commit
        (function(c) { setTimeout(function() { initializeContainer(c); }, 100); })(containers[j]);
      }
    }

    var observer = new MutationObserver(function(mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var added = mutations[i].addedNodes;
        for (var j = 0; j < added.length; j++) {
          checkNode(added[j]);
        }
      }
    });

    // Polling fallback: scan for uninitialized containers every second
    // Catches containers that the MutationObserver misses (e.g. SPA navigation
    // where React's client-side render doesn't trigger addedNodes for type:'html')
    function pollForContainers() {
      // Clear pending flags for containers no longer in the DOM (SPA navigated away)
      for (var key in pending) {
        if (!document.getElementById(key)) delete pending[key];
      }
      var containers = document.querySelectorAll('.dynsim-python-container');
      for (var i = 0; i < containers.length; i++) {
        var c = containers[i];
        if (c.id && !c.querySelector('.dynsim-container')) {
          initializeContainer(c);
        }
      }
    }
    setInterval(pollForContainers, 1000);

    function startObserving() {
      console.log('[DynSim SPA] MutationObserver started');
      observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
    }

    if (document.body) startObserving();
    else document.addEventListener('DOMContentLoaded', startObserving);
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
