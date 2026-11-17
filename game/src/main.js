// Boot and the one loop: input is read every frame, the world advances in
// fixed 1/60 s steps (several in a slow frame, none in a fast one), and the
// renderer paints what is there. The game moves between seven screens:
// title, play, paused, shop, day-clear, win and game over.
//
// ?seed=N fixes the customer pattern. ?shot=title|play|shop|over (with
// &seed=N) stages that scene instead of running the loop, paints it twice
// and sets window.__shotReady for a screenshot.

import { BEST_KEY, DISHES, STEP, TOTAL_DAYS } from './config.js';
import { createRandom } from './random.js';
import { createAudio } from './audio.js';
import {
  ACTION_CONFIRM,
  ACTION_LEFT,
  ACTION_MUTE,
  ACTION_PAUSE,
  ACTION_RESTART,
  ACTION_RIGHT,
  createInput,
  pointInRect,
} from './input.js';
import { advanceToNextDay, cookDish, createWorld, resetRun, serveCustomer, stepWorld } from './world.js';
import { buyUpgrade } from './shop.js';
import {
  SCREEN_DAYCLEAR,
  SCREEN_OVER,
  SCREEN_PAUSED,
  SCREEN_PLAY,
  SCREEN_SHOP,
  SCREEN_TITLE,
  SCREEN_WIN,
  createRenderer,
  layout,
} from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall is dropped. */
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
    renderer.draw(world, scene.screen, { selectedSlot: null, selectedDish: null, best: 0, muted: false });
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
  let selectedSlot = null;
  let selectedDish = null;
  let accumulator = 0;
  let last = performance.now();

  // Screen readers (and anyone watching the page's text) hear screen changes.
  function announce(message) {
    status.textContent = message;
  }

  function startRun() {
    resetRun(world);
    selectedSlot = null;
    selectedDish = null;
    accumulator = 0;
    screen = SCREEN_PLAY;
    audio.unlock();
    audio.startMusic();
    announce(`Day 1. Earn $${world.target} before the clock runs out.`);
  }

  function finishRun() {
    if (world.score > best) {
      best = world.score;
      saveBest(best);
    }
  }

  function playEvents(events) {
    for (const event of events) {
      if (event === 'dish-ready') audio.ding();
      else if (event === 'walkout') audio.walkout();
      else if (event === 'day-clear') audio.dayClear();
      else if (event === 'game-over') audio.gameOver();
      else if (event === 'win') audio.dayClear();
    }
  }

  function syncScreenWithWorld() {
    if (screen !== SCREEN_PLAY) return;
    if (world.phase === 'dayclear') {
      screen = SCREEN_DAYCLEAR;
      announce(`Day ${world.day} complete!`);
    } else if (world.phase === 'win') {
      finishRun();
      screen = SCREEN_WIN;
      announce(`You won! Final score ${world.score}.`);
    } else if (world.phase === 'over') {
      finishRun();
      screen = SCREEN_OVER;
      announce(`Game over. Score ${world.score}.`);
    }
  }

  function tryCook(dishId) {
    if (cookDish(world, dishId)) {
      audio.sizzle();
      return true;
    }
    return false;
  }

  function tryServe(slot, dishId) {
    const paid = serveCustomer(world, slot, dishId);
    if (paid > 0) {
      audio.coin(paid >= 12);
      selectedDish = null;
      return true;
    }
    return false;
  }

  function handleClicks() {
    const rects = layout(screen, world);
    for (const click of input.takeClicks()) {
      audio.unlock();
      if (pointInRect(click, rects.muteButton)) {
        const muted = audio.toggleMute();
        announce(muted ? 'Muted.' : 'Sound on.');
        continue;
      }
      if (screen === SCREEN_TITLE) {
        if (pointInRect(click, rects.startButton)) {
          audio.click();
          startRun();
        }
        continue;
      }
      if (screen === SCREEN_PAUSED) {
        screen = SCREEN_PLAY;
        announce('Playing.');
        continue;
      }
      if (screen === SCREEN_DAYCLEAR) {
        if (pointInRect(click, rects.continueButton)) {
          audio.click();
          screen = SCREEN_SHOP;
          announce('Upgrade shop.');
        }
        continue;
      }
      if (screen === SCREEN_SHOP) {
        let bought = false;
        rects.shopCards.forEach((card, i) => {
          if (pointInRect(click, card)) bought = buyUpgrade(world, ['stove', 'tray', 'seats', 'heart'][i]);
        });
        if (bought) {
          audio.coin(true);
          announce('Upgrade bought.');
        } else if (pointInRect(click, rects.nextDayButton)) {
          audio.click();
          advanceToNextDay(world);
          screen = SCREEN_PLAY;
          announce(`Day ${world.day}. Earn $${world.target}.`);
        }
        continue;
      }
      if (screen === SCREEN_WIN || screen === SCREEN_OVER) {
        if (pointInRect(click, rects.restartButton)) {
          audio.click();
          startRun();
        }
        continue;
      }
      // SCREEN_PLAY.
      if (pointInRect(click, rects.pauseButton)) {
        screen = SCREEN_PAUSED;
        announce('Paused.');
        continue;
      }
      let handled = false;
      rects.dishButtons.forEach((button, i) => {
        if (pointInRect(click, button)) {
          tryCook(DISHES[i].id);
          handled = true;
        }
      });
      if (handled) continue;
      rects.traySlots.forEach((slotRect, i) => {
        if (!pointInRect(click, slotRect)) return;
        const dishId = world.kitchen.tray[i];
        if (dishId) {
          selectedDish = selectedDish === dishId ? null : dishId;
          audio.click();
        }
        handled = true;
      });
      if (handled) continue;
      rects.customerSlots.forEach((slotRect, i) => {
        if (!pointInRect(click, slotRect)) return;
        const customer = world.customers.find((entry) => entry.slot === i);
        selectedSlot = i;
        if (customer) tryServe(i, selectedDish);
        handled = true;
      });
    }
  }

  function handleKeys() {
    for (const key of input.takeKeys()) {
      if (screen !== SCREEN_PLAY) continue;
      const dish = DISHES.find((entry) => entry.key === key);
      if (dish) {
        audio.unlock();
        tryCook(dish.id);
      }
    }
    const actions = input.takeActions();
    if (actions & ACTION_MUTE) {
      const muted = audio.toggleMute();
      announce(muted ? 'Muted.' : 'Sound on.');
    }
    if (actions & ACTION_PAUSE) {
      if (screen === SCREEN_PLAY) {
        screen = SCREEN_PAUSED;
        announce('Paused.');
      } else if (screen === SCREEN_PAUSED) {
        screen = SCREEN_PLAY;
        announce('Playing.');
      }
    }
    if (actions & ACTION_LEFT && screen === SCREEN_PLAY) {
      selectedSlot = selectedSlot === null ? 0 : (selectedSlot + 3) % 4;
      audio.click();
    }
    if (actions & ACTION_RIGHT && screen === SCREEN_PLAY) {
      selectedSlot = selectedSlot === null ? 0 : (selectedSlot + 1) % 4;
      audio.click();
    }
    if (actions & ACTION_CONFIRM) {
      audio.unlock();
      if (screen === SCREEN_TITLE) startRun();
      else if (screen === SCREEN_DAYCLEAR) {
        screen = SCREEN_SHOP;
        announce('Upgrade shop.');
      } else if (screen === SCREEN_SHOP) {
        advanceToNextDay(world);
        screen = SCREEN_PLAY;
        announce(`Day ${world.day}. Earn $${world.target}.`);
      } else if (screen === SCREEN_WIN || screen === SCREEN_OVER) startRun();
      else if (screen === SCREEN_PLAY && selectedSlot !== null) tryServe(selectedSlot, selectedDish);
    }
    if (actions & ACTION_RESTART && (screen === SCREEN_WIN || screen === SCREEN_OVER)) startRun();
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleClicks();
    handleKeys();
    if (screen === SCREEN_TITLE || screen === SCREEN_PLAY) {
      while (accumulator >= STEP && (screen === SCREEN_TITLE || screen === SCREEN_PLAY)) {
        const events = stepWorld(world, STEP);
        playEvents(events);
        syncScreenWithWorld();
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(world, screen, {
      selectedSlot,
      selectedDish,
      best,
      muted: audio.muted,
    });
  }

  // Leaving the tab pauses a running game rather than letting patience drain unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('Sizzle and Serve. Press Space or click Start to play.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
