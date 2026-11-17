// Input: mouse clicks and key presses, queued per frame so the loop reads
// them once and only once. Click coordinates arrive in logical canvas units
// (the renderer scales the canvas to the window, so a click is divided by
// that same scale before it is queued).

import { VIEW } from './config.js';

/** Action bits the loop reads from takeActions(). */
export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_MUTE = 4;
export const ACTION_RESTART = 8;
export const ACTION_LEFT = 16;
export const ACTION_RIGHT = 32;

const KEY_ACTIONS = {
  Enter: ACTION_CONFIRM,
  ' ': ACTION_CONFIRM,
  p: ACTION_PAUSE,
  P: ACTION_PAUSE,
  Escape: ACTION_PAUSE,
  m: ACTION_MUTE,
  M: ACTION_MUTE,
  r: ACTION_RESTART,
  R: ACTION_RESTART,
  ArrowLeft: ACTION_LEFT,
  ArrowRight: ACTION_RIGHT,
};

/** Listen on the canvas (clicks) and the window (keys). */
export function createInput(canvas) {
  const clicks = [];
  const keys = [];
  let actions = 0;
  let hover = { x: -1, y: -1 };

  function toLogical(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * VIEW.width,
      y: ((event.clientY - rect.top) / rect.height) * VIEW.height,
    };
  }

  canvas.addEventListener('click', (event) => {
    clicks.push(toLogical(event));
  });
  canvas.addEventListener('mousemove', (event) => {
    hover = toLogical(event);
  });
  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const action = KEY_ACTIONS[event.key];
    if (action !== undefined) {
      actions |= action;
      event.preventDefault();
    }
    keys.push(event.key);
  });

  return {
    /** Clicks since the last call, in logical canvas units. */
    takeClicks() {
      return clicks.splice(0, clicks.length);
    },
    /** Raw keys pressed since the last call (for the 1-6 cook shortcuts). */
    takeKeys() {
      return keys.splice(0, keys.length);
    },
    /** Action bits pressed since the last call. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
    /** Current mouse position in logical canvas units. */
    get hover() {
      return hover;
    },
  };
}

/** True when a point in logical units falls inside a rectangle. */
export function pointInRect(point, rect) {
  return point.x >= rect.x && point.x < rect.x + rect.width && point.y >= rect.y && point.y < rect.y + rect.height;
}
