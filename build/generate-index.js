#!/usr/bin/env node
/* ============================================================
   generate-index.js — re-render data-driven blocks in index.html

   Usage:   node build/generate-index.js

   Reads model data from js/model-data.js (single source of truth)
   and regenerates every <!-- GENERATED:xxx --> block in index.html.
   Blocks keep their markers, so regeneration is idempotent.
   ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DATA = require(path.join(ROOT, 'js', 'model-data.js'));
const INDEX = path.join(ROOT, 'index.html');

const u = DATA.utils;

/* ---------- Data consistency checks (fail loudly on bad monthly edits) ---------- */
let dataErrors = 0;
DATA.models.forEach(m => {
  if (m.openWeights && m.tabs.indexOf('opensource') === -1) {
    console.error(`✗ ${m.id} has openWeights info but is not in tabs:['opensource']`);
    dataErrors++;
  }
  if (m.tabs.indexOf('opensource') !== -1 && !m.openWeights) {
    console.error(`✗ ${m.id} is in the opensource tab but has no openWeights info`);
    dataErrors++;
  }
  if (m.inputPrice !== null && m.cacheReadPrice === null && m.tabs.length === 0) {
    console.error(`✗ ${m.id} has a price but no cacheReadPrice — it will vanish from the cost calculator`);
    dataErrors++;
  }
});
DATA.pricingCards.forEach(c => {
  if (!DATA.models.some(m => m.id === c.modelId)) {
    console.error(`✗ pricingCard references unknown modelId: ${c.modelId}`);
    dataErrors++;
  }
});
if (dataErrors > 0) {
  console.error(`\n${dataErrors} data error(s) in js/model-data.js — aborting without writing index.html`);
  process.exit(1);
}

/* ---------- Row renderers (must mirror index.html markup) ---------- */

function standardRow(m, tab) {
  const strengths = (m.tabStrengths && m.tabStrengths[tab]) || m.strengths;
  const status = (m.tabStatus && m.tabStatus[tab]) || m.status;
  return [
    '            <tr>',
    `              <td><strong>${m.name}</strong></td>`,
    `              <td>${m.company}</td>`,
    `              <td>${u.fmtContext(m)}</td>`,
    `              <td>${strengths}</td>`,
    `              <td>${u.fmtPricePair(m)}</td>`,
    `              <td>${u.badge(status)}</td>`,
    '            </tr>'
  ].join('\n');
}

function opensourceRow(m) {
  const ow = m.openWeights;
  const name = ow.displayName || m.name;
  return [
    '            <tr>',
    `              <td><strong>${name}</strong></td>`,
    `              <td>${m.company}</td>`,
    `              <td>${ow.params}</td>`,
    `              <td>${u.fmtContext(m)}</td>`,
    `              <td>${ow.highlights}</td>`,
    `              <td><span class="badge ${ow.licenseBadge}">${ow.license}</span></td>`,
    '            </tr>'
  ].join('\n');
}

function pricingCard(card) {
  const m = u.byId(card.modelId);
  if (!m) throw new Error('pricingCard references unknown modelId: ' + card.modelId);
  const cls = card.featured ? 'pricing-card featured' : 'pricing-card';
  const lines = [
    `      <div class="${cls}">`,
    `        <div class="pricing-name">${m.name}</div>`,
    `        <div class="pricing-provider">${card.provider}</div>`,
    `        <div class="pricing-price">${card.monthly} <span>/ month</span></div>`,
    `        <div class="pricing-detail">${card.detail}</div>`,
    '        <ul class="pricing-features">'
  ];
  card.features.forEach(f => lines.push(`          <li>${f}</li>`));
  lines.push(
    '        </ul>',
    `        <a href="${card.cta.href}" class="pricing-cta ${card.cta.cls}">${card.cta.text}</a>`,
    '      </div>'
  );
  return lines.join('\n');
}

/* ---------- Block assembly ---------- */

const blocks = {
  'rows-international': () => u.forTab('international').map(m => standardRow(m, 'international')).join('\n'),
  'rows-china': () => u.forTab('china').map(m => standardRow(m, 'china')).join('\n'),
  'rows-opensource': () => u.forTab('opensource').map(opensourceRow).join('\n'),
  'pricing-cards': () => DATA.pricingCards.map(pricingCard).join('\n')
};

/* ---------- Inject ---------- */

let html = fs.readFileSync(INDEX, 'utf8');
let changed = 0;

for (const [name, render] of Object.entries(blocks)) {
  const open = `<!-- GENERATED:${name} -->`;
  const close = `<!-- /GENERATED:${name} -->`;
  const start = html.indexOf(open);
  const end = html.indexOf(close);
  if (start === -1 || end === -1 || end < start) {
    console.error(`✗ Markers for "${name}" not found in index.html — skipping`);
    process.exitCode = 1;
    continue;
  }
  const before = html.slice(0, start + open.length);
  const after = html.slice(end);
  const rendered = '\n' + render() + '\n          ';
  html = before + rendered + after;
  changed++;
  console.log(`✓ ${name}: regenerated`);
}

if (changed > 0) {
  fs.writeFileSync(INDEX, html, 'utf8');
  console.log(`\nindex.html updated from js/model-data.js (data: ${DATA.updated})`);
}
