import { places, dogRules } from './places.js';
import { travelCharge, INCLUDED_MILES } from './travel.js';
import { photoCredits, licenceUrls, photoSource } from './credits.js';
import { mapPoints } from './map-points.js';

const ownPhotos = {
  "glynllifon": {
    "src": "https://images-pw.pixieset.com/site/2WbW7v/P4wk9x/DSC04697-bd3dc2d6-1500.jpg",
    "alt": "Family walking along a woodland path at Parc Glynllifon"
  },
  "criccieth": {
    "src": "https://images-pw.pixieset.com/site/2WbW7v/wpk3oA/DSC02554-fe71e494-1000.jpg",
    "alt": "Family on Criccieth beach beneath the castle headland"
  },
  "caernarfon": {
    "src": "https://images-pw.pixieset.com/site/2WbW7v/dQ7ZOOa/DSC07695-5c4129ce-500.jpg",
    "alt": "Bride and groom walking through Caernarfon town"
  }
};

let category = 'all', selected = 'glynllifon', map, markers = [];
const $ = s => document.querySelector(s);
const money = n => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n);
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const external = (href, label) => `<a href="${escape(href)}" target="_blank" rel="noopener">${escape(label)} ↗</a>`;
const route = p => 'https://www.google.com/maps/dir/?api=1&origin=Penygroes%2C+Gwynedd%2C+Wales&destination=' + encodeURIComponent(p.routeDestination || p.destination) + '&travelmode=driving';
const reviews = p => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(p.destination);
const charge = p => travelCharge(p.milesOneWay);
const travelLabel = p => charge(p) === 0 ? 'Travel included' : '+' + money(charge(p)) + ' travel';
const travelDetail = p => 'About ' + p.milesOneWay + ' miles one way';
const creditCaption = p => { if (ownPhotos[p.id]) return '<div class="photo-credit">Photo: OB Photography</div>'; const c = photoCredits[p.id]; return `<div class="photo-credit">Photo: ${external(photoSource(c), c.author)}<span>${licenceUrls[c.licence] ? external(licenceUrls[c.licence], c.licence) : c.licence}</span></div>`; };

function filtered() {
  const result = places.filter(p => (category === 'all' || p.type === category) && (!$('#dog').checked || p.dog === 'yes'));
  return result.sort((a, b) => $('#sort').value === 'distance'
    ? a.milesOneWay - b.milesOneWay
    : places.indexOf(a) - places.indexOf(b));
}

function render() {
  const list = filtered();
  if (!list.some(p => p.id === selected)) selected = list[0]?.id ?? null;
  $('#count').textContent = `${list.length} ${list.length === 1 ? 'place' : 'places'}`;
  $('#filter-note').hidden = !$('#dog').checked;
  $('#filter-note').textContent = [$('#dog').checked ? 'Showing places without seasonal beach exclusions. Untick “Bringing a dog” to see beach options and their restrictions.' : ''].filter(Boolean).join(' ');
  $('#cards').innerHTML = list.length ? list.map(p => `<article class="location-card ${p.id === selected ? 'selected' : ''}" data-id="${p.id}">
    <div class="card-image"><img src="${ownPhotos[p.id]?.src || p.image}" alt="${escape(ownPhotos[p.id]?.alt || p.name)}" loading="lazy" ${ownPhotos[p.id] ? 'style="object-fit:contain;background:#efede6"' : ''}><span class="number">${places.indexOf(p) + 1}</span>${creditCaption(p)}</div>
    <div class="card-main"><div class="card-top"><span class="category">${p.type}</span></div>
    <button class="place-title" data-select="${p.id}" aria-pressed="${p.id === selected}">${p.name}</button><p class="description">${p.description}</p>
    ${p.bestTime ? `<p class="description"><strong>Best time to book:</strong> ${escape(p.bestTime)}</p>` : ''}
    <div class="tags">${p.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
    <div class="card-bottom"><div class="miles">About ${p.milesOneWay} miles · ${charge(p) === 0 ? 'travel included' : '+' + money(charge(p)).replace('.00', '') + ' travel'}</div></div></div></article>`).join('')
    : `<div class="empty"><h3>No locations match just yet.</h3><p>${$('#dog').checked && category === 'beach' ? 'These beaches have seasonal dog restrictions. Untick “Bringing a dog” to review their access notes, or try a woodland setting.' : 'Try a different setting or relax one of your needs.'}</p><button id="reset">Reset filters</button></div>`;
  document.querySelectorAll('[data-select]').forEach(b => b.onclick = () => select(b.dataset.select));
  $('#reset')?.addEventListener('click', reset);
  renderMap(list);
  renderDetail();
  const p = places.find(p => p.id === selected);
  $('#google-open').hidden = !p;
  if (p) $('#google-open').href = reviews(p);
}

