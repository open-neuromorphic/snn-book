/* Progressive enhancement for fig:hw-energy-calculator.
 *
 * The static SVG is the print/PDF and no-JavaScript worked example. On the
 * website this script replaces it with a four-layer SENeCA IF energy estimate.
 */

(function () {
  'use strict';

  var SYNAPTIC_MODES = [
    {
      id: 'bf16',
      label: 'BF16',
      picojoules: 12.7,
      description: 'BF16 weights and accumulation.'
    },
    {
      id: 'int8',
      label: 'INT8 weights → BF16 accumulation',
      picojoules: 11.95,
      description: 'INT8 weights are unpacked and converted for BF16 accumulation.'
    },
    {
      id: 'int4',
      label: 'INT4 weights → BF16 accumulation',
      picojoules: 11.03,
      description: 'INT4 weights are unpacked and converted for BF16 accumulation.'
    },
    {
      id: 'int4-integer',
      label: 'INT4 weights + INT8 integer accumulation',
      picojoules: 5.63,
      description: 'INT4 weights use an INT8 neuron state and integer arithmetic.'
    }
  ];
  var DEFAULT_SYNAPTIC_MODE = 'bf16';
  var INPUT_EVENT_HANDLING_PJ = 600;
  var NEURON_TIMESTEP_PJ = 12.1;
  var OUTPUT_EVENT_PJ = 100;
  var TIME_STEP_SECONDS = 0.01;
  var STATIC_POWER_WATTS = 30e-6;
  var STATIC_ENERGY_PJ = STATIC_POWER_WATTS * TIME_STEP_SECONDS * 1e12;
  var DEFAULT_NEURONS = [256, 128, 64, 10];
  var DEFAULT_DENSITY = [10, 10, 10, 10];
  var MAX_NEURONS = 1000000;
  var instanceCount = 0;

  function topLevelFallback(image, figure) {
    var candidate = image.closest('picture') || image.closest('a') || image;
    if (!figure.contains(candidate)) return image;
    return candidate;
  }

  function formatSignificant(value, digits) {
    if (!Number.isFinite(value)) return '—';
    return new Intl.NumberFormat(undefined, {
      maximumSignificantDigits: digits || 4
    }).format(value);
  }

  function formatCount(value) {
    if (!Number.isFinite(value)) return '—';
    return new Intl.NumberFormat(undefined, {
      maximumFractionDigits: value < 100000 ? 1 : 0
    }).format(value);
  }

  function formatEnergy(picojoules) {
    var value = picojoules;
    var unit = 'pJ';

    if (picojoules >= 1e9) {
      value = picojoules / 1e9;
      unit = 'mJ';
    } else if (picojoules >= 1e6) {
      value = picojoules / 1e6;
      unit = 'µJ';
    } else if (picojoules >= 1e3) {
      value = picojoules / 1e3;
      unit = 'nJ';
    }

    return formatSignificant(value, 4) + ' ' + unit;
  }

  function formatPower(picojoulesPerStep) {
    var watts = picojoulesPerStep * 1e-12 / TIME_STEP_SECONDS;
    var value = watts;
    var unit = 'W';

    if (watts < 1e-9) {
      value = watts * 1e12;
      unit = 'pW';
    } else if (watts < 1e-6) {
      value = watts * 1e9;
      unit = 'nW';
    } else if (watts < 1e-3) {
      value = watts * 1e6;
      unit = 'µW';
    } else if (watts < 1) {
      value = watts * 1e3;
      unit = 'mW';
    }

    return formatSignificant(value, 4) + ' ' + unit;
  }

  function layerMarkup(index, suffix) {
    var layerNumber = index + 1;
    var neuronId = 'seneca-neurons-' + layerNumber + '-' + suffix;
    var densityId = 'seneca-density-' + layerNumber + '-' + suffix;
    var densityOutputId = 'seneca-density-output-' + layerNumber + '-' + suffix;

    return [
      '<fieldset class="seneca-energy-layer">',
      '  <legend>Layer ' + layerNumber + '</legend>',
      '  <div class="seneca-energy-field">',
      '    <label for="' + neuronId + '">Neurons</label>',
      '    <input class="seneca-energy-neurons" id="' + neuronId + '" type="number" inputmode="numeric" min="1" max="' + MAX_NEURONS + '" step="1" value="' + DEFAULT_NEURONS[index] + '">',
      '  </div>',
      '  <div class="seneca-energy-field">',
      '    <label class="seneca-energy-density-heading" for="' + densityId + '">Spike density</label>',
      '    <div class="seneca-energy-density-controls">',
      '      <input class="seneca-energy-density" id="' + densityId + '" type="range" min="0" max="100" step="1" value="' + DEFAULT_DENSITY[index] + '" aria-valuetext="' + DEFAULT_DENSITY[index] + ' percent firing">',
      '      <output class="seneca-energy-density-value" id="' + densityOutputId + '" for="' + densityId + '">' + DEFAULT_DENSITY[index] + '%</output>',
      '    </div>',
      '  </div>',
      '</fieldset>'
    ].join('');
  }

  function synapticModeMarkup() {
    return SYNAPTIC_MODES.map(function (mode) {
      var selected = mode.id === DEFAULT_SYNAPTIC_MODE ? ' selected' : '';
      return '<option value="' + mode.id + '"' + selected + '>' + mode.label + '</option>';
    }).join('');
  }

  function enhanceFigure(figure) {
    if (!figure || figure.querySelector('.seneca-energy-calculator')) return;

    var fallbackImage = figure.querySelector('img');
    if (!fallbackImage) return;

    instanceCount += 1;
    var suffix = String(instanceCount);
    var totalId = 'seneca-energy-total-' + suffix;
    var modeId = 'seneca-energy-mode-' + suffix;

    var calculator = document.createElement('section');
    calculator.className = 'seneca-energy-calculator';
    calculator.hidden = true;
    calculator.setAttribute('aria-label', 'Interactive SENeCA energy calculator');
    calculator.innerHTML = [
      '<form class="seneca-energy-form" novalidate>',
      '  <div class="seneca-energy-mode-row">',
      '    <div class="seneca-energy-mode-field">',
      '      <label for="' + modeId + '">Synaptic weight / accumulation precision</label>',
      '      <select class="seneca-energy-mode" id="' + modeId + '">',
      synapticModeMarkup(),
      '      </select>',
      '    </div>',
      '  </div>',
      '  <div class="seneca-energy-layers">',
      DEFAULT_NEURONS.map(function (_, index) { return layerMarkup(index, suffix); }).join(''),
      '  </div>',
      '</form>',
      '<div class="seneca-energy-results">',
      '  <div class="seneca-energy-primary">',
      '    <span class="seneca-energy-result-label">Estimated total energy</span>',
      '    <output class="seneca-energy-total" id="' + totalId + '" aria-live="polite"></output>',
      '    <span class="seneca-energy-per-step">per 10 ms time step</span>',
      '    <span class="seneca-energy-power-label">Average total power</span>',
      '    <output class="seneca-energy-power" data-seneca-power></output>',
      '    <span class="seneca-energy-comparison" data-seneca-comparison></span>',
      '  </div>',
      '  <div class="seneca-energy-chart">',
      '    <div class="seneca-energy-chart-heading">',
      '      <span class="seneca-energy-chart-title">Share of estimated total energy</span>',
      '    </div>',
      '    <div class="seneca-energy-track" data-seneca-track role="img">',
      '      <span class="seneca-energy-segment seneca-energy-segment-handling" data-seneca-segment="handling"></span>',
      '      <span class="seneca-energy-segment seneca-energy-segment-synaptic" data-seneca-segment="synaptic"></span>',
      '      <span class="seneca-energy-segment seneca-energy-segment-floor" data-seneca-segment="floor"></span>',
      '      <span class="seneca-energy-segment seneca-energy-segment-spike" data-seneca-segment="spike"></span>',
      '      <span class="seneca-energy-segment seneca-energy-segment-static" data-seneca-segment="static"></span>',
      '    </div>',
      '    <div class="seneca-energy-breakdown">',
      '      <div class="seneca-energy-breakdown-item">',
      '        <span class="seneca-energy-breakdown-label"><span class="seneca-energy-swatch seneca-energy-swatch-handling" aria-hidden="true"></span><span>Input-event handling (0.6 nJ)</span></span>',
      '        <output class="seneca-energy-breakdown-value" data-seneca-value="handling"></output>',
      '      </div>',
      '      <div class="seneca-energy-breakdown-item">',
      '        <span class="seneca-energy-breakdown-label"><span class="seneca-energy-swatch seneca-energy-swatch-synaptic" aria-hidden="true"></span><span>Synaptic integration <span data-seneca-cost="synaptic"></span></span></span>',
      '        <output class="seneca-energy-breakdown-value" data-seneca-value="synaptic"></output>',
      '      </div>',
      '      <div class="seneca-energy-breakdown-item">',
      '        <span class="seneca-energy-breakdown-label"><span class="seneca-energy-swatch seneca-energy-swatch-floor" aria-hidden="true"></span><span>Activation / leak (12.1 pJ)</span></span>',
      '        <output class="seneca-energy-breakdown-value" data-seneca-value="floor"></output>',
      '      </div>',
      '      <div class="seneca-energy-breakdown-item">',
      '        <span class="seneca-energy-breakdown-label"><span class="seneca-energy-swatch seneca-energy-swatch-spike" aria-hidden="true"></span><span>Output event generation (0.1 nJ)</span></span>',
      '        <output class="seneca-energy-breakdown-value" data-seneca-value="spike"></output>',
      '      </div>',
      '      <div class="seneca-energy-breakdown-item">',
      '        <span class="seneca-energy-breakdown-label"><span class="seneca-energy-swatch seneca-energy-swatch-static" aria-hidden="true"></span><span>Core static power (30 µW)</span></span>',
      '        <output class="seneca-energy-breakdown-value" data-seneca-value="static"></output>',
      '      </div>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('');

    var caption = figure.querySelector('figcaption');
    if (caption) {
      figure.insertBefore(calculator, caption);
    } else {
      figure.appendChild(calculator);
    }

    var fallback = topLevelFallback(fallbackImage, figure);
    fallback.classList.add('seneca-energy-static-fallback');
    if (window.hwWidgets && window.hwWidgets.hideFallback) {
      window.hwWidgets.hideFallback(fallback, fallbackImage);
    } else {
      fallback.setAttribute('hidden', '');
      fallback.style.display = 'none';
      if (fallbackImage !== fallback) {
        fallbackImage.setAttribute('hidden', '');
        fallbackImage.style.display = 'none';
      }
    }

    var form = calculator.querySelector('.seneca-energy-form');
    var modeSelect = calculator.querySelector('.seneca-energy-mode');
    var neuronInputs = Array.prototype.slice.call(calculator.querySelectorAll('.seneca-energy-neurons'));
    var densityInputs = Array.prototype.slice.call(calculator.querySelectorAll('.seneca-energy-density'));
    var densityOutputs = Array.prototype.slice.call(calculator.querySelectorAll('.seneca-energy-density-value'));
    var totalOutput = calculator.querySelector('.seneca-energy-total');
    var powerOutput = calculator.querySelector('[data-seneca-power]');
    var comparisonOutput = calculator.querySelector('[data-seneca-comparison]');
    var synapticCostOutput = calculator.querySelector('[data-seneca-cost="synaptic"]');
    var track = calculator.querySelector('[data-seneca-track]');
    var segments = {
      handling: calculator.querySelector('[data-seneca-segment="handling"]'),
      synaptic: calculator.querySelector('[data-seneca-segment="synaptic"]'),
      floor: calculator.querySelector('[data-seneca-segment="floor"]'),
      spike: calculator.querySelector('[data-seneca-segment="spike"]'),
      static: calculator.querySelector('[data-seneca-segment="static"]')
    };
    var breakdownValues = {
      handling: calculator.querySelector('[data-seneca-value="handling"]'),
      synaptic: calculator.querySelector('[data-seneca-value="synaptic"]'),
      floor: calculator.querySelector('[data-seneca-value="floor"]'),
      spike: calculator.querySelector('[data-seneca-value="spike"]'),
      static: calculator.querySelector('[data-seneca-value="static"]')
    };

    function readNeuronCounts() {
      var valid = true;
      var counts = neuronInputs.map(function (input) {
        var value = Number(input.value);
        var isValid = input.value.trim() !== '' && Number.isFinite(value) &&
          Number.isSafeInteger(value) && value >= 1 && value <= MAX_NEURONS;
        input.setAttribute('aria-invalid', isValid ? 'false' : 'true');
        if (!isValid) valid = false;
        return value;
      });
      return valid ? counts : null;
    }

    function showInvalidState() {
      totalOutput.textContent = 'Enter valid neuron counts';
      powerOutput.textContent = '—';
      comparisonOutput.textContent = 'Use whole numbers from 1 to ' + formatCount(MAX_NEURONS) + '.';
      track.removeAttribute('aria-label');
    }

    function update() {
      var neurons = readNeuronCounts();
      if (!neurons) {
        showInvalidState();
        return;
      }

      var synapticMode = SYNAPTIC_MODES.find(function (mode) {
        return mode.id === modeSelect.value;
      }) || SYNAPTIC_MODES[0];
      var synapticPicojoules = synapticMode.picojoules;

      var density = densityInputs.map(function (input, index) {
        var value = Math.min(100, Math.max(0, Number(input.value)));
        densityOutputs[index].textContent = formatSignificant(value, 4) + '%';
        input.setAttribute('aria-valuetext', formatSignificant(value, 4) + ' percent firing');
        return value;
      });
      var activity = density.map(function (value) {
        return Math.min(1, Math.max(0, value / 100));
      });
      var activeNeurons = neurons.map(function (count, index) {
        return count * activity[index];
      });

      var synapticOperations = [0, 1, 2].map(function (index) {
        return activeNeurons[index] * neurons[index + 1];
      });
      var synapticEnergy = synapticOperations.reduce(function (sum, count) {
        return sum + count * synapticPicojoules;
      }, 0);
      var handledInputEvents = activeNeurons[0] + activeNeurons[1] + activeNeurons[2];
      var inputEventHandlingEnergy = handledInputEvents * INPUT_EVENT_HANDLING_PJ;
      var neuronUpdates = neurons.reduce(function (sum, count) { return sum + count; }, 0);
      var floorEnergy = neuronUpdates * NEURON_TIMESTEP_PJ;
      var outputEvents = activeNeurons.reduce(function (sum, count) { return sum + count; }, 0);
      var outputEventEnergy = outputEvents * OUTPUT_EVENT_PJ;
      var dynamicEnergy = inputEventHandlingEnergy + synapticEnergy + floorEnergy + outputEventEnergy;
      var totalEnergy = dynamicEnergy + STATIC_ENERGY_PJ;

      var denseSynapticOperations = neurons[0] * neurons[1] +
        neurons[1] * neurons[2] + neurons[2] * neurons[3];
      var denseHandledInputEvents = neurons[0] + neurons[1] + neurons[2];
      var denseInputEventHandlingEnergy = denseHandledInputEvents * INPUT_EVENT_HANDLING_PJ;
      var denseDynamicEnergy = denseSynapticOperations * synapticPicojoules +
        denseInputEventHandlingEnergy + floorEnergy + neuronUpdates * OUTPUT_EVENT_PJ;
      var denseEnergy = denseDynamicEnergy + STATIC_ENERGY_PJ;
      var currentPercent = denseEnergy > 0 ? totalEnergy / denseEnergy * 100 : 0;
      var savingPercent = Math.max(0, 100 - currentPercent);
      var scale = totalEnergy > 0 ? totalEnergy : 1;

      totalOutput.textContent = formatEnergy(totalEnergy);
      powerOutput.textContent = formatPower(totalEnergy);
      comparisonOutput.textContent = formatSignificant(savingPercent, 3) + '% below the zero-sparsity case';
      synapticCostOutput.textContent = '(' + formatSignificant(synapticPicojoules, 4) + ' pJ)';

      segments.handling.style.width = (inputEventHandlingEnergy / scale * 100) + '%';
      segments.synaptic.style.width = (synapticEnergy / scale * 100) + '%';
      segments.floor.style.width = (floorEnergy / scale * 100) + '%';
      segments.spike.style.width = (outputEventEnergy / scale * 100) + '%';
      segments.static.style.width = (STATIC_ENERGY_PJ / scale * 100) + '%';
      breakdownValues.handling.textContent = formatEnergy(inputEventHandlingEnergy);
      breakdownValues.synaptic.textContent = formatEnergy(synapticEnergy);
      breakdownValues.floor.textContent = formatEnergy(floorEnergy);
      breakdownValues.spike.textContent = formatEnergy(outputEventEnergy);
      breakdownValues.static.textContent = formatEnergy(STATIC_ENERGY_PJ);

      track.setAttribute('aria-label', 'Estimated total energy is ' + formatEnergy(totalEnergy) +
        ' per 10 millisecond time step, corresponding to ' + formatPower(totalEnergy) +
        ' average total power, which is ' + formatSignificant(savingPercent, 3) +
        '% below the zero-sparsity case of ' + formatEnergy(denseEnergy) +
        '. Input-event handling uses ' + formatEnergy(inputEventHandlingEnergy) +
        ', the selected ' + synapticMode.label + ' mode makes synaptic integration use ' + formatEnergy(synapticEnergy) +
        ', activation and leak updates use ' + formatEnergy(floorEnergy) +
        ', output event generation uses ' + formatEnergy(outputEventEnergy) +
        ', and the fixed single-core static term uses ' + formatEnergy(STATIC_ENERGY_PJ) + '.');
    }

    form.addEventListener('submit', function (event) { event.preventDefault(); });
    form.addEventListener('input', update);
    modeSelect.addEventListener('change', update);
    neuronInputs.forEach(function (input, index) {
      input.addEventListener('change', function () {
        var value = Number(input.value);
        if (!Number.isFinite(value)) value = DEFAULT_NEURONS[index];
        value = Math.min(MAX_NEURONS, Math.max(1, Math.round(value)));
        input.value = String(value);
        update();
      });
    });

    update();
    figure.classList.add('hw-energy-calculator-enhanced');

    function revealCalculator() {
      calculator.hidden = false;
    }

    if (window.hwWidgets && window.hwWidgets.withStylesheet) {
      window.hwWidgets.withStylesheet('/_static/css/hw-energy-calculator.css', revealCalculator);
    } else {
      revealCalculator();
    }
  }

  function initializeFigures() {
    document.querySelectorAll(
      'figure.hw-energy-calculator-interactive, figure#fig-hw-energy-calculator'
    ).forEach(enhanceFigure);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFigures, { once: true });
  } else {
    initializeFigures();
  }

  var mutationObserver = new MutationObserver(function () {
    initializeFigures();
  });
  mutationObserver.observe(document.documentElement, { childList: true, subtree: true });
}());
