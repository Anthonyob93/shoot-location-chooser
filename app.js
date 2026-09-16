import { places, dogRules } from './places.js';
import { travelCharge, INCLUDED_MILES, parseMileage } from './travel.js';
import { photoCredits, licenceUrls, photoSource } from './credits.js';
import { mapPoints } from './map-points.js';

let category = 'all', selected = 'glynllifon', map, markers = [];
// Entries belong only to this open page: no cookies, local storage or server collection.
const mileage = new Map();
const $ = s => document.querySelector(s);
const money = n => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n);
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const external = (href, label) => `<a href="${escape(href)}" target="_blank" rel="noopener">${escape(label)} ↗</a>`;
const route = p => 'https://www.google.com/maps/dir/?api=1&origin=Penygroes%2C+Gwynedd%2C+Wales&destination=' + encodeURIComponent(p.routeDestination || p.destination) + '&travelmode=driving';
const reviews = p => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(p.destination);
const status = p => p.checked ? 'Personally checked' : 'To be scouted';
const charge = p => mileage.has(p.id) ? travelCharge(mileage.get(p.id)) : null;
const travelLabel = p => charge(p) === null ? 'Check travel' : charge(p) === 0 ? 'Included' : '+' + money(charge(p));
const travelDetail = p => charge(p) === null ? 'enter mileage' : charge(p) === 0 ? 'travel within 20 miles' : 'extra return travel';
const guideLink = p => p.guide ? `<div class="recommendation"><span>FEATURED IN A PHOTO GUIDE</span>${external(p.guide.url, p.guide.name)}</div>` : '';
const creditCaption = p => { const c = photoCredits[p.id]; return `<div class="photo-credit">Photo: ${external(photoSource(c), c.author)}<span>${licenceUrls[c.licence] ? external(licenceUrls[c.licence], c.licence) : c.licence}</span></div>`; };

function filtered() {
  const result = places.filter(p => (category === 'all' || p.type === category) && (!$('#easy').checked || p.easy) && (!$('#dog').checked || p.dog === 'yes') && (!$('#checked').checked || p.checked) && (!$('#photographer').checked || p.guide));
  return result.sort((a, b) => $('#sort').value === 'distance'
    ? (mileage.get(a.id) ?? Infinity) - (mileage.get(b.id) ?? Infinity)
    : Number(b.checked) - Number(a.checked));
}

function render() {
  const list = filtered();
  if (!list.some(p => p.id === selected)) selected = list[0]?.id ?? null;
  $('#count').textContent = `${list.length} ${list.length === 1 ? 'place' : 'places'} · ${list.filter(p => p.checked).length} personally checked`;
  $('#filter-note').hidden = !($('#easy').checked || $('#dog').checked);
  $('#filter-note').textContent = [$('#easy').checked ? 'Easy walking includes promenade or gentler-path options; beach surfaces may still be uneven.' : '', $('#dog').checked ? 'Showing places without seasonal beach exclusions. Untick “Bringing a dog” to see beach options and their restrictions.' : ''].filter(Boolean).join(' ');
  $('#cards').innerHTML = list.length ? list.map(p => `<article class="location-card ${p.id === selected ? 'selected' : ''}" data-id="${p.id}">
    <div class="card-image"><img src="${p.image}" alt="${escape(p.name)}" loading="lazy"><span class="number">${places.indexOf(p) + 1}</span>${creditCaption(p)}</div>
    <div class="card-main"><div class="card-top"><span class="category">${p.type}</span><span class="rating">${external(reviews(p), 'Google reviews')}</span></div>
    <button class="place-title" data-select="${p.id}" aria-pressed="${p.id === selected}">${p.name}</button><p class="description">${p.description}</p>
    <div class="tags">${p.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div><span class="check-label ${p.checked ? 'checked' : ''}">${p.checked ? '✓' : '○'} ${status(p)}</span>${guideLink(p)}
    <div class="card-bottom"><div class="miles">${mileage.has(p.id) ? mileage.get(p.id) + ' miles entered<small>one-way driving distance</small>' : 'From Penygroes<small>check your driving route</small>'}</div>
    <button class="price travel-select ${charge(p) === 0 ? 'included' : ''}" data-travel="${p.id}" aria-label="Calculate travel for ${escape(p.name)}">${travelLabel(p)}<small>${travelDetail(p)}</small></button></div></div></article>`).join('')
    : `<div class="empty"><h3>No locations match just yet.</h3><p>${$('#checked').checked && category === 'town' ? 'The town suggestions are still to be scouted. Untick “Personally checked” to explore them.' : $('#dog').checked && category === 'beach' ? 'These beaches have seasonal dog restrictions. Untick “Bringing a dog” to review their access notes, or try a woodland setting.' : 'Try a different setting or relax one of your needs.'}</p><button id="reset">Reset filters</button></div>`;
  document.querySelectorAll('[data-select]').forEach(b => b.onclick = () => select(b.dataset.select));
  document.querySelectorAll('[data-travel]').forEach(b => b.onclick = () => { select(b.dataset.travel); $('#mileage-input')?.focus(); });
  $('#reset')?.addEventListener('click', reset);
  renderMap(list);
  renderDetail();
  const p = places.find(p => p.id === selected);
  $('#google-open').hidden = !p;
  if (p) $('#google-open').href = reviews(p);
}

