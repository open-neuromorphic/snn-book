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

// Resolve the book root from this file's location or the process cwd.
// jupyter-book may start the theme server with different working directories,
// so counting `..` from cwd alone is brittle and can make `/_static` 404.
function findProjectRoot(startDir) {
  let dir = path.resolve(startDir);
  for (let i = 0; i < 12; i += 1) {
    if (
      fs.existsSync(path.join(dir, 'myst.yml')) &&
      fs.existsSync(path.join(dir, '_static'))
    ) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

const PROJECT_ROOT =
  findProjectRoot(__dirname) ||
  findProjectRoot(process.cwd()) ||
  path.resolve(process.cwd(), '..', '..', '..', '..', '..');

const app = express();

app.use(compression());

// http://expressjs.com/en/advanced/best-practice-security.html#at-a-minimum-disable-x-powered-by-header
app.disable('x-powered-by');

// Serve custom static files from project root _static directory
const customStaticPath = path.join(PROJECT_ROOT, '_static');
if (fs.existsSync(customStaticPath)) {
  app.use('/_static', express.static(customStaticPath, { maxAge: 0, etag: false, lastModified: false }));
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

    // Add PyScript first (CSS + JS) for Python-powered visualizations
    customScripts += '\n  <link rel="stylesheet" href="https://pyscript.net/releases/2026.1.1/core.css" />';
    customScripts += '\n  <script type="module" src="https://pyscript.net/releases/2026.1.1/core.js"></script>';

    // Add PyScript bootstrap that will execute user dynamical systems code
    const pyBootstrap = `
  <script type="py" config='{"packages":["numpy"]}'>
import numpy as np
from pyscript import window
from pyscript.ffi import create_proxy

# Global function to execute user Python code and register systems
def execute_dynsim_code(python_code_str, container_id, config_js):
    """Execute user's Python code and register the system."""
    # Create namespace for user code with numpy
    user_namespace = {"np": np, "numpy": np}

    # Execute user code to get step function
    exec(python_code_str, user_namespace)
    step = user_namespace["step"]

    # Wrapper to convert JsProxy to Python dicts
    def step_wrapper(x, state_js, p_js):
        # Convert JS objects to Python dicts
        state = state_js.to_py() if hasattr(state_js, 'to_py') else dict(state_js)
        p = p_js.to_py() if hasattr(p_js, 'to_py') else dict(p_js)

        # Call user's step function with plain dicts
        x_new, state_new = step(x, state, p)

        return (x_new, state_new)

    # Register with JavaScript
    window.registerPythonSystem(container_id, create_proxy(step_wrapper), config_js)

# Expose to JavaScript
window.executeDynSimCode = create_proxy(execute_dynsim_code)
print("[PyScript Bootstrap] Dynamical systems executor ready")
  </script>`;
    customScripts += pyBootstrap;

    // Then add Plotly.js with defer to ensure it loads before dependent scripts
    customScripts += '\n  <script src="https://cdn.plot.ly/plotly-2.27.0.min.js" defer></script>';

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

    // Add custom scripts from _static/js with defer to maintain execution order
    if (fs.existsSync(customStaticPath)) {
      const jsPath = path.join(customStaticPath, 'js');
      if (fs.existsSync(jsPath)) {
        const staticFiles = fs.readdirSync(jsPath, { withFileTypes: true })
          .filter(dirent =>
            dirent.isFile() &&
            dirent.name.endsWith('.js') &&
            dirent.name !== 'server.js'
          )
          .map(dirent => dirent.name)
          .sort();

        staticFiles.forEach(file => {
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
