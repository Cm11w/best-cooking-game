// The game's rules and state, with no drawing and no browser in it: orders on
// the board, the grill and fryer, the holding tray, the assembly plate, coins,
// combo, hearts and the shift clock. step() advances one fixed step and returns
// what happened as bit flags, so the caller can react (sound, announcements)
// without the world knowing about screens or sound. Clicks arrive as field
// coordinates and are routed here, so the same code drives play and the
// screenshot autopilot. Nothing here allocates after createWorld returns.
import {
  COOK,
  COOKED,
  DISHES,
  FRYER_SLOTS,
  GRILL_SLOTS,
  HEARTS,
  INGREDIENTS,
  MAX_ORDERS,
  menuFor,
  ORDERS,
  SHIFT_SECONDS,
  TRAY_SLOTS,
} from './config.js';
import { inside, LAYOUT } from './layout.js';

export const EVENT_ADD = 1;
export const EVENT_COOK_DONE = 2;
export const EVENT_SERVE = 4;
export const EVENT_EXPIRE = 8;
export const EVENT_BURN = 16;
export const EVENT_ERROR = 32;
export const EVENT_OVER = 64;
export const EVENT_TICK = 128;

let nextOrderId = 1;

function sortedCopy(list) {
  return list.slice().sort();
}

function sameMultiset(a, b) {
  if (a.length !== b.length) return false;
  const sa = sortedCopy(a);
  const sb = sortedCopy(b);
  for (let i = 0; i < sa.length; i += 1) if (sa[i] !== sb[i]) return false;
  return true;
}

function countOf(list, id) {
  let n = 0;
  for (const item of list) if (item === id) n += 1;
  return n;
}

