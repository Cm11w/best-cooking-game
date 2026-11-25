// Boot and the one loop: input is read every frame, the world advances in fixed
// 1/60 s steps (several in a slow frame, none in a fast one), and the renderer
// paints what is there. The game moves between four screens: title, play,
// paused and game over.
//
// ?seed=N fixes the order pattern. ?shot=start|play|serve|end (with &seed=N)
// stages that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.
import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { createAudio } from './audio.js';
import { createWorld, EVENT_BURN, EVENT_COOK_DONE, EVENT_ERROR, EVENT_EXPIRE, EVENT_OVER, EVENT_SERVE } from './world.js';
import {
  ACTION_CLEAR,
  ACTION_CONFIRM,
  ACTION_CYCLE_ORDER,
  ACTION_MUTE,
  ACTION_PAUSE,
  ACTION_RESTART,
  ACTION_SERVE,
  createInput,
} from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';
import { INGREDIENTS } from './config.js';
import { LAYOUT } from './layout.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped, not replayed. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const audio = createAudio();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best, 1.2, false);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  // Screen readers (and anyone watching the page's text) hear the screen changes.
  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    announce('Playing. The lunch rush is on — serve every order before its timer runs out.');
  }

  function endGame() {
    screen = SCREEN_OVER;
    if (world.state.coins > best) {
      best = world.state.coins;
      saveBest(best);
    }
    audio.setSizzle(0);
    announce(`Shift over. ${world.state.served} dishes served, $${world.state.coins} earned. Best $${best}.`);
  }

  function react(events) {
    if (events & EVENT_SERVE) audio.coin();
    if (events & EVENT_COOK_DONE) audio.ding();
    if (events & EVENT_ERROR) audio.error();
    if (events & EVENT_BURN) audio.burn();
    if (events & EVENT_EXPIRE) audio.error();
    if (events & EVENT_OVER) endGame();
    audio.setSizzle(world.state.sizzle);
  }

  function routeClicks() {
    for (const click of input.takeClicks()) {
      audio.unlock();
      const inMute = click.x >= LAYOUT.muteBtn.x && click.x < LAYOUT.muteBtn.x + LAYOUT.muteBtn.w
        && click.y >= LAYOUT.muteBtn.y && click.y < LAYOUT.muteBtn.y + LAYOUT.muteBtn.h;
      if (inMute) {
        const muted = audio.toggleMute();
        announce(muted ? 'Sound off.' : 'Sound on.');
        continue;
      }
      if (screen === SCREEN_TITLE || screen === SCREEN_OVER) {
        startGame();
        continue;
      }
      if (screen === SCREEN_PAUSED) {
        screen = SCREEN_PLAY;
        announce('Playing.');
        continue;
      }
      const events = world.click(click.x, click.y);
      if (events !== 0 && !(events & EVENT_ERROR)) audio.add();
      react(events);
    }
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_MUTE) {
      const muted = audio.toggleMute();
      announce(muted ? 'Sound off.' : 'Sound on.');
    }
    if (actions & ACTION_CONFIRM && (screen === SCREEN_TITLE || screen === SCREEN_OVER)) startGame();
    else if (actions & ACTION_RESTART && (screen === SCREEN_OVER || screen === SCREEN_PLAY)) startGame();
    else if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      audio.setSizzle(0);
      announce('Paused.');
    } else if (actions & (ACTION_PAUSE | ACTION_CONFIRM) && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Playing.');
    } else if (screen === SCREEN_PLAY) {
      // Number keys 1-6 are the ingredient bins; S serves, C clears, Tab cycles orders.
      for (let i = 0; i < INGREDIENTS.length; i += 1) {
        if (input.digitPressed(String(i + 1))) {
          audio.unlock();
          const events = world.clickBin(INGREDIENTS[i].id);
          if (events !== 0 && !(events & EVENT_ERROR)) audio.add();
          react(events);
          break;
        }
      }
      let worldActions = 0;
      if (actions & ACTION_SERVE) worldActions |= 4;
      if (actions & ACTION_CLEAR) worldActions |= 8;
      if (actions & ACTION_CYCLE_ORDER) worldActions |= 64;
      if (worldActions !== 0) {
        const events = world.step(0, worldActions);
        if (events & EVENT_SERVE) audio.coin();
        if (events & EVENT_ERROR) audio.error();
      }
    }
  }

  function step() {
    if (screen === SCREEN_TITLE) {
      // The title shows a frozen kitchen: the shift clock must not run while
      // the player is still reading the instructions.
      return;
    }
    const events = world.step(STEP, 0);
    react(events);
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    routeClicks();
    handleActions();
    if (screen === SCREEN_TITLE || screen === SCREEN_PLAY) {
      while (accumulator >= STEP && (screen === SCREEN_TITLE || screen === SCREEN_PLAY)) {
        step();
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(world.state, screen, best, now / 1000, audio.muted);
  }

  // Leaving the tab pauses a running game rather than letting orders expire unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      audio.setSizzle(0);
      announce('Paused.');
    }
  });

  announce('Sizzle and Serve. Press Space or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
