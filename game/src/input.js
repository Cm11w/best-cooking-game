// Mouse and keyboard input, read once per frame. Clicks are queued with their
// canvas coordinates (the renderer maps the window onto the fixed 1280x720 field),
// and one-shot actions (confirm, pause, serve...) are taken, not polled.
export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_SERVE = 4;
export const ACTION_CLEAR = 8;
export const ACTION_MUTE = 16;
export const ACTION_RESTART = 32;
export const ACTION_CYCLE_ORDER = 64;

const KEY_ACTIONS = {
  Space: ACTION_CONFIRM,
  Enter: ACTION_CONFIRM,
  KeyP: ACTION_PAUSE,
  Escape: ACTION_PAUSE,
  KeyS: ACTION_SERVE,
  KeyC: ACTION_CLEAR,
  KeyM: ACTION_MUTE,
  KeyR: ACTION_RESTART,
  Tab: ACTION_CYCLE_ORDER,
};

export function createInput(canvas) {
  const clicks = [];
  const keys = new Set();
  let actions = 0;

  function toField(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = 1280 / rect.width;
    const scaleY = 720 / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }

  canvas.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    clicks.push(toField(event));
  });

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const action = KEY_ACTIONS[event.code];
    if (action !== undefined) {
      event.preventDefault();
      actions |= action;
    }
    keys.add(event.code);
  });
  window.addEventListener('keyup', (event) => {
    keys.delete(event.code);
  });
  window.addEventListener('blur', () => {
    keys.clear();
  });

  return {
    /** All clicks since the last call, in field coordinates. */
    takeClicks() {
      return clicks.splice(0, clicks.length);
    },
    /** One-shot actions pressed since the last call. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
    /** Is a Digit1..Digit6 key held (ingredient shortcut)? */
    digitPressed(digit) {
      return keys.has(`Digit${digit}`);
    },
  };
}
