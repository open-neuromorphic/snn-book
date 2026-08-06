/* Progressive enhancement for fig:hw-mux.
 *
 * The normal MyST figure remains the print/PDF and no-JavaScript fallback.
 * On the website this script replaces its image with a responsive animation
 * of a selectable number of physical neuron circuits shared by Layers 2 and 3.
 */

(function () {
  'use strict';

  var SVG_NS = 'http://www.w3.org/2000/svg';
  var N_INPUT = 5;
  var N_HIDDEN = 8;
  var N_OUTPUT = 8;
  var DEFAULT_PHYSICAL_NEURONS = 1;
  var PHYSICAL_NEURON_OPTIONS = [1, 2, 4];
  var FIRE_PROBABILITY = 0.25;
  var instanceCount = 0;

  function svgElement(name, attributes) {
    var element = document.createElementNS(SVG_NS, name);
    Object.keys(attributes || {}).forEach(function (key) {
      element.setAttribute(key, attributes[key]);
    });
    return element;
  }

  function evenlySpaced(count, top, bottom) {
    if (count === 1) return [(top + bottom) / 2];
    var step = (bottom - top) / (count - 1);
    return Array.from({ length: count }, function (_, index) {
      return top + index * step;
    });
  }

  function topLevelFallback(image, figure) {
    var candidate = image.closest('picture') || image.closest('a') || image;
    if (!figure.contains(candidate)) return image;
    return candidate;
  }

  function enhanceFigure(figure) {
    if (!figure || figure.querySelector('.hw-mux-simulator')) return;

    var fallbackImage = figure.querySelector('img');
    if (!fallbackImage) return;

    instanceCount += 1;
    var suffix = String(instanceCount);
    var summaryId = 'hw-mux-summary-' + suffix;
    var physicalNeuronLabelId = 'hw-mux-p-label-' + suffix;
    var physicalNeuronGroupName = 'hw-mux-p-' + suffix;
    var titleId = 'hw-mux-title-' + suffix;
    var descriptionId = 'hw-mux-description-' + suffix;
    var physicalNeurons = DEFAULT_PHYSICAL_NEURONS;

    var simulator = document.createElement('section');
    simulator.className = 'hw-mux-simulator';
    simulator.hidden = true;
    simulator.setAttribute('aria-label', 'Interactive time-multiplexing scheduler');
    simulator.innerHTML = [
      '<div class="hw-mux-control-row">',
      '  <div class="hw-mux-p-control">',
      '    <span class="hw-mux-p-label" id="' + physicalNeuronLabelId + '">Physical neurons <i>P</i></span>',
      '    <div class="hw-mux-p-options" role="radiogroup" aria-labelledby="' + physicalNeuronLabelId + '" aria-describedby="' + summaryId + '">',
      PHYSICAL_NEURON_OPTIONS.map(function (value) {
        return '      <label class="hw-mux-p-option"><input type="radio" name="' +
          physicalNeuronGroupName + '" value="' + value + '"' +
          (value === DEFAULT_PHYSICAL_NEURONS ? ' checked' : '') +
          '><span><i>P</i> = ' + value + '</span></label>';
      }).join(''),
      '    </div>',
      '  </div>',
      '  <button class="hw-mux-toggle" type="button" aria-pressed="false">Pause</button>',
      '</div>',
      '<div class="hw-mux-summary" id="' + summaryId + '" aria-live="polite"></div>',
      '<div class="hw-mux-stage">',
      '  <svg class="hw-mux-network" role="img" aria-labelledby="' + titleId + ' ' + descriptionId + '"></svg>',
      '</div>',
      '<div class="hw-mux-legend" aria-label="Figure legend">',
      '  <span class="hw-mux-legend-item"><span class="hw-mux-legend-node is-firing" aria-hidden="true"></span>firing neuron</span>',
      '  <span class="hw-mux-legend-item"><span class="hw-mux-legend-node is-processing" aria-hidden="true"></span>shared-core update</span>',
      '  <span class="hw-mux-legend-item"><span class="hw-mux-legend-packet" aria-hidden="true"></span>pending / emitted spike</span>',
      '  <span class="hw-mux-legend-item"><span class="hw-mux-legend-edge is-inactive" aria-hidden="true"></span>inactive / processed synapse</span>',
      '</div>'
    ].join('');

    var caption = figure.querySelector('figcaption');
    if (caption) {
      figure.insertBefore(simulator, caption);
    } else {
      figure.appendChild(simulator);
    }

    var fallback = topLevelFallback(fallbackImage, figure);
    fallback.classList.add('hw-mux-static-fallback');
    // Hide immediately in JS. Relying only on CSS fails when the stylesheet
    // arrives after this script (common on first Myst/SPA paint), which leaves
    // the static SVG stacked above the interactive controls.
    fallback.setAttribute('hidden', '');
    fallback.style.display = 'none';
    if (fallbackImage !== fallback) {
      fallbackImage.setAttribute('hidden', '');
      fallbackImage.style.display = 'none';
    }

    var toggle = simulator.querySelector('.hw-mux-toggle');
    var physicalNeuronInputs = simulator.querySelectorAll('.hw-mux-p-option input');
    var summary = simulator.querySelector('.hw-mux-summary');
    var stage = simulator.querySelector('.hw-mux-stage');
    var svg = simulator.querySelector('.hw-mux-network');

    var sourceInputIndex = Math.floor(Math.random() * N_INPUT);
    var layer2Batches = [];
    var layer3Batches = [];
    var layer2BatchIndex = 0;
    var layer3BatchIndex = 0;
    var activeLayer2 = [];
    var processedLayer2 = [];
    var firingLayer2Index = null;
    var activeLayer3 = [];
    var processedLayer3 = [];
    var phase = 'l1-to-l2';
    var phaseStarted = performance.now();
    var phaseDuration = 650;
    var animationFrame = null;
    var paused = false;
    var pauseStarted = null;
    var hiddenStarted = null;
    var layout = null;
    var nodeElements = { input: [], hidden: [], output: [] };
    var sourceFanoutMarks = [];
    var handoffFanoutMarks = [];
    var handoffGroup = null;
    var sourceHaloElement = null;
    var layer2FiringHaloElement = null;
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function makeBatches(count) {
      var batches = [];
      for (var start = 0; start < count; start += physicalNeurons) {
        var batch = [];
        for (var index = start; index < Math.min(start + physicalNeurons, count); index += 1) {
          batch.push(index);
        }
        batches.push(batch);
      }
      return batches;
    }

    function updateSummary() {
      var logicalNeurons = physicalNeurons === 1
        ? '1 logical neuron'
        : physicalNeurons + ' logical neurons';
      var batches = Math.ceil(N_HIDDEN / physicalNeurons);
      summary.textContent = 'P = ' + physicalNeurons + ' updates ' + logicalNeurons +
        ' at once · ' + batches + (batches === 1 ? ' batch' : ' batches') +
        ' per eight-neuron layer';
    }

    function chooseNextSource(previous) {
      var next = previous;
      while (next === previous) next = Math.floor(Math.random() * N_INPUT);
      return next;
    }

    // Preserve the configured marginal firing probability per neuron while
    // allowing at most one spike from each hardware batch. This keeps the
    // handoff legible.
    function chooseSingleFiring(indices) {
      var probabilityOfAny = Math.min(1, indices.length * FIRE_PROBABILITY);
      if (!indices.length || Math.random() >= probabilityOfAny) return null;
      return indices[Math.floor(Math.random() * indices.length)];
    }

    function setMarkPosition(mark, fraction) {
      mark.dot.setAttribute('cx', mark.source.x + (mark.target.x - mark.source.x) * fraction);
      mark.dot.setAttribute('cy', mark.source.y + (mark.target.y - mark.source.y) * fraction);
    }

    function clearHandoffFanout() {
      handoffFanoutMarks = [];
      if (handoffGroup) handoffGroup.replaceChildren();
    }

    function buildHandoffFanout() {
      clearHandoffFanout();
      if (!layout || !handoffGroup || firingLayer2Index === null) return;

      var source = layout.hidden[firingLayer2Index];
      layout.output.forEach(function (target) {
        var edge = svgElement('line', {
          x1: source.x,
          y1: source.y,
          x2: target.x,
          y2: target.y,
          stroke: '#d92d20',
          'stroke-opacity': '0.95',
          'stroke-width': '2.2',
          class: 'hw-mux-delivery-edge hw-mux-handoff-edge'
        });
        var dot = svgElement('circle', {
          cx: source.x,
          cy: source.y,
          r: layout.packetRadius,
          fill: '#d92d20',
          stroke: '#ffffff',
          'stroke-width': '1.2',
          class: 'hw-mux-packet hw-mux-handoff-packet'
        });
        var mark = { source: source, target: target, edge: edge, dot: dot };
        handoffGroup.appendChild(edge);
        handoffGroup.appendChild(dot);
        handoffFanoutMarks.push(mark);
        setMarkPosition(mark, 0);
      });
    }

    function renderNodeState(receivingLayer) {
      if (sourceHaloElement && layout) {
        sourceHaloElement.setAttribute('cx', layout.input[sourceInputIndex].x);
        sourceHaloElement.setAttribute('cy', layout.input[sourceInputIndex].y);
      }
      if (layer2FiringHaloElement && layout) {
        var hasLayer2Firing = firingLayer2Index !== null;
        layer2FiringHaloElement.classList.toggle('is-visible', hasLayer2Firing);
        if (hasLayer2Firing) {
          layer2FiringHaloElement.setAttribute('cx', layout.hidden[firingLayer2Index].x);
          layer2FiringHaloElement.setAttribute('cy', layout.hidden[firingLayer2Index].y);
        }
      }
      nodeElements.input.forEach(function (node, index) {
        node.classList.toggle('is-source', index === sourceInputIndex);
      });
      nodeElements.hidden.forEach(function (node, index) {
        node.classList.toggle('is-processing', activeLayer2.indexOf(index) !== -1);
        node.classList.toggle('is-firing', index === firingLayer2Index);
        node.classList.toggle('is-receiving', receivingLayer === 'hidden');
      });
      nodeElements.output.forEach(function (node, index) {
        node.classList.toggle('is-processing', activeLayer3.indexOf(index) !== -1);
        node.classList.toggle('is-receiving', receivingLayer === 'output');
      });
      var sourcePacketsFlowing = phase === 'l1-to-l2' && !reduceMotion;
      sourceFanoutMarks.forEach(function (mark, index) {
        var source = layout && layout.input[sourceInputIndex];
        if (source) {
          mark.source = source;
          mark.edge.setAttribute('x1', source.x);
          mark.edge.setAttribute('y1', source.y);
        }
        var consumed = processedLayer2.indexOf(index) !== -1;
        mark.edge.classList.toggle('is-consumed', consumed);
        mark.dot.classList.toggle('is-consumed', consumed);
        mark.dot.classList.toggle('is-flowing', sourcePacketsFlowing && !consumed);
      });
      var handoffPacketsFlowing = phase === 'l2-to-l3' && !reduceMotion;
      handoffFanoutMarks.forEach(function (mark, index) {
        var consumed = processedLayer3.indexOf(index) !== -1;
        mark.edge.classList.toggle('is-consumed', consumed);
        mark.dot.classList.toggle('is-consumed', consumed);
        mark.dot.classList.toggle('is-flowing', handoffPacketsFlowing && !consumed);
      });
    }

    function movePackets(marks, progress, targetCount) {
      var eased = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      marks.forEach(function (mark, index) {
        var stagger = (index % targetCount) * 0.035;
        var local = Math.max(0, Math.min(1, (eased - stagger) / (1 - stagger)));
        setMarkPosition(mark, local);
      });
    }

    function updateSourcePackets(progress) {
      if (!reduceMotion) movePackets(sourceFanoutMarks, progress, N_HIDDEN);
      renderNodeState(sourceFanoutMarks.length > 0 && progress >= 0.78 ? 'hidden' : null);
    }

    function updateHandoffPackets(progress) {
      if (!reduceMotion) movePackets(handoffFanoutMarks, progress, N_OUTPUT);
      renderNodeState(handoffFanoutMarks.length > 0 && progress >= 0.78 ? 'output' : null);
    }

    function restorePacketFlowAfterDraw() {
      var frozenNow = paused && pauseStarted !== null
        ? pauseStarted
        : (document.hidden && hiddenStarted !== null ? hiddenStarted : performance.now());
      var progress = Math.max(0, Math.min(1, (frozenNow - phaseStarted) / phaseDuration));

      if (phase === 'l1-to-l2' && sourceFanoutMarks.length) {
        updateSourcePackets(progress);
      } else if (phase === 'l2-to-l3' && handoffFanoutMarks.length) {
        updateHandoffPackets(progress);
      } else {
        renderNodeState(null);
      }
    }

    function measureLayoutWidth() {
      // Prefer the simulator/figure width. Measuring the stage after an early
      // draw used to lock a cramped pixel width onto the SVG forever.
      var widths = [
        simulator.clientWidth,
        figure.clientWidth,
        stage.clientWidth
      ];
      var width = 0;
      for (var i = 0; i < widths.length; i += 1) {
        if (widths[i] > width) width = widths[i];
      }
      if (width < 360) {
        width = Math.max(width, Math.min(760, Math.round(window.innerWidth * 0.72)));
      }
      return Math.max(420, Math.round(width || 700));
    }

    function drawNetwork() {
      var width = measureLayoutWidth();
      if (layout && Math.abs(layout.width - width) < 2) {
        restorePacketFlowAfterDraw();
        return;
      }
      var height = width < 440
        ? 355
        : Math.max(355, Math.min(470, Math.round(width * 0.60)));
      var compact = width < 520;
      var nodeRadius = width < 420 ? 8.5 : (width < 650 ? 10.5 : 13);
      var packetRadius = width < 420 ? 3.2 : 4.2;
      var top = compact ? 70 : 74;
      var bottom = height - 24;
      var xInput = Math.max(nodeRadius + 6, width * 0.09);
      var xHidden = width * 0.50;
      var xOutput = Math.min(width - nodeRadius - 6, width * 0.91);

      layout = {
        width: width,
        height: height,
        packetRadius: packetRadius,
        input: evenlySpaced(N_INPUT, top, bottom).map(function (y) { return { x: xInput, y: y }; }),
        hidden: evenlySpaced(N_HIDDEN, top, bottom).map(function (y) { return { x: xHidden, y: y }; }),
        output: evenlySpaced(N_OUTPUT, top, bottom).map(function (y) { return { x: xOutput, y: y }; })
      };

      // viewBox + fluid CSS width. Never pin a pixel width attribute: that was
      // trapping first-paint narrow layouts so refresh seemed to "fix" them.
      svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      svg.removeAttribute('width');
      svg.removeAttribute('height');
      svg.style.width = '100%';
      svg.style.height = 'auto';
      svg.style.aspectRatio = width + ' / ' + height;
      svg.replaceChildren();

      var title = svgElement('title', { id: titleId });
      title.textContent = 'Interrupt-and-resume scheduling across two layers in one shared core';
      var description = svgElement('desc', { id: descriptionId });
      description.textContent = 'Five Layer-1 neurons connect to eight Layer-2 neurons and then eight Layer-3 neurons. Layers 2 and 3 share one core with ' +
        physicalNeurons + (physicalNeurons === 1 ? ' physical neuron circuit. ' : ' physical neuron circuits. ') +
        'The selected Layer-1 source and a firing Layer-2 neuron have a red outer ring. The core processes up to ' +
        physicalNeurons + (physicalNeurons === 1 ? ' logical neuron per batch, ' : ' logical neurons per batch, ') +
        'with at most one firing neuron in each batch. Each Layer-2 neuron has a ' +
        Math.round(FIRE_PROBABILITY * 100) + ' percent firing probability. If one fires, Layer 2 pauses and the same circuits process Layer 3 in ' +
        layer3Batches.length + (layer3Batches.length === 1 ? ' batch before resuming. ' : ' batches before resuming. ') +
        'Moving red packets show spike fan-out from Layer 1 to Layer 2 and from Layer 2 to Layer 3. Red lines remain while a delivery is pending, but packets do not remain parked on synapses. Processed synapses return to pale blue.';
      svg.appendChild(title);
      svg.appendChild(description);

      var coreLeft = xHidden - width * 0.075;
      var coreRight = Math.min(width - 2, xOutput + width * 0.065);
      // Presentation attributes are the safe default: if the companion CSS has
      // not loaded yet, SVG fill defaults to black and the core becomes a slab.
      svg.appendChild(svgElement('rect', {
        x: coreLeft,
        y: 30,
        width: coreRight - coreLeft,
        height: height - 38,
        rx: 12,
        fill: '#f5f9fe',
        stroke: '#88a5c7',
        'stroke-width': '1.6',
        'stroke-dasharray': '7 5',
        class: 'hw-mux-core-frame',
        'aria-hidden': 'true'
      }));
      var coreLabel = svgElement('text', {
        x: (xHidden + xOutput) / 2,
        y: 49,
        fill: '#5f6b7a',
        class: 'hw-mux-core-label'
      });
      coreLabel.textContent = 'one shared core · P = ' + physicalNeurons;
      svg.appendChild(coreLabel);

      var edges = svgElement('g', { 'aria-hidden': 'true' });
      layout.input.forEach(function (source) {
        layout.hidden.forEach(function (target) {
          edges.appendChild(svgElement('line', {
            x1: source.x,
            y1: source.y,
            x2: target.x,
            y2: target.y,
            stroke: '#6d96d4',
            'stroke-opacity': '0.35',
            'stroke-width': '1.15',
            class: 'hw-mux-edge'
          }));
        });
      });
      layout.hidden.forEach(function (source) {
        layout.output.forEach(function (target) {
          edges.appendChild(svgElement('line', {
            x1: source.x,
            y1: source.y,
            x2: target.x,
            y2: target.y,
            stroke: '#6d96d4',
            'stroke-opacity': '0.35',
            'stroke-width': '1.15',
            class: 'hw-mux-edge'
          }));
        });
      });
      svg.appendChild(edges);

      var sourceFanout = svgElement('g', { 'aria-hidden': 'true' });
      sourceFanoutMarks = [];
      layout.hidden.forEach(function (target) {
        var source = layout.input[sourceInputIndex];
        var edge = svgElement('line', {
          x1: source.x,
          y1: source.y,
          x2: target.x,
          y2: target.y,
          stroke: '#d92d20',
          'stroke-opacity': '0.95',
          'stroke-width': '2.2',
          class: 'hw-mux-delivery-edge hw-mux-source-edge'
        });
        var dot = svgElement('circle', {
          cx: source.x,
          cy: source.y,
          r: packetRadius,
          fill: '#d92d20',
          stroke: '#ffffff',
          'stroke-width': '1.2',
          class: 'hw-mux-packet hw-mux-source-packet'
        });
        sourceFanout.appendChild(edge);
        sourceFanout.appendChild(dot);
        var mark = { source: source, target: target, edge: edge, dot: dot };
        sourceFanoutMarks.push(mark);
        setMarkPosition(mark, 0);
      });
      svg.appendChild(sourceFanout);

      handoffGroup = svgElement('g', { 'aria-hidden': 'true' });
      svg.appendChild(handoffGroup);
      buildHandoffFanout();

      var nodes = svgElement('g', { 'aria-hidden': 'true' });
      sourceHaloElement = svgElement('circle', {
        cx: layout.input[sourceInputIndex].x,
        cy: layout.input[sourceInputIndex].y,
        r: nodeRadius + 5,
        fill: 'none',
        stroke: '#d92d20',
        'stroke-width': '3',
        class: 'hw-mux-firing-halo is-visible'
      });
      layer2FiringHaloElement = svgElement('circle', {
        cx: layout.hidden[0].x,
        cy: layout.hidden[0].y,
        r: nodeRadius + 5,
        fill: 'none',
        stroke: '#d92d20',
        'stroke-width': '3',
        class: 'hw-mux-firing-halo'
      });
      nodes.appendChild(sourceHaloElement);
      nodes.appendChild(layer2FiringHaloElement);
      nodeElements = { input: [], hidden: [], output: [] };
      ['input', 'hidden', 'output'].forEach(function (layerName) {
        layout[layerName].forEach(function (point, index) {
          var node = svgElement('circle', {
            cx: point.x,
            cy: point.y,
            r: nodeRadius,
            fill: '#111827',
            stroke: '#ffffff',
            'stroke-width': '2.5',
            class: 'hw-mux-node' +
              (layerName === 'input' && index === sourceInputIndex ? ' is-source' : '')
          });
          nodes.appendChild(node);
          nodeElements[layerName].push(node);
        });
      });
      svg.appendChild(nodes);

      var labels = [
        { x: xInput, text: 'Layer 1' },
        { x: xHidden, text: compact ? 'Layer 2 (N = 8)' : 'Layer 2 (N = 8 logical neurons)' },
        { x: width - 4, text: 'Layer 3 (N = 8)', output: true }
      ];
      labels.forEach(function (label) {
        var textNode = svgElement('text', {
          x: label.x,
          y: 18,
          fill: '#1f2937',
          class: 'hw-mux-layer-label' + (label.output ? ' hw-mux-layer-label-output' : '')
        });
        textNode.textContent = label.text;
        svg.appendChild(textNode);
      });

      restorePacketFlowAfterDraw();
    }

    function beginSweep(now, betweenSweeps) {
      phase = 'l1-to-l2';
      phaseStarted = now;
      phaseDuration = betweenSweeps ? 720 : 650;
      if (betweenSweeps) sourceInputIndex = chooseNextSource(sourceInputIndex);
      layer2BatchIndex = 0;
      layer3BatchIndex = 0;
      activeLayer2 = [];
      processedLayer2 = [];
      firingLayer2Index = null;
      activeLayer3 = [];
      processedLayer3 = [];
      clearHandoffFanout();
      renderNodeState(null);
      sourceFanoutMarks.forEach(function (mark) { setMarkPosition(mark, 0); });
    }

    function beginLayer2Process(now) {
      phase = 'l2-process';
      phaseStarted = now;
      phaseDuration = 900;
      activeLayer2 = layer2Batches[layer2BatchIndex].slice();
      activeLayer3 = [];
      firingLayer2Index = null;
      processedLayer3 = [];
      clearHandoffFanout();
      renderNodeState(null);
    }

    function beginLayer2Resolve(now) {
      phaseStarted = now;
      activeLayer2.forEach(function (index) {
        if (processedLayer2.indexOf(index) === -1) processedLayer2.push(index);
      });
      firingLayer2Index = chooseSingleFiring(activeLayer2);

      if (firingLayer2Index === null) {
        phase = 'l2-resolve';
        phaseDuration = 460;
        renderNodeState(null);
      } else {
        phase = 'l2-to-l3';
        phaseDuration = 780;
        activeLayer2 = [];
        layer3BatchIndex = 0;
        activeLayer3 = [];
        processedLayer3 = [];
        buildHandoffFanout();
        renderNodeState(null);
      }
    }

    function continueLayer2(now) {
      activeLayer2 = [];
      firingLayer2Index = null;
      layer2BatchIndex += 1;
      if (layer2BatchIndex >= layer2Batches.length) {
        beginSweep(now, true);
      } else {
        beginLayer2Process(now);
      }
    }

    function beginLayer3Process(now) {
      phase = 'l3-process';
      phaseStarted = now;
      phaseDuration = 900;
      activeLayer2 = [];
      activeLayer3 = layer3Batches[layer3BatchIndex].slice();
      renderNodeState(null);
    }

    function beginLayer3Resolve(now) {
      phase = 'l3-resolve';
      phaseStarted = now;
      phaseDuration = 460;
      activeLayer3.forEach(function (index) {
        if (processedLayer3.indexOf(index) === -1) processedLayer3.push(index);
      });
      renderNodeState(null);
    }

    function continueLayer3(now) {
      activeLayer3 = [];
      layer3BatchIndex += 1;
      if (layer3BatchIndex >= layer3Batches.length) {
        beginLayer2Resume(now);
      } else {
        beginLayer3Process(now);
      }
    }

    function beginLayer2Resume(now) {
      phase = 'resume-l2';
      phaseStarted = now;
      phaseDuration = 650;
      activeLayer2 = [];
      activeLayer3 = [];
      firingLayer2Index = null;
      processedLayer3 = [];
      clearHandoffFanout();
      renderNodeState(null);
    }

    function advance(now) {
      if (phase === 'l1-to-l2') {
        beginLayer2Process(now);
      } else if (phase === 'l2-process') {
        beginLayer2Resolve(now);
      } else if (phase === 'l2-resolve') {
        continueLayer2(now);
      } else if (phase === 'l2-to-l3') {
        beginLayer3Process(now);
      } else if (phase === 'l3-process') {
        beginLayer3Resolve(now);
      } else if (phase === 'l3-resolve') {
        continueLayer3(now);
      } else if (phase === 'resume-l2') {
        continueLayer2(now);
      }
    }

    function tick(now) {
      if (!simulator.isConnected || paused || document.hidden) {
        animationFrame = null;
        return;
      }

      var progress = Math.max(0, Math.min(1, (now - phaseStarted) / phaseDuration));
      if (phase === 'l1-to-l2' && sourceFanoutMarks.length) updateSourcePackets(progress);
      if (phase === 'l2-to-l3' && handoffFanoutMarks.length) updateHandoffPackets(progress);

      if (progress >= 1) advance(now);
      animationFrame = window.requestAnimationFrame(tick);
    }

    function startAnimation() {
      if (animationFrame === null && !paused && !document.hidden) {
        animationFrame = window.requestAnimationFrame(tick);
      }
    }

    function setPaused(nextPaused) {
      if (paused === nextPaused) return;
      paused = nextPaused;
      toggle.setAttribute('aria-pressed', paused ? 'true' : 'false');
      toggle.textContent = paused ? 'Resume' : 'Pause';

      if (paused) {
        pauseStarted = performance.now();
        if (animationFrame !== null) window.cancelAnimationFrame(animationFrame);
        animationFrame = null;
      } else {
        if (pauseStarted !== null) phaseStarted += performance.now() - pauseStarted;
        pauseStarted = null;
        startAnimation();
      }
    }

    toggle.addEventListener('click', function () {
      setPaused(!paused);
    });

    physicalNeuronInputs.forEach(function (input) {
      input.addEventListener('change', function () {
        if (!input.checked) return;
        var nextPhysicalNeurons = Number(input.value);
        if (PHYSICAL_NEURON_OPTIONS.indexOf(nextPhysicalNeurons) === -1 ||
            nextPhysicalNeurons === physicalNeurons) return;

        physicalNeurons = nextPhysicalNeurons;
        layer2Batches = makeBatches(N_HIDDEN);
        layer3Batches = makeBatches(N_OUTPUT);
        updateSummary();

        var now = performance.now();
        if (paused) pauseStarted = now;
        beginSweep(now, false);
        layout = null;
        drawNetwork();
        startAnimation();
      });
    });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        hiddenStarted = paused ? null : performance.now();
        if (animationFrame !== null) window.cancelAnimationFrame(animationFrame);
        animationFrame = null;
      } else {
        if (!paused && hiddenStarted !== null) phaseStarted += performance.now() - hiddenStarted;
        hiddenStarted = null;
        startAnimation();
      }
    });

    if ('ResizeObserver' in window) {
      var pendingResize = null;
      var lastObservedWidth = 0;
      var observer = new ResizeObserver(function () {
        if (pendingResize !== null) window.cancelAnimationFrame(pendingResize);
        pendingResize = window.requestAnimationFrame(function () {
          pendingResize = null;
          var nextWidth = measureLayoutWidth();
          if (Math.abs(nextWidth - lastObservedWidth) < 2 && layout) return;
          lastObservedWidth = nextWidth;
          // Force redraw even if layout.width already matches a stale value.
          layout = null;
          drawNetwork();
        });
      });
      observer.observe(simulator);
      observer.observe(figure);
    } else {
      window.addEventListener('resize', function () {
        layout = null;
        drawNetwork();
      });
    }

    layer2Batches = makeBatches(N_HIDDEN);
    layer3Batches = makeBatches(N_OUTPUT);
    updateSummary();
    figure.classList.add('hw-mux-enhanced');

    function startInteractive() {
      simulator.hidden = false;
      // Wait two frames so Myst/Simple Browser finish laying out the article
      // column before the first width measurement.
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () {
          layout = null;
          drawNetwork();
          beginSweep(performance.now(), false);
          startAnimation();
        });
      });
    }

    if (window.hwWidgets && window.hwWidgets.withStylesheet) {
      window.hwWidgets.withStylesheet('/_static/css/hw-multiplexing.css', startInteractive);
    } else {
      startInteractive();
    }
  }

  function initializeFigures() {
    document.querySelectorAll('figure.hw-mux-interactive, figure#fig-hw-mux').forEach(enhanceFigure);
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
