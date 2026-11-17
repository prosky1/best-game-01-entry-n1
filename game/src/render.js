// The renderer: every pixel of Sizzle & Serve, drawn on one Canvas 2D
// surface — the warm kitchen, the customers and their order bubbles, the
// serving counter, the six station buttons, and the title, shop and end
// screens. All art is vector shapes drawn in code (no images, no fonts
// loaded), and layout() is the one place that decides where things sit, so
// hit-testing in main.js and drawing here can never disagree.

import { DISHES, DISH_BY_ID, TOTAL_DAYS, VIEW } from './config.js';
import { customerWants, patienceFraction } from './customers.js';
import { cookingProgress, dishWaiting, trayCapacity } from './kitchen.js';
import { UPGRADES, upgradePrice } from './shop.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_SHOP = 'shop';
export const SCREEN_DAYCLEAR = 'dayclear';
export const SCREEN_WIN = 'win';
export const SCREEN_OVER = 'over';

const WALL = '#f6e3c8';
const WALL_DARK = '#eecfa8';
const FLOOR = '#d9a066';
const COUNTER_TOP = '#a05a2c';
const COUNTER_FRONT = '#7c421d';
const PANEL = '#fff8ec';
const INK = '#3a2417';
const MUTED_INK = '#7a5c44';
const GREEN = '#2f7d4f';
const RED = '#d94f3d';
const GOLD = '#e8a13c';
const CHALK = '#2b3a32';

function font(size, weight = 'bold') {
  return `${weight} ${size}px "Trebuchet MS", Verdana, sans-serif`;
}

/** Every clickable rect, in logical canvas units, for one screen. */
export function layout(screen, world) {
  const out = {
    dishButtons: [],
    traySlots: [],
    customerSlots: [],
    pauseButton: { x: 856, y: 10, width: 44, height: 36 },
    muteButton: { x: 908, y: 10, width: 44, height: 36 },
    startButton: { x: 380, y: 440, width: 200, height: 56 },
    continueButton: { x: 355, y: 420, width: 250, height: 54 },
    nextDayButton: { x: 355, y: 480, width: 250, height: 54 },
    restartButton: { x: 355, y: 420, width: 250, height: 54 },
    shopCards: [],
  };
  const buttonWidth = 149;
  for (let i = 0; i < DISHES.length; i += 1) {
    out.dishButtons.push({ x: 12 + i * (buttonWidth + 8), y: 405, width: buttonWidth, height: 130 });
  }
  const trayCount = world ? trayCapacity(world.upgrades) : 6;
  const slotSize = 56;
  const trayWidth = trayCount * (slotSize + 8) - 8;
  for (let i = 0; i < trayCount; i += 1) {
    out.traySlots.push({
      x: (VIEW.width - trayWidth) / 2 + i * (slotSize + 8),
      y: 336,
      width: slotSize,
      height: slotSize,
    });
  }
  const slots = world ? Math.max(3, world.customers.reduce((max, c) => Math.max(max, c.slot + 1), 3)) : 4;
  for (let i = 0; i < 4; i += 1) {
    out.customerSlots.push({ x: 60 + i * 225, y: 84, width: 180, height: 204, visible: i < slots });
  }
  if (screen === SCREEN_SHOP) {
    for (let i = 0; i < UPGRADES.length; i += 1) {
      const column = i % 2;
      const row = Math.floor(i / 2);
      out.shopCards.push({ x: 130 + column * 370, y: 170 + row * 140, width: 340, height: 120 });
    }
  }
  return out;
}

function roundRectPath(ctx, rect, radius) {
  const r = Math.min(radius, rect.width / 2, rect.height / 2);
  ctx.beginPath();
  ctx.moveTo(rect.x + r, rect.y);
  ctx.arcTo(rect.x + rect.width, rect.y, rect.x + rect.width, rect.y + rect.height, r);
  ctx.arcTo(rect.x + rect.width, rect.y + rect.height, rect.x, rect.y + rect.height, r);
  ctx.arcTo(rect.x, rect.y + rect.height, rect.x, rect.y, r);
  ctx.arcTo(rect.x, rect.y, rect.x + rect.width, rect.y, r);
  ctx.closePath();
}

