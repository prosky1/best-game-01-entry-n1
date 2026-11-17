# Sizzle & Serve

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/prosky1/best-game-01-entry-n1/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/prosky1/best-game-01-entry-n1/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

A tiny kitchen-rush game built for the [make.fun](https://make.fun) **best-game-01** bounty.
Run a busy food stall against the clock: cook dishes, serve customers before
their patience runs out, earn coins, buy upgrades between days, and survive
five days of dinner rush to earn your restaurant star.

## How to play

- **Cook:** click a dish button (or press **1–6**) to start cooking it. Each
  dish takes a few seconds; when it is ready it lands on the serving counter.
- **Serve:** click a customer to hand them a dish from the counter that matches
  their order — or click a dish on the counter first, then the customer who
  wants it. Faster service earns a bigger tip.
- **Survive the day:** each customer has a patience bar. Serve them before it
  empties or they storm off and you lose a heart. Lose all 3 hearts and the
  stall closes. Hit the day's coin target before the timer runs out to clear
  the day.
- **Upgrade:** between days, spend coins in the shop — faster stoves, a bigger
  counter, comfier seats (more patience), and more.
- **Win:** clear Day 5 and the stall earns its star.

Controls: mouse + keyboard. **1–6** cook, **←/→** pick a customer,
**Enter/Space** serve them, **P** pause, **M** mute, **R** restart on the
end screens.

## Play it

No build step — the game is plain static files under `game/`, playable
offline in desktop Chrome:

```sh
node serve.ts
# open http://localhost:8080
```

## Layout

- `game/` — the game itself (`index.html`, `style.css`, `src/*.js`), vanilla
  JavaScript + Canvas 2D, no libraries. Sounds are synthesized with WebAudio
  in code; there are no audio files and no network requests.
- `screenshots/` — 3–4 real renders of the game running in a browser.
- `main.ts` — the entry program: copies `game/` and `screenshots/` to
  `/output` and writes `dossier.json` with the kit's `buildDossier`.
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged.
- `shots.json` — the `?shot=` scenes each screenshot was staged from.

## License

MIT — see [LICENSE](LICENSE).
