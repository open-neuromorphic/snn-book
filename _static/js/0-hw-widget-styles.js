/* Shared helpers for hardware-chapter progressive widgets.
 * Filename is prefixed with 0- so server.js injects it before other scripts.
 */
(function (global) {
  'use strict';

  var hwWidgets = global.hwWidgets || (global.hwWidgets = {});

  function stylesheetLoaded(link) {
    try {
      return !!(link && link.sheet && link.sheet.cssRules);
    } catch (error) {
      // Cross-origin or still parsing: treat a non-null sheet as loaded enough.
      try {
        return !!(link && link.sheet);
      } catch (ignored) {
        return false;
      }
    }
  }

  hwWidgets.withStylesheet = function withStylesheet(href, callback) {
    var done = false;
    function finish() {
      if (done) return;
      done = true;
      callback();
    }

    function waitFor(link) {
      if (stylesheetLoaded(link)) {
        finish();
        return;
      }

      link.addEventListener('load', finish, { once: true });
      link.addEventListener('error', finish, { once: true });

      var attempts = 0;
      var poll = window.setInterval(function () {
        attempts += 1;
        if (stylesheetLoaded(link) || attempts >= 20) {
          window.clearInterval(poll);
          finish();
        }
      }, 50);
    }

    var existing = document.querySelector('link[href="' + href + '"]');
    if (existing) {
      waitFor(existing);
      return;
    }

    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
    waitFor(link);
  };

  hwWidgets.hideFallback = function hideFallback(fallback, image) {
    if (!fallback) return;
    fallback.setAttribute('hidden', '');
    fallback.style.display = 'none';
    if (image && image !== fallback) {
      image.setAttribute('hidden', '');
      image.style.display = 'none';
    }
  };
}(window));