export function createWorld(random) {
  const state = {
    elapsed: 0,
    coins: 0,
    served: 0,
    mistakes: 0,
    combo: 0,
    bestCombo: 0,
    hearts: HEARTS,
    over: false,
    overReason: '',
    orders: [],
    grill: [],
    fryer: [],
    tray: [],
    spawnTimer: ORDERS.firstAt,
    selectedOrder: 0,
    toast: '',
    toastT: 0,
    sizzle: 0,
  };
  for (let i = 0; i < GRILL_SLOTS; i += 1) state.grill.push({ item: null, t: 0, done: false, burnt: false });
  for (let i = 0; i < FRYER_SLOTS; i += 1) state.fryer.push({ item: null, t: 0, done: false, burnt: false });
  for (let i = 0; i < TRAY_SLOTS; i += 1) state.tray.push(null);

  function reset() {
    state.elapsed = 0;
    state.coins = 0;
    state.served = 0;
    state.mistakes = 0;
    state.combo = 0;
    state.bestCombo = 0;
    state.hearts = HEARTS;
    state.over = false;
    state.overReason = '';
    state.orders.length = 0;
    for (const slot of state.grill) { slot.item = null; slot.t = 0; slot.done = false; slot.burnt = false; }
    for (const slot of state.fryer) { slot.item = null; slot.t = 0; slot.done = false; slot.burnt = false; }
    for (let i = 0; i < state.tray.length; i += 1) state.tray[i] = null;
    state.spawnTimer = ORDERS.firstAt;
    state.selectedOrder = 0;
    state.toast = '';
    state.toastT = 0;
    state.sizzle = 0;
  }

  function setToast(text) {
    state.toast = text;
    state.toastT = 2.4;
  }

  function progress() {
    return Math.min(1, state.elapsed / SHIFT_SECONDS);
  }

  function spawnOrder() {
    const menu = menuFor(state.elapsed);
    const dish = menu[Math.floor(random() * menu.length)];
    const patience = ORDERS.patienceStart + (ORDERS.patienceEnd - ORDERS.patienceStart) * progress();
    state.orders.push({
      id: nextOrderId,
      dish,
      patience,
      patienceMax: patience,
      plate: [],
    });
    nextOrderId += 1;
    if (state.orders.length === 1) state.selectedOrder = 0;
  }

  function selected() {
    return state.orders[state.selectedOrder] ?? null;
  }

  function plateComplete(order) {
    return sameMultiset(order.plate, order.dish.recipe);
  }

  function plateNeeds(order, itemId) {
    return countOf(order.dish.recipe, itemId) > countOf(order.plate, itemId);
  }

  /** Add an ingredient to the selected order's plate. Returns an event flag. */
  function addToPlate(itemId) {
    const order = selected();
    if (order === null) {
      setToast('No order yet — wait for the first ticket!');
      return EVENT_ERROR;
    }
    if (!plateNeeds(order, itemId)) {
      setToast(`That does not go in a ${order.dish.name}.`);
      return EVENT_ERROR;
    }
    order.plate.push(itemId);
    if (plateComplete(order)) setToast(`${order.dish.name} is ready — SERVE it!`);
    return EVENT_ADD;
  }

  function freeSlot(slots) {
    for (let i = 0; i < slots.length; i += 1) if (slots[i].item === null) return i;
    return -1;
  }

  function freeTray() {
    for (let i = 0; i < state.tray.length; i += 1) if (state.tray[i] === null) return i;
    return -1;
  }

  /** Route a click on an ingredient bin. Raw cookables go to their station. */
  function clickBin(ingredientId) {
    const def = INGREDIENTS.find((item) => item.id === ingredientId);
    if (def === undefined) return 0;
    if (def.station === 'grill') {
      const slot = freeSlot(state.grill);
      if (slot === -1) {
        setToast('The grill is full — take a patty off first.');
        return EVENT_ERROR;
      }
      state.grill[slot] = { item: 'patty', t: 0, done: false, burnt: false };
      return EVENT_ADD;
    }
    if (def.station === 'fryer') {
      const slot = freeSlot(state.fryer);
      if (slot === -1) {
        setToast('The fryer is full — take the fries out first.');
        return EVENT_ERROR;
      }
      state.fryer[slot] = { item: 'fries', t: 0, done: false, burnt: false };
      return EVENT_ADD;
    }
    return addToPlate(ingredientId);
  }

  /** Take a finished item off a station onto the tray; a burnt one goes in the bin. */
  function clickStationSlot(slots, index, cookedId) {
    const slot = slots[index];
    if (slot === null || slot.item === null) return 0;
    if (slot.burnt) {
      slots[index] = { item: null, t: 0, done: false, burnt: false };
      setToast('Burnt! Tossed in the bin — watch the timer.');
      return EVENT_ADD;
    }
    if (!slot.done) {
      setToast('Still cooking — wait for the ring to turn green.');
      return EVENT_ERROR;
    }
    const tray = freeTray();
    if (tray === -1) {
      setToast('The tray is full — use something on it first.');
      return EVENT_ERROR;
    }
    state.tray[tray] = cookedId;
    slots[index] = { item: null, t: 0, done: false, burnt: false };
    return EVENT_ADD;
  }

  function serveSelected() {
    const order = selected();
    if (order === null) {
      setToast('No order to serve yet.');
      return EVENT_ERROR;
    }
    if (!plateComplete(order)) {
      setToast(`The ${order.dish.name} is not finished yet.`);
      return EVENT_ERROR;
    }
    const patienceFrac = Math.max(0, order.patience / order.patienceMax);
    const tip = Math.round(order.dish.price * 0.5 * patienceFrac);
    state.combo += 1;
    if (state.combo > state.bestCombo) state.bestCombo = state.combo;
    const multiplier = 1 + 0.1 * Math.min(state.combo - 1, 4);
    const earned = Math.round((order.dish.price + tip) * multiplier);
    state.coins += earned;
    state.served += 1;
    setToast(`Served! +$${earned}${state.combo > 1 ? ` (combo x${state.combo})` : ''}`);
    state.orders.splice(state.selectedOrder, 1);
    if (state.selectedOrder >= state.orders.length) state.selectedOrder = Math.max(0, state.orders.length - 1);
    return EVENT_SERVE;
  }

  function endShift(reason) {
    if (state.over) return;
    state.over = true;
    state.overReason = reason;
    state.sizzle = 0;
  }

  /** Route one click (field coordinates) to the game. Returns an event flag. */
  function click(x, y) {
    if (inside(LAYOUT.muteBtn, x, y)) return 0; // handled by the shell (sound toggle)
    for (let i = 0; i < state.orders.length; i += 1) {
      if (inside(LAYOUT.orderTicket(i), x, y)) {
        state.selectedOrder = i;
        return EVENT_ADD;
      }
    }
    for (let i = 0; i < state.grill.length; i += 1) {
      if (inside(LAYOUT.grillSlot(i), x, y)) return clickStationSlot(state.grill, i, COOKED.patty);
    }
    for (let i = 0; i < state.fryer.length; i += 1) {
      if (inside(LAYOUT.fryerSlot(i), x, y)) return clickStationSlot(state.fryer, i, COOKED.fries);
    }
    for (let i = 0; i < state.tray.length; i += 1) {
      if (inside(LAYOUT.traySlot(i), x, y)) {
        const item = state.tray[i];
        if (item === null) return 0;
        const event = addToPlate(item);
        if (event === EVENT_ADD) state.tray[i] = null;
        return event;
      }
    }
    if (inside(LAYOUT.serveBtn, x, y)) return serveSelected();
    if (inside(LAYOUT.clearBtn, x, y)) {
      const order = selected();
      if (order !== null && order.plate.length > 0) {
        order.plate.length = 0;
        setToast('Plate cleared.');
        return EVENT_ADD;
      }
      return 0;
    }
    for (let i = 0; i < INGREDIENTS.length; i += 1) {
      if (inside(LAYOUT.bin(i), x, y)) return clickBin(INGREDIENTS[i].id);
    }
    return 0;
  }

  /** Advance the simulation one fixed step. `actions` are one-shot key flags. */
  function step(dt, actions = 0) {
    let events = 0;
    if (state.over) return events;
    state.elapsed += dt;
    if (state.toastT > 0) {
      state.toastT -= dt;
      if (state.toastT <= 0) state.toast = '';
    }

    // New orders arrive on a quickening schedule while the board has room.
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0 && state.orders.length < MAX_ORDERS) {
      spawnOrder();
      state.spawnTimer = ORDERS.intervalStart + (ORDERS.intervalEnd - ORDERS.intervalStart) * progress();
    }

    // Patience runs out: the order walks out and a heart is lost.
    for (let i = state.orders.length - 1; i >= 0; i -= 1) {
      const order = state.orders[i];
      order.patience -= dt;
      if (order.patience <= 0) {
        state.orders.splice(i, 1);
        if (state.selectedOrder >= state.orders.length) state.selectedOrder = Math.max(0, state.orders.length - 1);
        state.hearts -= 1;
        state.mistakes += 1;
        state.combo = 0;
        setToast(`A customer left! A ${order.dish.name} went unserved.`);
        events |= EVENT_EXPIRE;
        if (state.hearts <= 0) {
          endShift('closed');
          return events | EVENT_OVER;
        }
      }
    }

    // Cooking: rings fill, then green, then burnt.
    let cooking = 0;
    for (const slots of [state.grill, state.fryer]) {
      for (const slot of slots) {
        if (slot.item === null) continue;
        const spec = COOK[slot.item];
        slot.t += dt;
        if (!slot.done && slot.t + 1e-6 >= spec.cook) {
          slot.done = true;
          events |= EVENT_COOK_DONE;
        }
        if (!slot.burnt && slot.t + 1e-6 >= spec.burnAt) {
          slot.burnt = true;
          events |= EVENT_BURN;
          setToast('Something burnt! Click it to toss it.');
        }
        if (!slot.burnt) cooking += 1;
      }
    }
    state.sizzle = cooking > 0 ? Math.min(1, cooking / 2) : 0;

    // The shift clock: a tick each second, then results.
    const wholeBefore = Math.floor(state.elapsed - dt);
    const wholeAfter = Math.floor(state.elapsed);
    if (wholeAfter !== wholeBefore) events |= EVENT_TICK;
    if (state.elapsed >= SHIFT_SECONDS) {
      endShift('shift');
      return events | EVENT_OVER;
    }

    if (actions !== 0) {
      if (actions & 4) events |= serveSelected();
      if (actions & 8) {
        const order = selected();
        if (order !== null && order.plate.length > 0) {
          order.plate.length = 0;
          setToast('Plate cleared.');
          events |= EVENT_ADD;
        }
      }
      if (actions & 64 && state.orders.length > 0) {
        state.selectedOrder = (state.selectedOrder + 1) % state.orders.length;
        events |= EVENT_ADD;
      }
    }
    return events;
  }

  return {
    state,
    reset,
    step,
    click,
    clickBin,
    serveSelected,
    selected,
    plateComplete,
    plateNeeds,
    spawnOrder,
    setToast,
    DISHES,
  };
}