function select(id) { selected = id; render(); const point = mapPoints[id]; if (point && map) map.panTo([point.lat, point.lng]); }
function reset() { category = 'all'; ['dog'].forEach(id => $('#' + id).checked = false); $('#sort').value = 'recommended'; syncCategories(); render(); fit(); }
function syncCategories() { document.querySelectorAll('[data-category]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.category === category))); }
function fit() { if (map) map.fitBounds([mapPoints.origin, ...filtered().map(p => mapPoints[p.id])].map(p => [p.lat, p.lng]), { padding: [25, 25], maxZoom: 12 }); }
function renderMap(list) {
  if (!map) return;
  markers.forEach(m => m.remove());
  markers = list.map(p => { const point = mapPoints[p.id]; return L.marker([point.lat, point.lng], {
    icon: L.divIcon({ className: 'price-pin' + (p.id === selected ? ' active' : ''), html: String(places.indexOf(p) + 1), iconAnchor: [14, 14] }),
    title: p.name, alt: `${p.name}, ${travelLabel(p)}`
  }).addTo(map).bindTooltip(`${p.name} · ${travelLabel(p)}`).on('click', () => select(p.id)); });
}

function renderDetail() {
  const p = places.find(p => p.id === selected);
  if (!p) { $('#map-detail').innerHTML = '<h3>A little change of scenery?</h3><p>Adjust your filters to see more places on the map.</p>'; return; }
  const miles = p.milesOneWay, extra = charge(p);
  const result = extra === 0 ? `${miles} miles from Penygroes · <b>Travel included</b>`
    : `(${miles} − ${INCLUDED_MILES} included miles) × 2 × 75p = <b>${money(extra)}</b>`;
  $('#map-detail').innerHTML = `<div class="detail-heading"><div><span class="detail-tag">IN FOCUS · ${p.type.toUpperCase()}</span><h3>${p.name}</h3></div><div class="price ${extra === 0 ? 'included' : ''}">${travelLabel(p)}<small>${travelDetail(p)}</small></div></div>
    <div class="detail-meta">${external(reviews(p), 'Read Google reviews')}</div><p>${p.note}</p>
    ${p.bestTime ? `<section aria-label="Best time to book"><h4>Best time to book</h4><p><strong>${escape(p.bestTime)}</strong></p><p>${escape(p.timingNote || '')}</p><p><small>Suggested shoot timings, subject to weather, tides, access and availability. Confirm the exact time when booking.</small></p></section>` : ''}
    <a class="route-link" href="${route(p)}" target="_blank" rel="noopener">View driving route on Google Maps <span>↗</span></a>
    <div id="travel-result" class="mileage-breakdown" role="status">${result}</div>
    <p class="estimate-note">Approximate driving mileage from Penygroes, rounded to the nearest mile. Confirm the meeting point and final travel charge with your photographer.</p>
    <div class="practical-links">${external(p.info, 'Visit information')}${p.dog === 'seasonal' ? external(p.dogInfo || dogRules, 'Dog restriction maps') : ''}</div>`;
}

const dialog = $('#details');
function show(content) { $('#dialog-content').innerHTML = content; dialog.showModal(); }
$('.close-dialog').onclick = () => dialog.close();
dialog.addEventListener('click', e => { if (e.target === dialog) { const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close(); } });
document.querySelectorAll('[data-category]').forEach(b => b.onclick = () => { category = b.dataset.category; syncCategories(); render(); fit(); });
['dog', 'sort'].forEach(id => $('#' + id).addEventListener('change', () => { render(); fit(); }));
$('#fit-map').onclick = fit;
$('#travel-info').onclick = () => show('<h2>Travel within 20 miles is included</h2><p>Locations up to and including 20 driving miles from Penygroes, Gwynedd have no travel extra. The allowance is based on the one-way drive and includes the return journey.</p><p>For locations farther away, only the miles beyond 20 are charged at 75p per mile, in both directions.</p><div class="charge">25 miles: (25 − 20) × 2 × £0.75 = £7.50</div><p>Travel estimates use the confirmed one-way driving mileages, rounded to the nearest mile, and double only the excess distance for the return journey.</p><p>Confirm the meeting point and final travel charge with your photographer. Parking, admission and any location fees remain separate.</p>');

function photoCreditList() {
  return places.map(p => {
    const c = photoCredits[p.id], licence = licenceUrls[c.licence];
    return `<div class="source-line"><b>${p.name}</b><br>${external(photoSource(c), c.title)} — ${escape(c.author)}<small>${licence ? external(licence, c.licence) : 'Released into the public domain by the author.'}</small><small>Resized and converted to WebP; cropped to fit the card. ${c.licence.includes('BY-SA') ? 'The adapted image is offered under the same licence.' : ''}</small><small>${external(p.image, 'View site image')}</small></div>`;
  }).join('');
}
$('#sources').onclick = () => show(`<h2>Location notes, sources & photo credits</h2>
  <p>Google Maps opens externally for routes and reviews. Travel estimates use driving mileages checked in Google Maps and confirmed on 12 November 2026, rounded to the nearest mile. No Google ratings or review counts are stored.</p>
  ${places.map(p => `<div class="source-line"><b>${p.name}</b><br>${external(route(p), 'Driving route')} · ${external(p.info, 'Visitor information')}</div>`).join('')}
  <p>${external(dogRules, 'Gwynedd dog restriction maps')}. Check access and any permission needed for a paid shoot with the location operator.</p>
  <h3>Photograph credits</h3><p>The Criccieth, Parc Glynllifon and Caernarfon card photographs are by OB Photography. The original reference-photo credits below are retained for the images distributed in this repository.</p><p>Other cards use location reference photographs by the credited creators. They do not show your photographer’s portfolio or current conditions. Sources and licences checked on 16 September 2026.</p>${photoCreditList()}
  <h3>Map and software credits</h3><p>Map and location points © ${external('https://www.openstreetmap.org/copyright', 'OpenStreetMap contributors')}. The map-point dataset is available under ${external('https://opendatacommons.org/licenses/odbl/1-0/', 'ODbL 1.0')}: ${external('map-points.js', 'view the dataset and source links')}. Pins are approximate location references, not agreed meeting points.</p><p>Leaflet 1.9.4: ${external('assets/leaflet-LICENSE.txt', 'BSD 2-Clause licence and copyright notices')}.</p>`);

if (window.L) {
  map = L.map('map', { scrollWheelZoom: false, zoomControl: true });
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>' }).addTo(map);
  const origin = mapPoints.origin;
  L.marker([origin.lat, origin.lng], { icon: L.divIcon({ className: 'origin-pin', iconSize: [16, 16] }), title: 'Starting point: Penygroes' }).addTo(map).bindTooltip('Penygroes · starting point', { permanent: true, direction: 'bottom', offset: [0, 10] });
  fit();
} else { $('#map').innerHTML = '<p style="padding:25px">The area map could not load. Use the Google Maps link or open a location’s driving route.</p>'; }
render();

if (document.modelContext?.registerTool) {
  const lifecycle = new AbortController();
  const tool = {
    name: 'filter_shoot_locations', title: 'Filter shoot locations', description: 'Update setting and dog filters. Returns confirmed approximate driving mileage and return travel estimates.',
    inputSchema: { type: 'object', properties: { setting: { type: 'string', enum: ['all', 'beach', 'woodland', 'town'] }, bringingDog: { type: 'boolean' } }, additionalProperties: false },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute(input) {
      if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Expected a filter object');
      const allowed = ['setting', 'bringingDog'];
      if (Object.keys(input).some(k => !allowed.includes(k))) throw new Error('Unknown filter');
      if (input.setting !== undefined && !['all', 'beach', 'woodland', 'town'].includes(input.setting)) throw new Error('Unknown setting');
      for (const k of allowed.slice(1)) if (input[k] !== undefined && typeof input[k] !== 'boolean') throw new Error(k + ' must be a boolean');
      if (input.setting !== undefined) category = input.setting;
      for (const [key, id] of [['bringingDog', 'dog']]) if (input[key] !== undefined) $('#' + id).checked = input[key];
      syncCategories(); render(); fit();
      return { locations: filtered().map(p => ({ name: p.name, milesOneWay: p.milesOneWay, mileageSource: 'confirmed Google Maps route, rounded', returnTravelGBP: charge(p), travelIncluded: charge(p) === 0, googleReviewsUrl: reviews(p) })) };
    }
  };
  try { Promise.resolve(document.modelContext.registerTool(tool, { signal: lifecycle.signal })).catch(() => {}); } catch {}
  addEventListener('pagehide', () => lifecycle.abort(), { once: true });
}
