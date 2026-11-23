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
  const modelPage = 'model-' + model.id + '.html';
  return [
    '            <tr>',
    '              <td><a href="' + modelPage + '"><strong>' + escapeHtml(model.name) + '</strong></a><br><small>' + escapeHtml(model.company) + '</small></td>',
    '              <td>' + escapeHtml(u.fmtContext(model)) + '</td>',
    '              <td>' + escapeHtml(strengths) + '</td>',
    '              <td>' + escapeHtml(u.fmtPricePair(model)) + note + '</td>',
    '              <td><a href="' + modelPage + '" style="font-weight:600;">Analysis</a> · <a href="' + escapeHtml(model.sourceUrl) + '" target="_blank" rel="noopener noreferrer">Source ↗</a><br>' + u.badge(status) + '</td>',
    '            </tr>'
  ].join('\n');
}

function pricingCard(card) {
  const model = u.byId(card.modelId);
  if (!model) throw new Error('Unknown pricing model: ' + card.modelId);
  const classes = card.featured ? 'pricing-card featured' : 'pricing-card';
  const modelPage = 'model-' + model.id + '.html';
  const lines = [
    '      <div class="' + classes + '">',
    '        <div class="pricing-name"><a href="' + modelPage + '">' + escapeHtml(model.name) + '</a></div>',
    '        <div class="pricing-provider">' + escapeHtml(card.provider) + '</div>',
    '        <div class="pricing-price">' + escapeHtml(u.fmtPricePair(model)) + ' <span>/ 1M tokens (input/output)</span></div>',
    '        <div class="pricing-detail">' + escapeHtml(card.detail) + '</div>',
    '        <ul class="pricing-features">'
  ];
  card.features.forEach(feature => lines.push('          <li>' + escapeHtml(feature) + '</li>'));
  lines.push(
    '        </ul>',
    '        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;align-items:center;margin-top:1.25rem;">',
    '          <a href="' + modelPage + '" class="btn btn-outline" style="flex:1;text-align:center;padding:0.65rem 0.8rem;font-size:0.85rem;">Deep Dive →</a>',
    '          <a href="' + escapeHtml(card.cta.href) + '" target="_blank" rel="noopener noreferrer" class="pricing-cta ' + escapeHtml(card.cta.cls) + '" style="flex:1;text-align:center;padding:0.65rem 0.8rem;font-size:0.85rem;margin:0;">' + escapeHtml(card.cta.text) + ' ↗</a>',
    '        </div>',
    '      </div>'
  );
  return lines.join('\n');
}

function leaderboardRow(bm, rank) {
  const model = DATA.models.find(m => m.name === bm.name);
  const modelId = model ? model.id : '';
  const modelLink = modelId ? '<a href="model-' + modelId + '.html"><strong>' + escapeHtml(bm.name) + '</strong></a>' : '<strong>' + escapeHtml(bm.name) + '</strong>';
  const rankBadge = rank <= 3 ? '<span class="badge badge-purple">#' + rank + '</span>' : '<span class="badge badge-blue">#' + rank + '</span>';
  const valBadge = bm.valueIndex >= 95 ? '<span class="badge badge-green">' + bm.valueIndex + ' / 100</span>' : (bm.valueIndex >= 85 ? '<span class="badge badge-cyan">' + bm.valueIndex + ' / 100</span>' : '<span class="badge badge-purple">' + bm.valueIndex + ' / 100</span>');
  return [
    '            <tr>',
    '              <td>' + rankBadge + ' ' + modelLink + '<br><small>' + escapeHtml(bm.developer) + ' · ' + escapeHtml(bm.tier) + '</small></td>',
    '              <td><strong>' + bm.sweBench + '%</strong><br><div style="background:rgba(255,255,255,0.08);border-radius:999px;height:5px;width:110px;margin-top:5px;overflow:hidden;"><div style="background:linear-gradient(90deg,var(--cyber-purple),var(--neon-cyan));height:100%;width:' + bm.sweBench + '%;"></div></div></td>',
    '              <td><strong>' + bm.terminalBench + '%</strong></td>',
    '              <td>' + (bm.context >= 1000 ? (bm.context / 1000) + 'M' : bm.context + 'K') + '</td>',
    '              <td>$' + bm.inPrice.toFixed(2) + ' / $' + bm.outPrice.toFixed(2) + '</td>',
    '              <td>' + valBadge + '</td>',
    '            </tr>'
  ].join('\n');
}

const blocks = {
  'rows-international': () => u.forTab('international').map(m => standardRow(m, 'international')).join('\n'),
  'rows-china': () => u.forTab('china').map(m => standardRow(m, 'china')).join('\n'),
  'pricing-cards': () => DATA.pricingCards.map(pricingCard).join('\n'),
  'leaderboard-rows': () => {
    const sorted = DATA.agentBenchmarks.slice().sort((a, b) => b.sweBench - a.sweBench);
    return sorted.map((bm, idx) => leaderboardRow(bm, idx + 1)).join('\n');
  }
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