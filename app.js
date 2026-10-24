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

function init() {
  renderLegend();
  generateSeats();
  renderSeats();
  seats.forEach((_, id) => refreshSeat(id));
}
init();