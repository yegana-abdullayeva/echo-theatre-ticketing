const PITCH = 34;                       
const $ = s => document.querySelector(s);
const rowLetter = i => String.fromCharCode(65 + i);

const seats = new Map();                
let cart = [];                          
let inspectedId = null;

function generateSeats() {
  let y = VENUE.firstRowY;

  VENUE.zones.forEach((zone, zi) => {
    const startX = (VENUE.width - zone.cols * PITCH) / 2;

    for (let r = 0; r < zone.rows; r++) {
      for (let c = 0; c < zone.cols; c++) {
        const row = rowLetter(r);
        const num = c + 1;
        const id = `${zone.id}-${row}${num}`;

        seats.set(id, {
          id,
          zone,
          row,
          num,
          price: zone.price,
          sold: (r * 7 + c * 3 + zi * 5) % 11 === 0,   
          x: startX + c * PITCH,
          y: y + r * PITCH
        });
      }
    }

    y += zone.rows * PITCH + VENUE.zoneGap;
  });
}

function renderSeats() {
  const frag = document.createDocumentFragment();

  seats.forEach(s => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'seat';
    b.dataset.id = s.id;
    b.style.cssText = `left:${s.x}px; top:${s.y}px; --c:${s.zone.color}`;
    b.setAttribute(
      'aria-label',
      `${s.zone.name}, row ${s.row}, seat ${s.num}, ${s.price} AZN${s.sold ? ', unavailable' : ''}`
    );
    frag.appendChild(b);
  });

  $('#seats').appendChild(frag);
}

function renderLegend() {
  const items = [
    ...VENUE.zones.map(z => [z.color, `${z.name} – ${z.price} AZN`]),
    ['#22c55e', 'In cart'],
    ['#6b7280', 'Unavailable']
  ];

  $('#legend').innerHTML = items
    .map(([color, text]) => `<li><i style="background:${color}"></i>${text}</li>`)
    .join('');
}

function refreshSeat(id) {
  const el = document.querySelector(`.seat[data-id="${id}"]`);
  const s = seats.get(id);
  if (!el || !s) return;

  el.classList.toggle('unavailable', s.sold);
  el.classList.toggle('in-cart', cart.includes(id));
  el.classList.toggle('inspected', inspectedId === id);
  el.setAttribute('aria-pressed', String(inspectedId === id));
}

function inspect(id) {
  const prev = inspectedId;
  inspectedId = id;

  if (prev) refreshSeat(prev);
  refreshSeat(id);
  renderDetails();
}

function renderDetails() {
  const body = $('#details-body');
  const btn = $('#add-btn');
  const s = seats.get(inspectedId);

  if (!s) {
    body.textContent = 'Select a seat on the map.';
    btn.disabled = true;
    return;
  }

  const inCart = cart.includes(s.id);
  const status = s.sold ? 'Unavailable' : inCart ? 'In your cart' : 'Available';

  body.innerHTML = `
    <p><strong>${s.zone.name}</strong> · Row ${s.row} · Seat ${s.num}</p>
    <p>Price: <strong>${s.price} AZN</strong></p>
    <p>Status: ${status}</p>`;

  btn.disabled = s.sold || inCart;
}

$('#seats').addEventListener('click', e => {
  const b = e.target.closest('.seat');
  if (b) inspect(b.dataset.id);          
});

const view = { scale: 1, x: 0, y: 0 };
const MIN_SCALE = 0.4;
const MAX_SCALE = 2.5;
const STEP = 80;
const MARGIN = 80;

function clampAxis(value, content, box) {
  const lo = Math.min(box - content, 0) - MARGIN;
  const hi = Math.max(box - content, 0) + MARGIN;
  return Math.min(hi, Math.max(lo, value));
}

function applyView() {
  const vp = $('#viewport');
  view.x = clampAxis(view.x, VENUE.width * view.scale, vp.clientWidth);
  view.y = clampAxis(view.y, VENUE.height * view.scale, vp.clientHeight);

  $('#map').style.transform =
    `translate(${view.x}px, ${view.y}px) scale(${view.scale})`;
}

function zoomBy(factor, cx, cy) {
  const vp = $('#viewport');
  cx = cx ?? vp.clientWidth / 2;
  cy = cy ?? vp.clientHeight / 2;

  const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, view.scale * factor));
  const k = newScale / view.scale;

  view.x = cx - (cx - view.x) * k;       
  view.y = cy - (cy - view.y) * k;
  view.scale = newScale;
  applyView();
}

function resetView() {
  const vp = $('#viewport');
  view.scale = Math.min(1, vp.clientWidth / VENUE.width);
  view.x = (vp.clientWidth - VENUE.width * view.scale) / 2;
  view.y = 10;
  applyView();
}

$('.controls').addEventListener('click', e => {
  const action = e.target.closest('button')?.dataset.action;
  if (!action) return;

  if (action === 'zoom-in')  zoomBy(1.25);
  if (action === 'zoom-out') zoomBy(1 / 1.25);
  if (action === 'up')    { view.y += STEP; applyView(); }
  if (action === 'down')  { view.y -= STEP; applyView(); }
  if (action === 'left')  { view.x += STEP; applyView(); }
  if (action === 'right') { view.x -= STEP; applyView(); }
  if (action === 'reset') resetView();
});

function init() {
  renderLegend();
  generateSeats();
  renderSeats();
  seats.forEach((_, id) => refreshSeat(id));
  renderDetails();
  resetView();
}
init();