function fillRoundRect(ctx, rect, radius, color) {
  roundRectPath(ctx, rect, radius);
  ctx.fillStyle = color;
  ctx.fill();
}

function strokeRoundRect(ctx, rect, radius, color, width) {
  roundRectPath(ctx, rect, radius);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function centeredText(ctx, text, x, y, size, color, weight) {
  ctx.font = font(size, weight);
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

function leftText(ctx, text, x, y, size, color, weight) {
  ctx.font = font(size, weight);
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

/** Draw one dish's little vector icon, centred at (x, y), `size` wide. */
export function drawDishIcon(ctx, dishId, x, y, size) {
  const s = size / 48;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.lineWidth = 2;
  if (dishId === 'burger') {
    ctx.fillStyle = '#e0a458';
    ctx.beginPath();
    ctx.arc(0, -6, 16, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#5da85a';
    ctx.fillRect(-17, -7, 34, 5);
    ctx.fillStyle = '#7a4a21';
    ctx.fillRect(-16, -2, 32, 7);
    ctx.fillStyle = '#e0a458';
    ctx.fillRect(-15, 5, 30, 6);
    ctx.fillStyle = '#fff3d6';
    ctx.beginPath();
    ctx.arc(-6, -12, 1.8, 0, Math.PI * 2);
    ctx.arc(4, -14, 1.8, 0, Math.PI * 2);
    ctx.arc(9, -10, 1.8, 0, Math.PI * 2);
    ctx.fill();
  } else if (dishId === 'noodles') {
    ctx.strokeStyle = '#7c421d';
    ctx.beginPath();
    ctx.moveTo(-14, -16);
    ctx.lineTo(10, 6);
    ctx.moveTo(-8, -18);
    ctx.lineTo(16, 2);
    ctx.stroke();
    ctx.fillStyle = '#e8b93e';
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.arc(-10 + i * 10, 0, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#d94f3d';
    ctx.beginPath();
    ctx.arc(0, 8, 17, 0, Math.PI);
    ctx.fill();
    ctx.fillRect(-17, 6, 34, 3);
  } else if (dishId === 'fries') {
    ctx.fillStyle = '#f2c14e';
    for (let i = -2; i <= 2; i += 1) ctx.fillRect(i * 6 - 2, -18 + Math.abs(i) * 3, 5, 18);
    ctx.fillStyle = '#d94f3d';
    ctx.beginPath();
    ctx.moveTo(-16, -4);
    ctx.lineTo(16, -4);
    ctx.lineTo(12, 16);
    ctx.lineTo(-12, 16);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff8ec';
    ctx.fillRect(-10, 2, 20, 5);
  } else if (dishId === 'salad') {
    ctx.fillStyle = '#5da85a';
    ctx.beginPath();
    ctx.arc(-8, -4, 8, 0, Math.PI * 2);
    ctx.arc(6, -8, 9, 0, Math.PI * 2);
    ctx.arc(8, 2, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d94f3d';
    ctx.beginPath();
    ctx.arc(-4, -2, 3, 0, Math.PI * 2);
    ctx.arc(9, -5, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3d7bd9';
    ctx.beginPath();
    ctx.arc(0, 8, 17, 0, Math.PI);
    ctx.fill();
    ctx.fillRect(-17, 6, 34, 3);
  } else if (dishId === 'soup') {
    ctx.strokeStyle = '#b8b8b8';
    ctx.beginPath();
    ctx.moveTo(-8, -16);
    ctx.quadraticCurveTo(-12, -20, -8, -24);
    ctx.moveTo(6, -16);
    ctx.quadraticCurveTo(2, -20, 6, -24);
    ctx.stroke();
    ctx.fillStyle = '#c96f4a';
    ctx.beginPath();
    ctx.arc(0, 6, 18, 0, Math.PI);
    ctx.fill();
    ctx.fillRect(-18, 4, 36, 3);
    ctx.fillStyle = '#e8a13c';
    ctx.beginPath();
    ctx.ellipse(0, 4, 14, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (dishId === 'pancakes') {
    ctx.fillStyle = '#e0a458';
    ctx.beginPath();
    ctx.ellipse(0, 10, 18, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, 2, 16, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, -6, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8a4b2a';
    ctx.beginPath();
    ctx.ellipse(0, -8, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-2, -8, 4, 10);
  }
  ctx.restore();
}

function drawHearts(ctx, hearts, x, y) {
  for (let i = 0; i < 3; i += 1) {
    const cx = x + i * 26;
    ctx.fillStyle = i < hearts ? RED : '#cbb59a';
    ctx.beginPath();
    ctx.moveTo(cx, y + 8);
    ctx.bezierCurveTo(cx - 10, y - 2, cx - 4, y - 10, cx, y - 3);
    ctx.bezierCurveTo(cx + 4, y - 10, cx + 10, y - 2, cx, y + 8);
    ctx.fill();
  }
}

function drawCustomer(ctx, customer, rect, selected, selectedDish) {
  const cx = rect.x + rect.width / 2;
  const baseY = rect.y + rect.height;
  // Order bubble.
  const bubble = { x: cx - 62, y: rect.y - 6, width: 124, height: 66 };
  fillRoundRect(ctx, bubble, 12, '#ffffff');
  strokeRoundRect(ctx, bubble, 12, '#d9c3a3', 2);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(cx - 8, bubble.y + bubble.height - 1);
  ctx.lineTo(cx + 8, bubble.y + bubble.height - 1);
  ctx.lineTo(cx, bubble.y + bubble.height + 10);
  ctx.closePath();
  ctx.fill();
  const count = customer.order.length;
  customer.order.forEach((dishId, i) => {
    const ix = cx + (i - (count - 1) / 2) * 40;
    const served = customer.served.includes(dishId);
    ctx.globalAlpha = served ? 0.35 : 1;
    drawDishIcon(ctx, dishId, ix, bubble.y + 26, 34);
    ctx.globalAlpha = 1;
    if (served) {
      ctx.strokeStyle = GREEN;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(ix - 8, bubble.y + 26);
      ctx.lineTo(ix - 2, bubble.y + 32);
      ctx.lineTo(ix + 9, bubble.y + 18);
      ctx.stroke();
    }
  });
  // Patience bar under the bubble.
  const fraction = patienceFraction(customer);
  const bar = { x: bubble.x + 8, y: bubble.y + bubble.height - 12, width: bubble.width - 16, height: 7 };
  fillRoundRect(ctx, bar, 3, '#e8dcc8');
  fillRoundRect(ctx, { ...bar, width: bar.width * fraction }, 3, fraction > 0.5 ? GREEN : fraction > 0.25 ? GOLD : RED);
  // Body: shirt, head, hair.
  ctx.fillStyle = customer.shirt;
  ctx.beginPath();
  ctx.roundRect(cx - 34, baseY - 96, 68, 96, 16);
  ctx.fill();
  ctx.fillStyle = customer.skin;
  ctx.beginPath();
  ctx.arc(cx, baseY - 118, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = customer.hair;
  ctx.beginPath();
  ctx.arc(cx, baseY - 124, 26, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(cx - 26, baseY - 126, 10, 18);
  ctx.fillRect(cx + 16, baseY - 126, 10, 18);
  // Eyes: worried when patience is low.
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(cx - 9, baseY - 116, 3, 0, Math.PI * 2);
  ctx.arc(cx + 9, baseY - 116, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (fraction > 0.35) ctx.arc(cx, baseY - 104, 8, 0.15 * Math.PI, 0.85 * Math.PI);
  else ctx.arc(cx, baseY - 98, 8, 1.15 * Math.PI, 1.85 * Math.PI);
  ctx.stroke();
  if (selected) {
    strokeRoundRect(ctx, { x: rect.x + 6, y: rect.y - 10, width: rect.width - 12, height: rect.height + 8 }, 14, GOLD, 3);
  }
  if (selectedDish && customerWants(customer, selectedDish)) {
    centeredText(ctx, '▼ serve!', cx, rect.y - 22, 15, GREEN);
  }
}

function drawHud(ctx, world, ui, rects) {
  fillRoundRect(ctx, { x: 0, y: 0, width: VIEW.width, height: 56 }, 0, CHALK);
  leftText(ctx, `DAY ${world.day}/${TOTAL_DAYS}`, 16, 22, 20, '#ffffff');
  leftText(ctx, `Target $${world.target}`, 16, 44, 13, '#c8d8cc');
  // Target progress.
  const bar = { x: 140, y: 18, width: 220, height: 20 };
  fillRoundRect(ctx, bar, 10, '#4a5a50');
  const progress = Math.min(1, world.dayEarned / Math.max(1, world.target));
  fillRoundRect(ctx, { ...bar, width: bar.width * progress }, 10, progress >= 1 ? GREEN : GOLD);
  centeredText(ctx, `$${world.dayEarned}`, bar.x + bar.width / 2, bar.y + 11, 14, '#ffffff');
  centeredText(ctx, `Coins $${world.coins}`, 470, 28, 22, GOLD);
  centeredText(ctx, `Score ${world.score}`, 600, 28, 18, '#ffffff');
  // Timer.
  const minutes = Math.floor(world.timeLeft / 60);
  const seconds = Math.floor(world.timeLeft % 60);
  const timerText = `${minutes}:${String(seconds).padStart(2, '0')}`;
  centeredText(ctx, `Time ${timerText}`, 730, 28, 20, world.timeLeft < 15 && world.phase === 'play' ? '#ff8a7a' : '#ffffff');
  drawHearts(ctx, world.hearts, 792, 22);
  // Pause and mute buttons.
  fillRoundRect(ctx, rects.pauseButton, 8, '#4a5a50');
  centeredText(ctx, 'II', rects.pauseButton.x + 22, rects.pauseButton.y + 19, 16, '#ffffff');
  fillRoundRect(ctx, rects.muteButton, 8, '#4a5a50');
  centeredText(ctx, ui.muted ? '✕' : '♪', rects.muteButton.x + 22, rects.muteButton.y + 19, 18, '#ffffff');
}

function drawKitchenButtons(ctx, world, ui, rects) {
  DISHES.forEach((dish, i) => {
    const rect = rects.dishButtons[i];
    const progress = cookingProgress(world.kitchen, dish.id);
    const waiting = dishWaiting(world.kitchen, dish.id);
    const cooking = progress !== null;
    fillRoundRect(ctx, rect, 12, cooking ? '#ffe9c4' : waiting ? '#d8f0dc' : PANEL);
    strokeRoundRect(ctx, rect, 12, cooking ? GOLD : '#d9c3a3', 2);
    drawDishIcon(ctx, dish.id, rect.x + rect.width / 2, rect.y + 34, 44);
    centeredText(ctx, dish.name, rect.x + rect.width / 2, rect.y + 68, 17, INK);
    centeredText(ctx, `$${dish.price} · ${dish.station} · ${dish.cookTime}s`, rect.x + rect.width / 2, rect.y + 88, 12, MUTED_INK);
    if (cooking) {
      const bar = { x: rect.x + 12, y: rect.y + 102, width: rect.width - 24, height: 12 };
      fillRoundRect(ctx, bar, 6, '#e8dcc8');
      fillRoundRect(ctx, { ...bar, width: bar.width * progress }, 6, GOLD);
      centeredText(ctx, `${Math.ceil((1 - progress) * dish.cookTime)}s`, rect.x + rect.width / 2, rect.y + 122, 12, MUTED_INK);
    } else if (waiting) {
      centeredText(ctx, 'READY — tray full!', rect.x + rect.width / 2, rect.y + 110, 13, GREEN);
    } else {
      centeredText(ctx, `Press ${dish.key} or click`, rect.x + rect.width / 2, rect.y + 110, 12, MUTED_INK);
    }
  });
}

function drawTray(ctx, world, ui, rects) {
  leftText(ctx, 'SERVING COUNTER', 24, 364, 14, MUTED_INK);
  ctx.font = font(13, 'normal');
  ctx.fillStyle = MUTED_INK;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText('click a dish, then its customer', VIEW.width - 24, 364);
  rects.traySlots.forEach((slot, i) => {
    const dishId = world.kitchen.tray[i];
    const selected = ui.selectedDish !== null && dishId === ui.selectedDish && world.kitchen.tray.indexOf(dishId) === i;
    fillRoundRect(ctx, slot, 10, dishId ? '#ffffff' : '#efe0c8');
    strokeRoundRect(ctx, slot, 10, selected ? GREEN : '#d9c3a3', selected ? 3 : 2);
    if (dishId) drawDishIcon(ctx, dishId, slot.x + slot.width / 2, slot.y + slot.height / 2, 40);
  });
}

function drawPlayScene(ctx, world, ui, rects) {
  // Wall and floor.
  ctx.fillStyle = WALL;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = WALL_DARK;
  ctx.fillRect(0, 0, VIEW.width, 6);
  ctx.fillStyle = FLOOR;
  ctx.fillRect(0, 540, VIEW.width, 60);
  // Menu strip under the HUD: the day's menu, always in view.
  ctx.fillStyle = '#3a4a40';
  ctx.fillRect(0, 56, VIEW.width, 20);
  centeredText(ctx, 'TODAY’S MENU — burgers · noodles · fries · salad · soup · pancakes', 480, 67, 12, '#f6e3c8', 'normal');
  // Customers.
  for (const customer of world.customers) {
    const rect = rects.customerSlots[customer.slot];
    if (rect) drawCustomer(ctx, customer, rect, ui.selectedSlot === customer.slot, ui.selectedDish);
  }
  // The counter front hides the customers' lower bodies.
  fillRoundRect(ctx, { x: 24, y: 286, width: VIEW.width - 48, height: 22 }, 6, COUNTER_TOP);
  fillRoundRect(ctx, { x: 24, y: 308, width: VIEW.width - 48, height: 8 }, 0, COUNTER_FRONT);
  // Name tags sit on the counter front, under each customer.
  for (const customer of world.customers) {
    const rect = rects.customerSlots[customer.slot];
    if (rect) centeredText(ctx, customer.name, rect.x + rect.width / 2, 297, 12, '#ffffff', 'normal');
  }
  if (world.message) {
    centeredText(ctx, world.message, VIEW.width / 2, 324, 15, INK);
  }
  drawTray(ctx, world, ui, rects);
  drawKitchenButtons(ctx, world, ui, rects);
  drawHud(ctx, world, ui, rects);
  centeredText(ctx, '1–6 cook · click a customer to serve · ←/→ pick a customer · Enter serve · P pause · M mute', VIEW.width / 2, 570, 14, '#7c5a3a');
}

function drawOverlay(ctx, alpha) {
  ctx.fillStyle = `rgba(43, 30, 18, ${alpha})`;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
}

function drawPanel(ctx, rect) {
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 8;
  fillRoundRect(ctx, rect, 18, PANEL);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  strokeRoundRect(ctx, rect, 18, GOLD, 3);
}

function drawButton(ctx, rect, label, enabled) {
  fillRoundRect(ctx, rect, 12, enabled ? GREEN : '#b8a88f');
  strokeRoundRect(ctx, rect, 12, enabled ? '#1f5c38' : '#8a7a63', 2);
  centeredText(ctx, label, rect.x + rect.width / 2, rect.y + rect.height / 2 + 1, 20, '#ffffff');
}

function drawTitle(ctx, world, ui, rects) {
  drawPlayScene(ctx, world, ui, rects);
  drawOverlay(ctx, 0.45);
  const panel = { x: 180, y: 60, width: 600, height: 480 };
  drawPanel(ctx, panel);
  centeredText(ctx, 'SIZZLE & SERVE', 480, 118, 44, INK);
  centeredText(ctx, 'a tiny kitchen-rush game', 480, 158, 18, MUTED_INK);
  centeredText(ctx, 'Run the stall. Feed the rush. Earn your star.', 480, 188, 16, GREEN);
  const steps = [
    ['1. COOK', 'Click a dish (or press 1–6) — it sizzles, then lands on the counter.'],
    ['2. SERVE', 'Click a customer to hand them what they ordered. Fast service = bigger tips.'],
    ['3. SURVIVE', 'Hit the day’s coin target before the clock runs out. 5 days to win!'],
  ];
  steps.forEach(([head, body], i) => {
    const y = 232 + i * 52;
    leftText(ctx, head, 220, y, 17, RED);
    leftText(ctx, body, 220, y + 22, 14, INK, 'normal');
  });
  centeredText(ctx, 'Lose a customer and you lose a heart — 3 hearts, then the stall closes.', 480, 404, 14, MUTED_INK, 'normal');
  drawButton(ctx, rects.startButton, '▶  START DAY 1', true);
  const bestLine = ui.best > 0 ? `Best score: ${ui.best}  ·  ` : '';
  centeredText(ctx, `${bestLine}Mouse + keyboard · P pause · M mute`, 480, 522, 13, MUTED_INK, 'normal');
}

function drawShop(ctx, world, ui, rects) {
  drawPlayScene(ctx, world, ui, rects);
  drawOverlay(ctx, 0.5);
  const panel = { x: 90, y: 80, width: 780, height: 460 };
  drawPanel(ctx, panel);
  centeredText(ctx, `UPGRADE SHOP — before Day ${world.day + 1}`, 480, 122, 28, INK);
  centeredText(ctx, `You have $${world.coins} to spend. Upgrades last the whole run.`, 480, 148, 15, MUTED_INK, 'normal');
  UPGRADES.forEach((upgrade, i) => {
    const rect = rects.shopCards[i];
    const level = world.upgrades[upgrade.id] ?? 0;
    const maxed = level >= upgrade.maxLevel;
    const price = maxed ? 0 : upgradePrice(upgrade, level);
    const afford = !maxed && world.coins >= price;
    fillRoundRect(ctx, rect, 12, '#ffffff');
    strokeRoundRect(ctx, rect, 12, afford ? GREEN : '#d9c3a3', afford ? 2 : 1);
    leftText(ctx, upgrade.name, rect.x + 16, rect.y + 24, 18, INK);
    leftText(ctx, upgrade.desc, rect.x + 16, rect.y + 50, 14, MUTED_INK, 'normal');
    leftText(ctx, `Level ${level}/${upgrade.maxLevel}`, rect.x + 16, rect.y + 76, 14, GREEN);
    const buy = { x: rect.x + rect.width - 120, y: rect.y + rect.height - 46, width: 104, height: 34 };
    fillRoundRect(ctx, buy, 8, maxed ? '#b8a88f' : afford ? GOLD : '#d9c3a3');
    centeredText(ctx, maxed ? 'MAXED' : `$${price}`, buy.x + buy.width / 2, buy.y + 18, 16, maxed || !afford ? '#fff8ec' : INK);
  });
  drawButton(ctx, rects.nextDayButton, `▶  START DAY ${world.day + 1}`, true);
}

function drawDayClear(ctx, world, ui, rects) {
  drawPlayScene(ctx, world, ui, rects);
  drawOverlay(ctx, 0.5);
  const panel = { x: 230, y: 120, width: 500, height: 380 };
  drawPanel(ctx, panel);
  centeredText(ctx, `★  DAY ${world.day} COMPLETE!  ★`, 480, 172, 30, GREEN);
  centeredText(ctx, `You earned $${world.dayEarned} of the $${world.target} target.`, 480, 214, 17, INK, 'normal');
  centeredText(ctx, `Hearts left: ${world.hearts}  ·  Served: ${world.servedTotal}  ·  Lost: ${world.lostTotal}`, 480, 248, 16, MUTED_INK, 'normal');
  centeredText(ctx, `Score: ${world.score}   Coins: $${world.coins}`, 480, 282, 18, INK);
  centeredText(ctx, 'Spend your coins in the shop before the next rush.', 480, 330, 15, MUTED_INK, 'normal');
  drawButton(ctx, rects.continueButton, 'TO THE SHOP', true);
  centeredText(ctx, 'or press Enter', 480, 486, 13, MUTED_INK, 'normal');
}

function drawWin(ctx, world, ui, rects) {
  drawPlayScene(ctx, world, ui, rects);
  drawOverlay(ctx, 0.55);
  const panel = { x: 180, y: 110, width: 600, height: 380 };
  drawPanel(ctx, panel);
  centeredText(ctx, '★  RESTAURANT STAR!  ★', 480, 168, 34, GOLD);
  centeredText(ctx, 'Five days of dinner rush — and the stall is still standing.', 480, 212, 17, INK, 'normal');
  centeredText(ctx, `Final score: ${world.score}`, 480, 258, 26, GREEN);
  centeredText(ctx, `Customers served: ${world.servedTotal}  ·  Walk-outs: ${world.lostTotal}`, 480, 296, 16, MUTED_INK, 'normal');
  if (ui.best > 0) centeredText(ctx, `Best score: ${ui.best}`, 480, 330, 16, MUTED_INK, 'normal');
  drawButton(ctx, rects.restartButton, '↻  PLAY AGAIN', true);
  centeredText(ctx, 'or press R', 480, 500 - 20, 13, MUTED_INK, 'normal');
}

function drawOver(ctx, world, ui, rects) {
  drawPlayScene(ctx, world, ui, rects);
  drawOverlay(ctx, 0.55);
  const panel = { x: 180, y: 110, width: 600, height: 380 };
  drawPanel(ctx, panel);
  centeredText(ctx, 'THE STALL CLOSES…', 480, 168, 32, RED);
  const reason =
    world.hearts <= 0
      ? 'Too many customers stormed off — the last heart is gone.'
      : `Day ${world.day} ended at $${world.dayEarned} of the $${world.target} target.`;
  centeredText(ctx, reason, 480, 212, 16, INK, 'normal');
  centeredText(ctx, `Score: ${world.score}  ·  Day reached: ${world.day}/${TOTAL_DAYS}`, 480, 258, 20, INK);
  centeredText(ctx, `Customers served: ${world.servedTotal}  ·  Walk-outs: ${world.lostTotal}`, 480, 292, 16, MUTED_INK, 'normal');
  if (ui.best > 0) centeredText(ctx, `Best score: ${ui.best}`, 480, 326, 16, MUTED_INK, 'normal');
  drawButton(ctx, rects.restartButton, '↻  TRY AGAIN', true);
  centeredText(ctx, 'or press R', 480, 500 - 20, 13, MUTED_INK, 'normal');
}

function drawPaused(ctx, world, ui, rects) {
  drawPlayScene(ctx, world, ui, rects);
  drawOverlay(ctx, 0.5);
  const panel = { x: 330, y: 200, width: 300, height: 180 };
  drawPanel(ctx, panel);
  centeredText(ctx, 'PAUSED', 480, 258, 30, INK);
  centeredText(ctx, 'Press P or click to resume.', 480, 300, 15, MUTED_INK, 'normal');
  centeredText(ctx, 'The rush waits for no one.', 480, 330, 14, MUTED_INK, 'normal');
}

/** Create a renderer bound to a canvas; it scales crisply to the window. */
export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = VIEW.width * dpr;
    canvas.height = VIEW.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  return {
    /** Paint the world under the given screen, with the UI state overlaid. */
    draw(world, screen, ui) {
      const rects = layout(screen, world);
      ctx.clearRect(0, 0, VIEW.width, VIEW.height);
      if (screen === SCREEN_TITLE) drawTitle(ctx, world, ui, rects);
      else if (screen === SCREEN_SHOP) drawShop(ctx, world, ui, rects);
      else if (screen === SCREEN_DAYCLEAR) drawDayClear(ctx, world, ui, rects);
      else if (screen === SCREEN_WIN) drawWin(ctx, world, ui, rects);
      else if (screen === SCREEN_OVER) drawOver(ctx, world, ui, rects);
      else if (screen === SCREEN_PAUSED) drawPaused(ctx, world, ui, rects);
      else drawPlayScene(ctx, world, ui, rects);
    },
  };
}
