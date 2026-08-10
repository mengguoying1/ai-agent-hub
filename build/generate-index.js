#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const DATA = require(path.join(ROOT, 'js', 'model-data.js'));
const INDEX = path.join(ROOT, 'index.html');
const u = DATA.utils;

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function standardRow(model, tab) {
  const strengths = (model.tabStrengths && model.tabStrengths[tab]) || model.strengths;
  const status = (model.tabStatus && model.tabStatus[tab]) || model.status;
  const note = model.priceNote ? '<br><small>' + escapeHtml(model.priceNote) + '</small>' : '';
  return [
    '            <tr>',
    '              <td><strong>' + escapeHtml(model.name) + '</strong><br><small>' + escapeHtml(model.company) + '</small></td>',
    '              <td>' + escapeHtml(u.fmtContext(model)) + '</td>',
    '              <td>' + escapeHtml(strengths) + '</td>',
    '              <td>' + escapeHtml(u.fmtPricePair(model)) + note + '</td>',
    '              <td><a href="' + escapeHtml(model.sourceUrl) + '" target="_blank" rel="noopener noreferrer">Official source</a><br>' + u.badge(status) + '</td>',
    '            </tr>'
  ].join('\n');
}

function pricingCard(card) {
  const model = u.byId(card.modelId);
  if (!model) throw new Error('Unknown pricing model: ' + card.modelId);
  const classes = card.featured ? 'pricing-card featured' : 'pricing-card';
  const lines = [
    '      <div class="' + classes + '">',
    '        <div class="pricing-name">' + escapeHtml(model.name) + '</div>',
    '        <div class="pricing-provider">' + escapeHtml(card.provider) + '</div>',
    '        <div class="pricing-price">' + escapeHtml(u.fmtPricePair(model)) + ' <span>/ 1M tokens (input/output)</span></div>',
    '        <div class="pricing-detail">' + escapeHtml(card.detail) + '</div>',
    '        <ul class="pricing-features">'
  ];
  card.features.forEach(feature => lines.push('          <li>' + escapeHtml(feature) + '</li>'));
  lines.push(
    '        </ul>',
    '        <a href="' + escapeHtml(card.cta.href) + '" target="_blank" rel="noopener noreferrer" class="pricing-cta ' + escapeHtml(card.cta.cls) + '">' + escapeHtml(card.cta.text) + ' ↗</a>',
    '      </div>'
  );
  return lines.join('\n');
}

const blocks = {
  'rows-international': () => u.forTab('international').map(m => standardRow(m, 'international')).join('\n'),
  'rows-china': () => u.forTab('china').map(m => standardRow(m, 'china')).join('\n'),
  'pricing-cards': () => DATA.pricingCards.map(pricingCard).join('\n')
};

for (const card of DATA.pricingCards) {
  if (!u.byId(card.modelId)) throw new Error('Pricing card references unknown model: ' + card.modelId);
}

let html = fs.readFileSync(INDEX, 'utf8');
for (const [name, render] of Object.entries(blocks)) {
  const open = '<!-- GENERATED:' + name + ' -->';
  const close = '<!-- /GENERATED:' + name + ' -->';
  const start = html.indexOf(open);
  const end = html.indexOf(close);
  if (start < 0 || end < start) throw new Error('Missing generated block: ' + name);
  html = html.slice(0, start + open.length) + '\n' + render() + '\n          ' + html.slice(end);
  console.log('generated ' + name);
}
fs.writeFileSync(INDEX, html, 'utf8');
console.log('index.html updated from verified data: ' + DATA.updated);