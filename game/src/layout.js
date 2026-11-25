// One shared layout: every clickable rectangle lives here, so the world (hit
// testing), the renderer (drawing) and the screenshot autopilot all agree on
// where things are. All coordinates are in the fixed 1280x720 field.
export const LAYOUT = {
  topbar: { x: 0, y: 0, w: 1280, h: 56 },
  muteBtn: { x: 1216, y: 10, w: 52, h: 36 },
  board: { x: 24, y: 66, w: 1232, h: 138 },
  orderTicket: (i) => ({ x: 40 + i * 408, y: 78, w: 384, h: 114 }),
  grill: { x: 24, y: 222, w: 440, h: 216 },
  grillSlot: (i) => ({ x: 56 + i * 196, y: 292, w: 164, h: 116 }),
  fryer: { x: 488, y: 222, w: 300, h: 216 },
  fryerSlot: (i) => ({ x: 516 + i * 132, y: 292, w: 116, h: 116 }),
  tray: { x: 812, y: 222, w: 200, h: 216 },
  traySlot: (i) => ({ x: 828, y: 246 + i * 46, w: 168, h: 40 }),
  servePanel: { x: 1036, y: 222, w: 220, h: 216 },
  serveBtn: { x: 1056, y: 268, w: 180, h: 72 },
  clearBtn: { x: 1056, y: 352, w: 180, h: 40 },
  counter: { x: 24, y: 452, w: 1232, h: 128 },
  bin: (i) => ({ x: 40 + i * 204, y: 464, w: 188, h: 104 }),
  plateArea: { x: 24, y: 592, w: 1232, h: 116 },
  plate: { x: 520, y: 600, w: 240, h: 100 },
};

export function inside(rect, x, y) {
  return x >= rect.x && x < rect.x + rect.w && y >= rect.y && y < rect.y + rect.h;
}
