// Every tuning number, colour and recipe in one place. The playfield is a fixed
// 1280x720 logical area; the renderer scales it to the window, so no rule below
// depends on the screen size.
export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** A full shift lasts this long; when the clock runs out the results screen shows. */
export const SHIFT_SECONDS = 150;
export const HEARTS = 3;

/** Cook times: patty on the grill, fries in the fryer; burnAt is seconds after done. */
export const COOK = {
  patty: { cook: 4, burnAt: 9 },
  fries: { cook: 5, burnAt: 10 },
};

export const GRILL_SLOTS = 2;
export const FRYER_SLOTS = 2;
export const TRAY_SLOTS = 4;
export const MAX_ORDERS = 3;

/** Orders arrive faster and get less patient as the shift goes on. */
export const ORDERS = {
  firstAt: 1.5,
  intervalStart: 9,
  intervalEnd: 5,
  patienceStart: 34,
  patienceEnd: 24,
};

/** Ingredient catalogue: id, label, colour, key, and where it is prepared. */
export const INGREDIENTS = [
  { id: 'bun', label: 'Bun', key: '1', station: 'counter', color: '#e8a94e' },
  { id: 'patty', label: 'Patty', key: '2', station: 'grill', color: '#8a5a33' },
  { id: 'cheese', label: 'Cheese', key: '3', station: 'counter', color: '#ffc93c' },
  { id: 'lettuce', label: 'Lettuce', key: '4', station: 'counter', color: '#5fbf4a' },
  { id: 'tomato', label: 'Tomato', key: '5', station: 'counter', color: '#e8443a' },
  { id: 'fries', label: 'Fries', key: '6', station: 'fryer', color: '#f2b705' },
];

/** Cooked forms: what a raw item becomes on its station. */
export const COOKED = { patty: 'patty-cooked', fries: 'fries-cooked' };

/** The menu: every dish is a multiset of ingredient ids, in serving order. */
export const DISHES = [
  {
    id: 'classic',
    name: 'Classic Burger',
    price: 8,
    recipe: ['bun', 'patty-cooked', 'cheese', 'lettuce'],
  },
  {
    id: 'garden',
    name: 'Garden Stack',
    price: 9,
    recipe: ['bun', 'patty-cooked', 'tomato', 'cheese'],
  },
  {
    id: 'salad',
    name: 'Fresh Salad',
    price: 6,
    recipe: ['lettuce', 'tomato', 'cheese'],
  },
  {
    id: 'double',
    name: 'Double Trouble',
    price: 12,
    recipe: ['bun', 'patty-cooked', 'patty-cooked', 'cheese', 'lettuce'],
  },
  {
    id: 'combo',
    name: 'Crispy Combo',
    price: 11,
    recipe: ['bun', 'patty-cooked', 'fries-cooked', 'cheese'],
  },
];

/** Early shift: only the easy dishes; the full menu unlocks as the rush builds. */
export function menuFor(elapsed) {
  if (elapsed < 40) return DISHES.slice(0, 3);
  if (elapsed < 90) return DISHES.slice(0, 4);
  return DISHES;
}

export const PALETTE = {
  wall: '#f6e3bd',
  wallDark: '#eed3a0',
  floor: '#c98f5f',
  floorDark: '#b57e50',
  wood: '#8b5a2b',
  woodDark: '#6f4520',
  board: '#3d2b1f',
  boardPaper: '#fff6dd',
  topbar: '#a83226',
  topbarDark: '#7e241b',
  counter: '#d9c1a3',
  steel: '#b9c0c7',
  steelDark: '#8d949c',
  grill: '#3a3f46',
  plate: '#ffffff',
  text: '#2b1d12',
  textLight: '#fff6dd',
  muted: '#8b7a68',
  gold: '#ffc93c',
  green: '#4caf50',
  red: '#e8443a',
  heart: '#e8443a',
  flame: '#ff7b24',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'sizzle-and-serve.best';
