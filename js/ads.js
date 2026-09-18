/* AI Agent Hub - ad slot loader.
 *
 * HOW TO GO LIVE WITH ADS
 *   1. In AdSense: Ads > By ad unit > create "Display" units.
 *   2. Copy each numeric ad slot ID into SLOTS below.
 *   3. Done. Every .ad-slot on the site starts serving.
 *
 * Until a slot ID is filled in, the space is used for in-house promotion
 * instead of sitting empty. An empty slot earns nothing and looks broken.
 */
(function () {
  'use strict';

  var CLIENT = 'ca-pub-5803262792097019';

  // data-ad value -> AdSense data-ad-slot ID (leave '' to keep the fallback)
  var SLOTS = {
    'article-end': '',
    'in-feed': '',
    'tool-top': ''
  };

  var FALLBACK = {
    'article-end':
      '<p><strong>Run this on your own workload.</strong></p>' +
      '<small>Every rate on this site is linked to a provider source and carries a check date. ' +
      'Put your traffic through the <a href="tool-cost-calculator.html">AI API cost calculator</a>, ' +
      'or compare options in the <a href="debate.html">AI debate &amp; evidence</a> section.</small>',
    'in-feed':
      '<p><strong>Pricing that changes fast.</strong></p>' +
      '<small>Model rates moved repeatedly this year. ' +
      'Start from the <a href="./#models">verified catalog</a>, then read ' +
      '<a href="methodology.html">how each number is checked</a>.</small>',
    'tool-top':
      '<p><strong>Assumptions you can edit.</strong></p>' +
      '<small>Change every input above and re-read the result. ' +
      'Method and exclusions are documented in the ' +
      '<a href="methodology.html">calculator methodology</a>.</small>'
  };

  function mount(el) {
    var key = el.getAttribute('data-ad') || 'article-end';
    var slot = SLOTS[key];
    if (!slot) {
      el.innerHTML = FALLBACK[key] || FALLBACK['article-end'];
      el.setAttribute('data-ad-state', 'fallback');
      return;
    }
    var ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.display = 'block';
    ins.setAttribute('data-ad-client', CLIENT);
    ins.setAttribute('data-ad-slot', slot);
    ins.setAttribute('data-ad-format', 'auto');
    ins.setAttribute('data-full-width-responsive', 'true');
    el.appendChild(ins);
    el.setAttribute('data-ad-state', 'adsense');
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      el.innerHTML = FALLBACK[key] || '';
    }
  }

  function run() {
    var slots = document.querySelectorAll('.ad-slot');
    for (var i = 0; i < slots.length; i++) {
      if (!slots[i].hasAttribute('data-ad-state')) mount(slots[i]);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