function select(id) { selected = id; render(); const point = mapPoints[id]; if (point && map) map.panTo([point.lat, point.lng]); }
function reset() { category = 'all'; ['easy', 'dog', 'checked', 'photographer'].forEach(id => $('#' + id).checked = false); $('#sort').value = 'recommended'; syncCategories(); render(); fit(); }
function syncCategories() { document.querySelectorAll('[data-category]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.category === category))); }
function fit() { if (map) map.fitBounds([mapPoints.origin, ...filtered().map(p => mapPoints[p.id])].map(p => [p.lat, p.lng]), { padding: [25, 25], maxZoom: 12 }); }
function renderMap(list) {
  if (!map) return;
  markers.forEach(m => m.remove());
  markers = list.map(p => { const point = mapPoints[p.id]; return L.marker([point.lat, point.lng], {
    icon: L.divIcon({ className: 'price-pin' + (p.id === selected ? ' active' : ''), html: String(places.indexOf(p) + 1), iconAnchor: [14, 14] }),
    title: `${p.name} · ${status(p)}`, alt: `${p.name}, ${travelLabel(p)}`
  }).addTo(map).bindTooltip(`${p.name} · ${travelLabel(p)}`).on('click', () => select(p.id)); });
}

function renderDetail() {
  const p = places.find(p => p.id === selected);
  if (!p) { $('#map-detail').innerHTML = '<h3>A little change of scenery?</h3><p>Adjust your filters to see more places on the map.</p>'; return; }
  const miles = mileage.get(p.id), extra = charge(p);
  const result = extra === null ? 'Enter the one-way driving miles from Penygroes to estimate your travel extra.'
    : extra === 0 ? `${miles} miles from Penygroes · <b>Travel included</b>`
    : `(${miles} − ${INCLUDED_MILES} included miles) × 2 × 75p = <b>${money(extra)}</b>`;
  $('#map-detail').innerHTML = `<div class="detail-heading"><div><span class="detail-tag">IN FOCUS · ${p.type.toUpperCase()}</span><h3>${p.name}</h3></div><div class="price ${extra === 0 ? 'included' : ''}">${travelLabel(p)}<small>${travelDetail(p)}</small></div></div>
    <div class="detail-meta"><span class="check-label ${p.checked ? 'checked' : ''}">${p.checked ? '✓' : '○'} ${status(p)}</span>${external(reviews(p), 'Read Google reviews')}</div><p>${p.note}</p>
    <a class="route-link" href="${route(p)}" target="_blank" rel="noopener">Check driving miles on Google Maps <span>↗</span></a>
    <form id="mileage-form" class="mileage-form"><label for="mileage-input">One-way driving distance from Penygroes</label><div class="mileage-controls"><input id="mileage-input" type="number" inputmode="decimal" min="0" step="any" required placeholder="Miles" value="${miles ?? ''}" aria-describedby="mileage-help mileage-error"><button type="submit">Calculate travel</button></div><p id="mileage-help">Choose your route in Google Maps, then enter its distance in miles here.</p><p id="mileage-error" class="mileage-error" role="alert"></p></form>
    <div id="travel-result" class="mileage-breakdown" role="status">${result}</div>
    ${extra === null ? '' : '<button id="clear-mileage" class="clear-mileage">Clear entered mileage</button><p class="estimate-note">Estimate based on your entry. Confirm the meeting point and final travel charge with your photographer.</p>'}
    ${p.guide ? `<div class="recommendation-detail"><b>Featured in ${external(p.guide.url, p.guide.label)}</b><p>${p.guide.summary}</p><small>Reading reference; no endorsement of this service.</small></div>` : ''}
    <div class="practical-links">${external(p.info, 'Visit information')}${p.dog === 'seasonal' ? external(p.dogInfo || dogRules, 'Dog restriction maps') : ''}</div>`;
  $('#mileage-form').onsubmit = event => {
    event.preventDefault();
    try {
      const value = parseMileage($('#mileage-input').value);
      mileage.set(p.id, value);
      render();
      $('#travel-result').setAttribute('tabindex', '-1');
      $('#travel-result').focus();
    } catch (error) { $('#mileage-error').textContent = error.message; }
  };
  $('#clear-mileage')?.addEventListener('click', () => { mileage.delete(p.id); render(); $('#mileage-input').focus(); });
}

const dialog = $('#details');
function show(content) { $('#dialog-content').innerHTML = content; dialog.showModal(); }
$('.close-dialog').onclick = () => dialog.close();
dialog.addEventListener('click', e => { if (e.target === dialog) { const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close(); } });
document.querySelectorAll('[data-category]').forEach(b => b.onclick = () => { category = b.dataset.category; syncCategories(); render(); fit(); });
['easy', 'dog', 'checked', 'photographer', 'sort'].forEach(id => $('#' + id).addEventListener('change', () => { render(); fit(); }));
$('#fit-map').onclick = fit;
$('#travel-info').onclick = () => show('<h2>Travel within 20 miles is included</h2><p>Locations up to and including 20 driving miles from Penygroes, Gwynedd have no travel extra. The allowance is based on the one-way drive and includes the return journey.</p><p>For locations farther away, only the miles beyond 20 are charged at 75p per mile, in both directions.</p><div class="charge">25 miles: (25 − 20) × 2 × £0.75 = £7.50</div><p>Open the driving route on Google Maps and enter the one-way distance in miles. Your estimate uses that entry and doubles the excess distance for the return journey. Entries stay only in this open page and clear on reload.</p><p>Confirm the meeting point and final travel charge with your photographer. Parking, admission and any location fees remain separate.</p>');

function photoCreditList() {
  return places.map(p => {
    const c = photoCredits[p.id], licence = licenceUrls[c.licence];
    return `<div class="source-line"><b>${p.name}</b><br>${external(photoSource(c), c.title)} — ${escape(c.author)}<small>${licence ? external(licence, c.licence) : 'Released into the public domain by the author.'}</small><small>Resized and converted to WebP; cropped to fit the card. ${c.licence.includes('BY-SA') ? 'The adapted image is offered under the same licence.' : ''}</small><small>${external(p.image, 'View site image')}</small></div>`;
  }).join('');
}
$('#sources').onclick = () => show(`<h2>Location notes, sources & photo credits</h2>
  <p>Parc Glynllifon, Criccieth Beach and Marian-y-de have been personally checked by your photographer. The remaining places are suggestions to be scouted.</p>
  <p>Photography guides are linked as further reading about these locations. The brief descriptions here are our own factual summaries, not quotations. The guide authors have not endorsed this service. Location photographs are separately credited below and are not the guide authors’ work.</p>
  <p>Google Maps opens externally for routes and reviews. This site has no saved Google ratings, review counts, route distances or travel times. Travel estimates use the mileage you enter and are not saved after you reload the page.</p>
  ${places.map(p => `<div class="source-line"><b>${p.name}</b><br>${external(route(p), 'Driving route')} · ${external(reviews(p), 'Google reviews')} · ${external(p.info, 'Visitor information')}${p.guide ? `<br>${external(p.guide.url, p.guide.label)}` : ''}</div>`).join('')}
  <p>${external(dogRules, 'Gwynedd dog restriction maps')}. “Easy walking” means a gentler path or promenade option, not guaranteed step-free access. Check access and any permission needed for a paid shoot with the location operator.</p>
  <h3>Photograph credits</h3><p>These are location reference photographs by the credited creators. They do not show your photographer’s portfolio or current conditions. Sources and licences checked on 16 September 2026.</p>${photoCreditList()}
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
    name: 'filter_shoot_locations', title: 'Filter shoot locations', description: 'Update location filters. Returns travel estimates only where the visitor has entered mileage; unknown travel is null. PhotographerRecommended means featured in a linked photography guide.',
    inputSchema: { type: 'object', properties: { setting: { type: 'string', enum: ['all', 'beach', 'woodland', 'town'] }, easyWalking: { type: 'boolean' }, bringingDog: { type: 'boolean' }, personallyChecked: { type: 'boolean' }, photographerRecommended: { type: 'boolean' } }, additionalProperties: false },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute(input) {
      if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Expected a filter object');
      const allowed = ['setting', 'easyWalking', 'bringingDog', 'personallyChecked', 'photographerRecommended'];
      if (Object.keys(input).some(k => !allowed.includes(k))) throw new Error('Unknown filter');
      if (input.setting !== undefined && !['all', 'beach', 'woodland', 'town'].includes(input.setting)) throw new Error('Unknown setting');
      for (const k of allowed.slice(1)) if (input[k] !== undefined && typeof input[k] !== 'boolean') throw new Error(k + ' must be a boolean');
      if (input.setting !== undefined) category = input.setting;
      for (const [key, id] of [['easyWalking', 'easy'], ['bringingDog', 'dog'], ['personallyChecked', 'checked'], ['photographerRecommended', 'photographer']]) if (input[key] !== undefined) $('#' + id).checked = input[key];
      syncCategories(); render(); fit();
      return { locations: filtered().map(p => ({ name: p.name, milesOneWay: mileage.get(p.id) ?? null, mileageSource: mileage.has(p.id) ? 'visitor entry' : null, returnTravelGBP: charge(p), personallyChecked: p.checked, travelIncluded: charge(p) === null ? null : charge(p) === 0, photographyGuide: p.guide?.url ?? null, googleReviewsUrl: reviews(p) })) };
    }
  };
  try { Promise.resolve(document.modelContext.registerTool(tool, { signal: lifecycle.signal })).catch(() => {}); } catch {}
  addEventListener('pagehide', () => lifecycle.abort(), { once: true });
}
