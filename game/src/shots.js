// The screenshot scenes behind ?shot=start|play|serve|end. Each one plays the
// real rules forward from a fresh world for a fixed number of steps, driven by
// the same clicks a player makes (bins, stations, tray, serve), so the frame is
// what a short game really looks like and the same seed always gives the same
// frame. The play scene keeps its orders alive; the serve scene finishes a
// plate; the end scene lets the shift run out.
import { FIELD, STEP } from './config.js';
import { LAYOUT } from './layout.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

function centre(rect) {
  return { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 };
}

function clickAt(world, rect) {
  const p = centre(rect);
  world.click(p.x, p.y);
}

/** Grill a patty and fry fries, then take both to the tray. */
function cookPair(world) {
  clickAt(world, LAYOUT.bin(1)); // patty -> grill
  clickAt(world, LAYOUT.bin(5)); // fries -> fryer
}

function stepFor(world, seconds) {
  const steps = Math.round(seconds / STEP);
  for (let i = 0; i < steps; i += 1) world.step(STEP, 0);
}

function collectCooked(world) {
  for (let i = 0; i < 2; i += 1) clickAt(world, LAYOUT.grillSlot(i));
  for (let i = 0; i < 2; i += 1) clickAt(world, LAYOUT.fryerSlot(i));
}

/**
 * Set `world` to the named scene (start, play, serve or end; any other name is
 * start) and return the screen to draw over it and the best score to show.
 */
export function stageShot(name, world) {
  world.reset();
  if (name !== 'play' && name !== 'serve' && name !== 'end') {
    // Title over a kitchen that already has orders and a patty on the grill.
    world.spawnOrder();
    world.spawnOrder();
    cookPair(world);
    stepFor(world, 3);
    return { screen: SCREEN_TITLE, best: 0 };
  }

  // Every play scene: two orders on the board, a patty grilling, fries frying.
  world.spawnOrder();
  world.spawnOrder();
  cookPair(world);
  stepFor(world, 5);
  collectCooked(world);

  if (name === 'play') {
    // Mid-assembly: the selected order's plate is half built, one more order
    // waiting, and a fresh patty sizzling on the grill.
    const order = world.selected();
    if (order !== null) {
      for (const item of order.dish.recipe) {
        if (item === 'patty-cooked' || item === 'fries-cooked') continue;
        clickAt(world, LAYOUT.bin(ING_INDEX[item]));
      }
    }
    clickAt(world, LAYOUT.bin(1)); // another patty on the grill
    stepFor(world, 2);
    return { screen: SCREEN_PLAY, best: world.state.coins };
  }

  if (name === 'serve') {
    // A finished plate, glowing SERVE button, and a second order waiting.
    const order = world.selected();
    if (order !== null) {
      for (const item of order.dish.recipe) {
        if (item === 'patty-cooked') {
          const tray = world.state.tray.indexOf('patty-cooked');
          if (tray !== -1) clickAt(world, LAYOUT.traySlot(tray));
          continue;
        }
        if (item === 'fries-cooked') {
          const tray = world.state.tray.indexOf('fries-cooked');
          if (tray !== -1) clickAt(world, LAYOUT.traySlot(tray));
          continue;
        }
        clickAt(world, LAYOUT.bin(ING_INDEX[item]));
      }
    }
    stepFor(world, 0.5);
    return { screen: SCREEN_PLAY, best: world.state.coins };
  }

  // End: play a short shift to a real result — serve one dish, then let the
  // clock run out with orders expiring, so the results screen has numbers.
  const order = world.selected();
  if (order !== null) {
    for (const item of order.dish.recipe) {
      if (item === 'patty-cooked') {
        const tray = world.state.tray.indexOf('patty-cooked');
        if (tray !== -1) clickAt(world, LAYOUT.traySlot(tray));
        continue;
      }
      if (item === 'fries-cooked') {
        const tray = world.state.tray.indexOf('fries-cooked');
        if (tray !== -1) clickAt(world, LAYOUT.traySlot(tray));
        continue;
      }
      clickAt(world, LAYOUT.bin(ING_INDEX[item]));
    }
    clickAt(world, LAYOUT.serveBtn);
  }
  stepFor(world, 155);
  return { screen: SCREEN_OVER, best: world.state.coins };
}

/** Bin index per ingredient id, for the autopilot's clicks. */
const ING_INDEX = { bun: 0, patty: 1, cheese: 2, lettuce: 3, tomato: 4, fries: 5 };
