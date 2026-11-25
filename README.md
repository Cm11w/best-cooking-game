# Sizzle & Serve — Rush Hour Kitchen

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/Cm11w/best-cooking-game/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/Cm11w/best-cooking-game/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)

An original fast-paced cooking game for the [Make the best cooking game bounty](https://make.fun/bounty/best-cooking-game-20261125-0137) — run a tiny kitchen through the lunch rush. Orders land on the board with a patience timer; grill the patties, fry the fries, build each dish on the plate exactly to its recipe, and ring the bell before the customer walks out. Three walk-outs and the kitchen closes.

Everything is original: the dishes, names, art and sounds. No library, no build step, no network requests — plain HTML and ES modules, all art drawn on canvas, all sound synthesised with WebAudio.

## How to play

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome (any static file server works — serve the `game/` folder).

| Control | Action |
|---|---|
| Click a ticket | Pick which order to build |
| Click a bin / press 1–6 | Take an ingredient (patty → grill, fries → fryer, the rest → plate) |
| Click a grill / fryer slot | Take a cooked item to the tray (or toss it if burnt) |
| Click a tray item | Add it to the selected order's plate |
| Click SERVE / S | Serve a finished plate |
| C | Clear the plate |
| Tab | Cycle orders |
| P / Esc | Pause / resume |
| M | Sound on / off |
| R / Enter | Restart from the results screen |

## The rush

- **5 dishes** on the menu, from the Fresh Salad to the Double Trouble; harder dishes unlock as the shift goes on.
- **Patience timers** on every ticket — serve fast for a tip, let one run out and you lose a heart.
- **Combos** multiply your earnings when you serve dish after dish without a mistake.
- **Burnt food** is wasted time: a patty left on the grill too long has to be tossed.
- A full shift lasts **150 seconds**; your coins, dishes served and best combo are scored at the end, with a chef title to earn.

## Files

- `main.ts` — the entry program: copies `game/` and `screenshots/` to the output and writes `dossier.json`.
- `game/` — the playable game as static files (`index.html` + `src/` ES modules).
- `game/src/config.js` — tuning, recipes, palette; `world.js` — orders, cooking, scoring; `render.js` — all canvas art; `shots.js` — the staged screenshot scenes; `audio.js` — synthesised sound; `input.js` — mouse + keyboard; `layout.js` — the one shared layout both world and renderer use.
- `screenshots/` — 4 real renders of the game's own code: title, mid-rush play, a plate ready to serve, and the results screen.
- `vendor/makefun-game.ts` — make.fun's dossier library, copied byte for byte from the kit.
