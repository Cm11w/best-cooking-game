// Every pixel the player sees: the kitchen, the order board, the stations, the
// counter, the plate, and the title / pause / results screens. All art is drawn
// with canvas primitives — no image files. draw() takes the world state, the
// screen to show, the best score, and a clock (seconds) for flame and bubble
// animation. The playfield is the fixed 1280x720 field; this file scales it.
import { FIELD, INGREDIENTS, PALETTE, FONT, SHIFT_SECONDS } from './config.js';
import { LAYOUT } from './layout.js';

export const SCREEN_TITLE = 0;
export const SCREEN_PLAY = 1;
export const SCREEN_PAUSED = 2;
export const SCREEN_OVER = 3;

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function text(ctx, str, x, y, size, color, weight = 700, align = 'left') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(str, x, y);
}

function formatClock(seconds) {
  const left = Math.max(0, Math.ceil(seconds));
  const m = Math.floor(left / 60);
  const s = left % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** One ingredient icon, centred at (x, y), about `size` wide. */
export function drawIngredient(ctx, id, x, y, size) {
  const s = size;
  ctx.save();
  ctx.translate(x, y);
  if (id === 'bun') {
    ctx.fillStyle = '#e8a94e';
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.08, s * 0.46, s * 0.3, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#d18f35';
    ctx.fillRect(-s * 0.46, -s * 0.08, s * 0.92, s * 0.1);
    ctx.fillStyle = '#f6d493';
    ctx.fillRect(-s * 0.46, s * 0.04, s * 0.92, s * 0.12);
    ctx.fillStyle = '#fff3c4';
    for (const [dx, dy] of [[-0.22, -0.22], [0.05, -0.3], [0.26, -0.18], [-0.05, -0.14]]) {
      ctx.beginPath();
      ctx.ellipse(dx * s, dy * s, s * 0.045, s * 0.03, 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'patty' || id === 'patty-cooked') {
    const cooked = id === 'patty-cooked';
    ctx.fillStyle = cooked ? '#5e3a1e' : '#8a5a33';
    rr(ctx, -s * 0.46, -s * 0.16, s * 0.92, s * 0.32, s * 0.12);
    ctx.fill();
    ctx.strokeStyle = cooked ? '#3d2412' : '#6f4520';
    ctx.lineWidth = Math.max(2, s * 0.05);
    for (const dx of [-0.25, 0, 0.25]) {
      ctx.beginPath();
      ctx.moveTo(dx * s, -s * 0.14);
      ctx.lineTo(dx * s, s * 0.14);
      ctx.stroke();
    }
    if (cooked) {
      ctx.fillStyle = 'rgba(255,180,80,0.35)';
      ctx.beginPath();
      ctx.ellipse(-s * 0.2, -s * 0.05, s * 0.16, s * 0.05, -0.3, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'cheese') {
    ctx.fillStyle = '#ffc93c';
    ctx.beginPath();
    ctx.moveTo(-s * 0.44, s * 0.2);
    ctx.lineTo(s * 0.44, s * 0.2);
    ctx.lineTo(0, -s * 0.34);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e8a91c';
    for (const [dx, dy] of [[-0.16, 0.06], [0.14, 0.02], [0, -0.14]]) {
      ctx.beginPath();
      ctx.arc(dx * s, dy * s, s * 0.06, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'lettuce') {
    ctx.fillStyle = '#5fbf4a';
    ctx.beginPath();
    for (let i = 0; i < 5; i += 1) {
      const a = (i / 5) * Math.PI * 2;
      ctx.ellipse(Math.cos(a) * s * 0.26, Math.sin(a) * s * 0.16, s * 0.2, s * 0.14, a, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.fillStyle = '#8ed67e';
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.04, s * 0.26, s * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#3f8f33';
    ctx.lineWidth = Math.max(1.5, s * 0.03);
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.14);
    ctx.lineTo(0, s * 0.1);
    ctx.stroke();
  } else if (id === 'tomato') {
    ctx.fillStyle = '#e8443a';
    ctx.beginPath();
    ctx.arc(0, s * 0.04, s * 0.36, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff8a7a';
    ctx.beginPath();
    ctx.ellipse(-s * 0.13, -s * 0.1, s * 0.12, s * 0.08, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4caf50';
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.3, s * 0.12, s * 0.06, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'fries' || id === 'fries-cooked') {
    const cooked = id === 'fries-cooked';
    ctx.fillStyle = cooked ? '#f2b705' : '#f7d774';
    for (let i = -2; i <= 2; i += 1) {
      ctx.fillRect(i * s * 0.13 - s * 0.05, -s * 0.42 + (i % 2) * s * 0.06, s * 0.1, s * 0.5);
    }
    ctx.fillStyle = '#d63a2f';
    ctx.beginPath();
    ctx.moveTo(-s * 0.4, -s * 0.05);
    ctx.lineTo(s * 0.4, -s * 0.05);
    ctx.lineTo(s * 0.3, s * 0.4);
    ctx.lineTo(-s * 0.3, s * 0.4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff6dd';
    ctx.beginPath();
    ctx.arc(0, s * 0.16, s * 0.09, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawHeart(ctx, x, y, size, filled) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = filled ? PALETTE.heart : 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.moveTo(0, size * 0.32);
  ctx.bezierCurveTo(-size * 0.55, -size * 0.12, -size * 0.28, -size * 0.5, 0, -size * 0.18);
  ctx.bezierCurveTo(size * 0.28, -size * 0.5, size * 0.55, -size * 0.12, 0, size * 0.32);
  ctx.fill();
  ctx.restore();
}

function progressRing(ctx, x, y, r, frac, color) {
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, frac));
  ctx.stroke();
  ctx.lineCap = 'butt';
}

function drawFlame(ctx, x, y, size, time, seed) {
  const flick = 1 + 0.18 * Math.sin(time * 9 + seed * 2.1);
  ctx.fillStyle = '#ff7b24';
  ctx.beginPath();
  ctx.moveTo(x, y - size * flick);
  ctx.quadraticCurveTo(x + size * 0.55, y - size * 0.2, x + size * 0.28, y + size * 0.28);
  ctx.quadraticCurveTo(x, y + size * 0.45, x - size * 0.28, y + size * 0.28);
  ctx.quadraticCurveTo(x - size * 0.55, y - size * 0.2, x, y - size * flick);
  ctx.fill();
  ctx.fillStyle = '#ffc93c';
  ctx.beginPath();
  ctx.moveTo(x, y - size * 0.55 * flick);
  ctx.quadraticCurveTo(x + size * 0.3, y, x, y + size * 0.2);
  ctx.quadraticCurveTo(x - size * 0.3, y, x, y - size * 0.55 * flick);
  ctx.fill();
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const DPR = Math.min(2, window.devicePixelRatio || 1);

  function resize() {
    const w = canvas.clientWidth || FIELD.width;
    const h = canvas.clientHeight || FIELD.height;
    canvas.width = Math.round(w * DPR);
    canvas.height = Math.round(h * DPR);
    ctx.setTransform((canvas.width / FIELD.width), 0, 0, (canvas.height / FIELD.height), 0, 0);
  }

  function drawTopbar(state, muted) {
    const bar = LAYOUT.topbar;
    ctx.fillStyle = PALETTE.topbar;
    ctx.fillRect(bar.x, bar.y, bar.w, bar.h);
    ctx.fillStyle = PALETTE.topbarDark;
    ctx.fillRect(bar.x, bar.y + bar.h - 6, bar.w, 6);
    text(ctx, '🍳 SIZZLE & SERVE', 24, 38, 26, PALETTE.textLight, 800);
    // Coins
    ctx.fillStyle = '#fff6dd';
    rr(ctx, 300, 10, 150, 36, 18);
    ctx.fill();
    ctx.fillStyle = '#e8a91c';
    ctx.beginPath();
    ctx.arc(322, 28, 12, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, '$', 322, 33, 16, '#7a5200', 800, 'center');
    text(ctx, `${state.coins}`, 342, 34, 22, PALETTE.text, 800);
    // Combo
    if (state.combo > 1) {
      ctx.fillStyle = PALETTE.gold;
      rr(ctx, 462, 10, 118, 36, 18);
      ctx.fill();
      text(ctx, `COMBO x${state.combo}`, 521, 34, 18, '#7a5200', 800, 'center');
    }
    // Shift clock
    const frac = 1 - state.elapsed / SHIFT_SECONDS;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    rr(ctx, 620, 12, 300, 32, 16);
    ctx.fill();
    ctx.fillStyle = frac > 0.25 ? PALETTE.green : PALETTE.red;
    rr(ctx, 624, 16, 292 * Math.max(0, frac), 24, 12);
    ctx.fill();
    text(ctx, `SHIFT ${formatClock(Math.max(0, SHIFT_SECONDS - state.elapsed))}`, 770, 35, 20, '#ffffff', 800, 'center');
    // Hearts
    for (let i = 0; i < 3; i += 1) drawHeart(ctx, 968 + i * 34, 28, 26, i < state.hearts);
    // Mute
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    rr(ctx, LAYOUT.muteBtn.x, LAYOUT.muteBtn.y, LAYOUT.muteBtn.w, LAYOUT.muteBtn.h, 8);
    ctx.fill();
    text(ctx, muted ? '🔇' : '🔊', 1242, 36, 20, '#fff', 700, 'center');
  }

  function drawOrders(state) {
    const board = LAYOUT.board;
    ctx.fillStyle = PALETTE.board;
    rr(ctx, board.x, board.y, board.w, board.h, 12);
    ctx.fill();
    text(ctx, 'ORDER BOARD', 44, 92, 13, '#c9a86a', 800);
    for (let i = 0; i < 3; i += 1) {
      const r = LAYOUT.orderTicket(i);
      const order = state.orders[i];
      const selected = order !== undefined && state.selectedOrder === i;
      ctx.fillStyle = selected ? '#fff9e6' : PALETTE.boardPaper;
      rr(ctx, r.x, r.y, r.w, r.h, 10);
      ctx.fill();
      if (selected) {
        ctx.strokeStyle = PALETTE.gold;
        ctx.lineWidth = 4;
        rr(ctx, r.x, r.y, r.w, r.h, 10);
        ctx.stroke();
      }
      if (order === undefined) {
        text(ctx, '— waiting for the next customer —', r.x + r.w / 2, r.y + 62, 16, PALETTE.muted, 600, 'center');
        continue;
      }
      const frac = Math.max(0, order.patience / order.patienceMax);
      text(ctx, `#${order.id}  ${order.dish.name}`, r.x + 16, r.y + 30, 20, PALETTE.text, 800);
      text(ctx, `$${order.dish.price}`, r.x + r.w - 16, r.y + 30, 20, '#2e7d32', 800, 'right');
      // Recipe icons with checkmarks for what is already on the plate.
      const counts = {};
      for (const item of order.plate) counts[item] = (counts[item] ?? 0) + 1;
      const seen = {};
      order.dish.recipe.forEach((item, idx) => {
        const n = (seen[item] = (seen[item] ?? 0) + 1);
        const ix = r.x + 34 + idx * 44;
        const iy = r.y + 66;
        const done = (counts[item] ?? 0) >= n;
        ctx.globalAlpha = done ? 1 : 0.45;
        drawIngredient(ctx, item, ix, iy, 34);
        ctx.globalAlpha = 1;
        if (done) {
          ctx.fillStyle = PALETTE.green;
          ctx.beginPath();
          ctx.arc(ix + 13, iy + 12, 9, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(ix + 8, iy + 12);
          ctx.lineTo(ix + 12, iy + 16);
          ctx.lineTo(ix + 18, iy + 7);
          ctx.stroke();
        }
      });
      // Patience bar
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      rr(ctx, r.x + 16, r.y + 92, r.w - 32, 12, 6);
      ctx.fill();
      ctx.fillStyle = frac > 0.5 ? PALETTE.green : frac > 0.25 ? '#f2a007' : PALETTE.red;
      rr(ctx, r.x + 16, r.y + 92, (r.w - 32) * frac, 12, 6);
      ctx.fill();
      text(ctx, `${Math.ceil(order.patience)}s left`, r.x + r.w - 16, r.y + 86, 13, PALETTE.muted, 700, 'right');
    }
  }

  function drawStations(state, time) {
    // Grill
    const g = LAYOUT.grill;
    ctx.fillStyle = PALETTE.steelDark;
    rr(ctx, g.x, g.y, g.w, g.h, 12);
    ctx.fill();
    text(ctx, '🔥 GRILL', g.x + 16, g.y + 28, 18, '#fff', 800);
    for (let i = 0; i < state.grill.length; i += 1) {
      const slot = state.grill[i];
      const r = LAYOUT.grillSlot(i);
      ctx.fillStyle = PALETTE.grill;
      rr(ctx, r.x, r.y, r.w, r.h, 10);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 3;
      for (let gx = r.x + 18; gx < r.x + r.w - 10; gx += 22) {
        ctx.beginPath();
        ctx.moveTo(gx, r.y + 10);
        ctx.lineTo(gx, r.y + r.h - 10);
        ctx.stroke();
      }
      if (slot.item !== null) {
        if (!slot.burnt) drawFlame(ctx, r.x + r.w / 2, r.y + r.h - 14, 13, time, i);
        drawIngredient(ctx, slot.done ? 'patty-cooked' : 'patty', r.x + r.w / 2, r.y + r.h / 2 - 6, 74);
        const spec = { cook: 4, burnAt: 9 };
        const frac = Math.min(1, slot.t / spec.cook);
        progressRing(ctx, r.x + r.w / 2, r.y + r.h / 2 - 6, 46, frac, slot.burnt ? PALETTE.red : slot.done ? PALETTE.green : PALETTE.gold);
        if (slot.done && !slot.burnt) text(ctx, 'READY!', r.x + r.w / 2, r.y + r.h - 10, 14, PALETTE.green, 800, 'center');
        if (slot.burnt) text(ctx, 'BURNT — click to toss', r.x + r.w / 2, r.y + r.h - 10, 13, '#ff9d8a', 800, 'center');
      } else {
        text(ctx, 'empty', r.x + r.w / 2, r.y + r.h / 2 + 6, 15, 'rgba(255,255,255,0.35)', 600, 'center');
      }
    }
    // Fryer
    const f = LAYOUT.fryer;
    ctx.fillStyle = PALETTE.steel;
    rr(ctx, f.x, f.y, f.w, f.h, 12);
    ctx.fill();
    text(ctx, '🍟 FRYER', f.x + 16, f.y + 28, 18, PALETTE.text, 800);
    for (let i = 0; i < state.fryer.length; i += 1) {
      const slot = state.fryer[i];
      const r = LAYOUT.fryerSlot(i);
      ctx.fillStyle = '#f7c948';
      rr(ctx, r.x, r.y, r.w, r.h, 10);
      ctx.fill();
      if (slot.item !== null) {
        if (!slot.burnt) {
          ctx.fillStyle = 'rgba(255,255,255,0.55)';
          for (let b = 0; b < 4; b += 1) {
            const bx = r.x + 20 + ((b * 23 + Math.floor(time * 30 + b * 7)) % 76);
            const by = r.y + r.h - 18 - ((time * 26 + b * 19) % (r.h - 30));
            ctx.beginPath();
            ctx.arc(bx, by, 4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        drawIngredient(ctx, slot.done ? 'fries-cooked' : 'fries', r.x + r.w / 2, r.y + r.h / 2 - 4, 64);
        const frac = Math.min(1, slot.t / 5);
        progressRing(ctx, r.x + r.w / 2, r.y + r.h / 2 - 4, 40, frac, slot.burnt ? PALETTE.red : slot.done ? PALETTE.green : '#e8a91c');
        if (slot.done && !slot.burnt) text(ctx, 'READY!', r.x + r.w / 2, r.y + r.h - 10, 14, '#2e7d32', 800, 'center');
        if (slot.burnt) text(ctx, 'BURNT — click to toss', r.x + r.w / 2, r.y + r.h - 10, 12, PALETTE.red, 800, 'center');
      } else {
        text(ctx, 'empty', r.x + r.w / 2, r.y + r.h / 2 + 6, 15, 'rgba(0,0,0,0.35)', 600, 'center');
      }
    }
    // Tray
    const t = LAYOUT.tray;
    ctx.fillStyle = PALETTE.wood;
    rr(ctx, t.x, t.y, t.w, t.h, 12);
    ctx.fill();
    text(ctx, 'TRAY — click to add', t.x + 16, t.y + 28, 15, '#fff6dd', 800);
    for (let i = 0; i < state.tray.length; i += 1) {
      const r = LAYOUT.traySlot(i);
      ctx.fillStyle = 'rgba(255,255,255,0.14)';
      rr(ctx, r.x, r.y, r.w, r.h, 8);
      ctx.fill();
      if (state.tray[i] !== null) {
        drawIngredient(ctx, state.tray[i], r.x + 26, r.y + r.h / 2, 32);
        text(ctx, state.tray[i] === 'patty-cooked' ? 'Cooked patty' : 'Crispy fries', r.x + 50, r.y + 26, 15, '#fff', 700);
      }
    }
    // Serve panel
    const s = LAYOUT.servePanel;
    ctx.fillStyle = PALETTE.board;
    rr(ctx, s.x, s.y, s.w, s.h, 12);
    ctx.fill();
    const order = state.orders[state.selectedOrder];
    const ready = order !== undefined && state.orders.length > 0 && order.plate.length === order.dish.recipe.length;
    const sb = LAYOUT.serveBtn;
    ctx.fillStyle = ready ? PALETTE.green : '#6d7c6d';
    rr(ctx, sb.x, sb.y, sb.w, sb.h, 12);
    ctx.fill();
    if (ready) {
      ctx.strokeStyle = PALETTE.gold;
      ctx.lineWidth = 4;
      rr(ctx, sb.x, sb.y, sb.w, sb.h, 12);
      ctx.stroke();
    }
    text(ctx, '🔔 SERVE', sb.x + sb.w / 2, sb.y + 32, 24, '#fff', 800, 'center');
    text(ctx, ready ? 'dish is ready!' : 'finish the plate', sb.x + sb.w / 2, sb.y + 56, 14, 'rgba(255,255,255,0.85)', 600, 'center');
    const cb = LAYOUT.clearBtn;
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    rr(ctx, cb.x, cb.y, cb.w, cb.h, 8);
    ctx.fill();
    text(ctx, '✕  Clear plate', cb.x + cb.w / 2, cb.y + 26, 15, '#fff', 700, 'center');
    text(ctx, 'Served', s.x + 16, s.y + 178, 15, '#c9a86a', 700);
    text(ctx, `${state.served} dishes`, s.x + 16, s.y + 200, 18, '#fff6dd', 800);
  }

  function drawCounter(state) {
    const c = LAYOUT.counter;
    ctx.fillStyle = PALETTE.counter;
    rr(ctx, c.x, c.y, c.w, c.h, 12);
    ctx.fill();
    ctx.fillStyle = PALETTE.woodDark;
    ctx.fillRect(c.x, c.y, c.w, 8);
    text(ctx, 'INGREDIENTS — click a bin (or press 1–6)', 44, c.y + 30, 14, PALETTE.muted, 700);
    INGREDIENTS.forEach((def, i) => {
      const r = LAYOUT.bin(i);
      ctx.fillStyle = '#fffdf6';
      rr(ctx, r.x, r.y + 8, r.w, r.h - 8, 10);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.12)';
      ctx.lineWidth = 2;
      rr(ctx, r.x, r.y + 8, r.w, r.h - 8, 10);
      ctx.stroke();
      drawIngredient(ctx, def.id, r.x + r.w / 2, r.y + 48, 52);
      text(ctx, def.label, r.x + r.w / 2, r.y + 84, 16, PALETTE.text, 800, 'center');
      ctx.fillStyle = PALETTE.topbar;
      ctx.beginPath();
      ctx.arc(r.x + r.w - 16, r.y + 22, 11, 0, Math.PI * 2);
      ctx.fill();
      text(ctx, def.key, r.x + r.w - 16, r.y + 27, 13, '#fff', 800, 'center');
      if (def.station === 'grill') text(ctx, '→ grill', r.x + r.w / 2, r.y + 100, 12, PALETTE.muted, 600, 'center');
      if (def.station === 'fryer') text(ctx, '→ fryer', r.x + r.w / 2, r.y + 100, 12, PALETTE.muted, 600, 'center');
    });
  }

  function drawPlate(state) {
    const a = LAYOUT.plateArea;
    ctx.fillStyle = PALETTE.wallDark;
    rr(ctx, a.x, a.y, a.w, a.h, 12);
    ctx.fill();
    const order = state.orders[state.selectedOrder];
    text(ctx, order ? `PLATE — ${order.dish.name}` : 'PLATE — no order selected', 44, a.y + 34, 18, PALETTE.text, 800);
    text(ctx, 'Click a ticket to pick an order, then add what its recipe needs.', 44, a.y + 58, 14, PALETTE.muted, 600);
    // The plate itself: stacked layers of what is already on it.
    const p = LAYOUT.plate;
    ctx.fillStyle = '#e8e2d4';
    ctx.beginPath();
    ctx.ellipse(p.x + p.w / 2, p.y + p.h / 2 + 6, p.w / 2, p.h / 2 - 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.plate;
    ctx.beginPath();
    ctx.ellipse(p.x + p.w / 2, p.y + p.h / 2, p.w / 2 - 8, p.h / 2 - 12, 0, 0, Math.PI * 2);
    ctx.fill();
    if (order !== undefined) {
      const counts = {};
      for (const item of order.plate) counts[item] = (counts[item] ?? 0) + 1;
      const seen = {};
      order.dish.recipe.forEach((item, idx) => {
        const n = (seen[item] = (seen[item] ?? 0) + 1);
        const done = (counts[item] ?? 0) >= n;
        const ix = p.x + 26 + idx * 40;
        const iy = p.y + p.h / 2;
        ctx.globalAlpha = done ? 1 : 0.3;
        drawIngredient(ctx, item, ix, iy, 34);
        ctx.globalAlpha = 1;
      });
      const doneCount = order.plate.length;
      text(ctx, `${doneCount}/${order.dish.recipe.length} on the plate`, 44, a.y + 86, 18, PALETTE.text, 800);
      if (doneCount === order.dish.recipe.length) {
        text(ctx, '✓ Ready to serve!', 44, a.y + 108, 16, '#2e7d32', 800);
      }
    }
    // Toast message
    if (state.toast !== '') {
      ctx.fillStyle = 'rgba(43,29,18,0.85)';
      const tw = ctx.measureText(state.toast).width + 32;
      rr(ctx, 1280 - tw - 24, a.y + 20, tw, 36, 18);
      ctx.fill();
      text(ctx, state.toast, 1280 - 24 - 16, a.y + 44, 15, '#fff6dd', 700, 'right');
    }
  }

  function drawKitchen(state, time, muted) {
    // Wall + floor
    ctx.fillStyle = PALETTE.wall;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.fillStyle = PALETTE.floor;
    ctx.fillRect(0, 448, FIELD.width, 272);
    ctx.fillStyle = PALETTE.floorDark;
    for (let x = 0; x < FIELD.width; x += 96) {
      ctx.fillRect(x, 448, 4, 272);
      ctx.fillRect(x, 560, 96, 4);
    }
    // Awning stripes on the wall
    for (let x = 0; x < FIELD.width; x += 80) {
      ctx.fillStyle = x % 160 === 0 ? '#a83226' : '#fff6dd';
      ctx.fillRect(x, 56, 80, 10);
    }
    drawTopbar(state, muted);
    drawOrders(state);
    drawStations(state, time);
    drawCounter(state);
    drawPlate(state);
  }

  function drawTitle(state, best, time) {
    drawKitchen(state, time, false);
    ctx.fillStyle = 'rgba(43,29,18,0.72)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.fillStyle = PALETTE.boardPaper;
    rr(ctx, 290, 110, 700, 500, 18);
    ctx.fill();
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 5;
    rr(ctx, 290, 110, 700, 500, 18);
    ctx.stroke();
    text(ctx, '🍳', 640, 200, 64, '#000', 700, 'center');
    text(ctx, 'SIZZLE & SERVE', 640, 262, 54, PALETTE.topbar, 800, 'center');
    text(ctx, 'Rush Hour Kitchen', 640, 300, 26, PALETTE.text, 700, 'center');
    text(ctx, 'The lunch rush is on! Take orders, grill patties,', 640, 352, 19, PALETTE.text, 600, 'center');
    text(ctx, 'fry the fries, build each dish and serve it before', 640, 380, 19, PALETTE.text, 600, 'center');
    text(ctx, 'the customer walks out. Three strikes and the kitchen closes.', 640, 408, 19, PALETTE.text, 600, 'center');
    text(ctx, 'Click bins & stations  •  1–6 ingredients  •  S serve  •  P pause', 640, 452, 16, PALETTE.muted, 700, 'center');
    if (best > 0) text(ctx, `Best shift: $${best}`, 640, 492, 20, '#2e7d32', 800, 'center');
    const pulse = 0.75 + 0.25 * Math.sin(time * 4);
    ctx.globalAlpha = pulse;
    ctx.fillStyle = PALETTE.topbar;
    rr(ctx, 490, 516, 300, 56, 12);
    ctx.fill();
    text(ctx, 'CLICK OR PRESS SPACE', 640, 552, 20, '#fff', 800, 'center');
    ctx.globalAlpha = 1;
  }

  function drawOver(state, best, time) {
    drawKitchen(state, time, false);
    ctx.fillStyle = 'rgba(43,29,18,0.72)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.fillStyle = PALETTE.boardPaper;
    rr(ctx, 340, 130, 600, 460, 18);
    ctx.fill();
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 5;
    rr(ctx, 340, 130, 600, 460, 18);
    ctx.stroke();
    const closed = state.overReason === 'closed';
    text(ctx, closed ? '😖 KITCHEN CLOSED!' : '⏰ SHIFT OVER!', 640, 210, 40, PALETTE.topbar, 800, 'center');
    text(ctx, closed ? 'Three customers walked out.' : 'The lunch rush is done.', 640, 248, 20, PALETTE.text, 600, 'center');
    const rows = [
      ['Coins earned', `$${state.coins}`],
      ['Dishes served', `${state.served}`],
      ['Best combo', `x${state.bestCombo}`],
      ['Customers lost', `${state.mistakes}`],
      ['Best shift', `$${Math.max(best, state.coins)}`],
    ];
    rows.forEach(([label, value], i) => {
      const y = 300 + i * 44;
      text(ctx, label, 400, y, 20, PALETTE.text, 600);
      text(ctx, value, 880, y, 20, PALETTE.text, 800, 'right');
    });
    const title = state.coins >= 120 ? '🏆 Head Chef!' : state.coins >= 70 ? '⭐ Sous Chef' : state.coins >= 35 ? '👨‍🍳 Line Cook' : '🥄 Kitchen Trainee';
    text(ctx, title, 640, 536, 24, '#2e7d32', 800, 'center');
    const pulse = 0.75 + 0.25 * Math.sin(time * 4);
    ctx.globalAlpha = pulse;
    text(ctx, 'Press R or click to cook again', 640, 572, 18, PALETTE.muted, 700, 'center');
    ctx.globalAlpha = 1;
  }

  function drawPaused(state, time) {
    drawKitchen(state, time, false);
    ctx.fillStyle = 'rgba(43,29,18,0.6)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    text(ctx, '⏸ PAUSED', 640, 330, 56, '#fff6dd', 800, 'center');
    text(ctx, 'Press P or click to keep cooking', 640, 380, 22, '#fff6dd', 600, 'center');
  }

  return {
    draw(state, screen, best, time, muted) {
      resize();
      ctx.clearRect(0, 0, FIELD.width, FIELD.height);
      if (screen === SCREEN_TITLE) drawTitle(state, best, time);
      else if (screen === SCREEN_OVER) drawOver(state, best, time);
      else if (screen === SCREEN_PAUSED) drawPaused(state, time);
      else drawKitchen(state, time, muted);
    },
  };
}
