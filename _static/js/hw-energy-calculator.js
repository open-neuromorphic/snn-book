/* Progressive enhancement for fig:hw-energy-calculator.
 *
 * The static SVG is the print/PDF and no-JavaScript worked example. On the
 * website this script replaces it with a four-layer SENeCA IF energy estimate.
 */

(function () {
  'use strict';

  var SYNAPTIC_PJ = 12.7;
  var NEURON_FLOOR_PJ = 12.1;
  var EMITTED_SPIKE_PJ = 1.1;
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
    var activityId = 'seneca-activity-' + layerNumber + '-' + suffix;

    return [
      '<fieldset class="seneca-energy-layer">',
      '  <legend><span class="seneca-energy-layer-index" aria-hidden="true">' + layerNumber + '</span>Layer ' + layerNumber + '</legend>',
      '  <div class="seneca-energy-field">',
      '    <label for="' + neuronId + '">Neurons</label>',
      '    <input class="seneca-energy-neurons" id="' + neuronId + '" type="number" inputmode="numeric" min="1" max="' + MAX_NEURONS + '" step="1" value="' + DEFAULT_NEURONS[index] + '">',
      '  </div>',
      '  <div class="seneca-energy-field">',
      '    <div class="seneca-energy-density-row">',
      '      <label class="seneca-energy-density-heading" for="' + densityId + '">Spike density</label>',
      '      <output class="seneca-energy-density-value" id="' + densityOutputId + '" for="' + densityId + '">' + DEFAULT_DENSITY[index] + '%</output>',
      '    </div>',
      '    <input class="seneca-energy-density" id="' + densityId + '" type="range" min="0" max="100" step="1" value="' + DEFAULT_DENSITY[index] + '" aria-valuetext="' + DEFAULT_DENSITY[index] + ' percent firing">',
      '  </div>',
      '  <p class="seneca-energy-activity"><output id="' + activityId + '"></output></p>',
      '</fieldset>'
    ].join('');
  }

  function linkRowMarkup(index) {
    return [
      '<tr>',
      '  <td>Layer ' + (index + 1) + ' → Layer ' + (index + 2) + ' synaptic integration</td>',
      '  <td data-seneca-link-ops="' + index + '"></td>',
      '  <td data-seneca-link-energy="' + index + '"></td>',
      '</tr>'
    ].join('');
  }

  function enhanceFigure(figure) {
    if (!figure || figure.querySelector('.seneca-energy-calculator')) return;

    var fallbackImage = figure.querySelector('img');
    if (!fallbackImage) return;

    instanceCount += 1;
    var suffix = String(instanceCount);
    var titleId = 'seneca-energy-title-' + suffix;
    var totalId = 'seneca-energy-total-' + suffix;

    var calculator = document.createElement('section');
    calculator.className = 'seneca-energy-calculator';
    calculator.setAttribute('aria-labelledby', titleId);
    calculator.innerHTML = [
      '<div class="seneca-energy-header">',
      '  <h3 class="seneca-energy-title" id="' + titleId + '">SENeCA IF energy and power</h3>',
      '  <p class="seneca-energy-fixed-model">4 layers · integrate-and-fire · fully connected · Δt = 10 ms</p>',
      '</div>',
      '<form class="seneca-energy-form" novalidate>',
      '  <div class="seneca-energy-layers">',
      DEFAULT_NEURONS.map(function (_, index) { return layerMarkup(index, suffix); }).join(''),
      '  </div>',
      '</form>',
      '<p class="seneca-energy-definition">Spike density is the percentage of neurons that fire in this 10 ms time step: 0% means none fire; 100% means all fire. Layer 4 has no downstream layer here, so its density changes only emitted-spike capture.</p>',
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
      '      <span class="seneca-energy-chart-title">Current total energy on the all-active scale</span>',
      '      <span class="seneca-energy-dense-value" data-seneca-dense></span>',
      '    </div>',
      '    <div class="seneca-energy-track" data-seneca-track role="img">',
      '      <span class="seneca-energy-segment seneca-energy-segment-synaptic" data-seneca-segment="synaptic"></span>',
      '      <span class="seneca-energy-segment seneca-energy-segment-floor" data-seneca-segment="floor"></span>',
      '      <span class="seneca-energy-segment seneca-energy-segment-spike" data-seneca-segment="spike"></span>',
      '      <span class="seneca-energy-segment seneca-energy-segment-static" data-seneca-segment="static"></span>',
      '    </div>',
      '    <div class="seneca-energy-breakdown">',
      '      <div class="seneca-energy-breakdown-item">',
      '        <span class="seneca-energy-breakdown-label"><span class="seneca-energy-swatch seneca-energy-swatch-synaptic" aria-hidden="true"></span>Synaptic integration</span>',
      '        <output class="seneca-energy-breakdown-value" data-seneca-value="synaptic"></output>',
      '      </div>',
      '      <div class="seneca-energy-breakdown-item">',
      '        <span class="seneca-energy-breakdown-label"><span class="seneca-energy-swatch seneca-energy-swatch-floor" aria-hidden="true"></span>Neuron-update floor</span>',
      '        <output class="seneca-energy-breakdown-value" data-seneca-value="floor"></output>',
      '      </div>',
      '      <div class="seneca-energy-breakdown-item">',
      '        <span class="seneca-energy-breakdown-label"><span class="seneca-energy-swatch seneca-energy-swatch-spike" aria-hidden="true"></span>Emitted-spike capture</span>',
      '        <output class="seneca-energy-breakdown-value" data-seneca-value="spike"></output>',
      '      </div>',
      '      <div class="seneca-energy-breakdown-item">',
      '        <span class="seneca-energy-breakdown-label"><span class="seneca-energy-swatch seneca-energy-swatch-static" aria-hidden="true"></span>Core static power</span>',
      '        <output class="seneca-energy-breakdown-value" data-seneca-value="static"></output>',
      '      </div>',
      '    </div>',
      '  </div>',
      '</div>',
      '<div class="seneca-energy-table-wrap">',
      '  <table class="seneca-energy-table">',
      '    <thead><tr><th scope="col">Energy term</th><th scope="col">Expected operations / step</th><th scope="col">Energy / step</th></tr></thead>',
      '    <tbody>',
      [0, 1, 2].map(linkRowMarkup).join(''),
      '      <tr><td>Neuron-update floor</td><td data-seneca-floor-ops></td><td data-seneca-floor-energy></td></tr>',
      '      <tr><td>Emitted-spike increment</td><td data-seneca-spike-ops></td><td data-seneca-spike-energy></td></tr>',
      '      <tr><td>Core static power (one core)</td><td>30 µW × 10 ms</td><td data-seneca-static-energy></td></tr>',
      '    </tbody>',
      '  </table>',
      '</div>',
      '<p class="seneca-energy-formula"><strong>Estimate:</strong> 12.7 pJ × active synaptic operations + 12.1 pJ × neuron updates + 1.1 pJ × emitted spikes + 30 µW × 10 ms. Average total power is total energy divided by the 10 ms time step.</p>',
      '<p class="seneca-energy-assumptions">Expected-value model for BF16 one-event processing on the paper’s GF-22 nm FDX SENeCA design. It covers the four selected IF populations, their three internal dense projections, and the paper’s approximately 30 µW static/leakage power for one core. Each additional mapped core would add another static term. Input encoding, the projection into Layer 1, weight sparsity, RISC-V pre/post-processing, NoC communication, external-memory traffic, and learning are excluded.</p>'
    ].join('');

    var caption = figure.querySelector('figcaption');
    if (caption) {
      figure.insertBefore(calculator, caption);
    } else {
      figure.appendChild(calculator);
    }

    var fallback = topLevelFallback(fallbackImage, figure);
    fallback.classList.add('seneca-energy-static-fallback');
    fallback.style.display = 'none';
    if (fallbackImage !== fallback) {
      fallbackImage.classList.add('seneca-energy-static-fallback');
      fallbackImage.style.display = 'none';
    }

    var form = calculator.querySelector('.seneca-energy-form');
    var neuronInputs = Array.prototype.slice.call(calculator.querySelectorAll('.seneca-energy-neurons'));
    var densityInputs = Array.prototype.slice.call(calculator.querySelectorAll('.seneca-energy-density'));
    var densityOutputs = Array.prototype.slice.call(calculator.querySelectorAll('.seneca-energy-density-value'));
    var activityOutputs = Array.prototype.slice.call(calculator.querySelectorAll('.seneca-energy-activity output'));
    var totalOutput = calculator.querySelector('.seneca-energy-total');
    var powerOutput = calculator.querySelector('[data-seneca-power]');
    var comparisonOutput = calculator.querySelector('[data-seneca-comparison]');
    var denseOutput = calculator.querySelector('[data-seneca-dense]');
    var track = calculator.querySelector('[data-seneca-track]');
    var segments = {
      synaptic: calculator.querySelector('[data-seneca-segment="synaptic"]'),
      floor: calculator.querySelector('[data-seneca-segment="floor"]'),
      spike: calculator.querySelector('[data-seneca-segment="spike"]'),
      static: calculator.querySelector('[data-seneca-segment="static"]')
    };
    var breakdownValues = {
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

      activeNeurons.forEach(function (count, index) {
        activityOutputs[index].textContent = formatCount(count) + ' active expected / step';
      });

      var synapticOperations = [0, 1, 2].map(function (index) {
        return activeNeurons[index] * neurons[index + 1];
      });
      var synapticEnergy = synapticOperations.reduce(function (sum, count) {
        return sum + count * SYNAPTIC_PJ;
      }, 0);
      var neuronUpdates = neurons.reduce(function (sum, count) { return sum + count; }, 0);
      var floorEnergy = neuronUpdates * NEURON_FLOOR_PJ;
      var emittedSpikes = activeNeurons.reduce(function (sum, count) { return sum + count; }, 0);
      var emittedSpikeEnergy = emittedSpikes * EMITTED_SPIKE_PJ;
      var dynamicEnergy = synapticEnergy + floorEnergy + emittedSpikeEnergy;
      var totalEnergy = dynamicEnergy + STATIC_ENERGY_PJ;

      var denseSynapticOperations = neurons[0] * neurons[1] +
        neurons[1] * neurons[2] + neurons[2] * neurons[3];
      var denseDynamicEnergy = denseSynapticOperations * SYNAPTIC_PJ +
        floorEnergy + neuronUpdates * EMITTED_SPIKE_PJ;
      var denseEnergy = denseDynamicEnergy + STATIC_ENERGY_PJ;
      var currentPercent = denseEnergy > 0 ? totalEnergy / denseEnergy * 100 : 0;
      var savingPercent = Math.max(0, 100 - currentPercent);

      totalOutput.textContent = formatEnergy(totalEnergy);
      powerOutput.textContent = formatPower(totalEnergy);
      comparisonOutput.textContent = formatSignificant(savingPercent, 3) + '% below the all-active total';
      denseOutput.textContent = 'all active: ' + formatEnergy(denseEnergy) + ' · ' + formatPower(denseEnergy);

      segments.synaptic.style.width = (synapticEnergy / denseEnergy * 100) + '%';
      segments.floor.style.width = (floorEnergy / denseEnergy * 100) + '%';
      segments.spike.style.width = (emittedSpikeEnergy / denseEnergy * 100) + '%';
      segments.static.style.width = (STATIC_ENERGY_PJ / denseEnergy * 100) + '%';
      breakdownValues.synaptic.textContent = formatEnergy(synapticEnergy);
      breakdownValues.floor.textContent = formatEnergy(floorEnergy);
      breakdownValues.spike.textContent = formatEnergy(emittedSpikeEnergy);
      breakdownValues.static.textContent = formatEnergy(STATIC_ENERGY_PJ) + ' · ' + formatPower(STATIC_ENERGY_PJ);

      track.setAttribute('aria-label', 'Current total energy is ' + formatEnergy(totalEnergy) +
        ' per 10 millisecond time step, corresponding to ' + formatPower(totalEnergy) +
        ' average total power, compared with the all-active total of ' + formatEnergy(denseEnergy) +
        '. Synaptic integration uses ' + formatEnergy(synapticEnergy) +
        ', the neuron-update floor uses ' + formatEnergy(floorEnergy) +
        ', emitted-spike capture uses ' + formatEnergy(emittedSpikeEnergy) +
        ', and the fixed single-core static term uses ' + formatEnergy(STATIC_ENERGY_PJ) + '.');

      synapticOperations.forEach(function (count, index) {
        calculator.querySelector('[data-seneca-link-ops="' + index + '"]').textContent =
          formatCount(count) + ' synaptic ops';
        calculator.querySelector('[data-seneca-link-energy="' + index + '"]').textContent =
          formatEnergy(count * SYNAPTIC_PJ);
      });
      calculator.querySelector('[data-seneca-floor-ops]').textContent = formatCount(neuronUpdates) + ' updates';
      calculator.querySelector('[data-seneca-floor-energy]').textContent = formatEnergy(floorEnergy);
      calculator.querySelector('[data-seneca-spike-ops]').textContent = formatCount(emittedSpikes) + ' spikes';
      calculator.querySelector('[data-seneca-spike-energy]').textContent = formatEnergy(emittedSpikeEnergy);
      calculator.querySelector('[data-seneca-static-energy]').textContent = formatEnergy(STATIC_ENERGY_PJ);
    }

    form.addEventListener('submit', function (event) { event.preventDefault(); });
    form.addEventListener('input', update);
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
