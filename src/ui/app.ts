import {
  BAR_DOMAIN,
  LOW_TIME,
  NAME_PATTERN,
  STAT_LABEL,
  STAT_SHORT,
  STATS,
  TICK_MS,
} from '../data/constants';
import { DIFFICULTY } from '../data/difficulty';
import { INGREDIENTS } from '../data/ingredients';
import { inRange } from '../logic/brew-check';
import { calculateCauldron } from '../logic/calculate-cauldron';
import {
  addIngredient,
  brew,
  exitToMenu,
  getState,
  pause,
  resume,
  startGame,
  subscribe,
  subscribeTick,
  tick,
} from '../state/game-state';
import { addEntry, clearBoard, loadBoard, qualifies } from '../storage/leaderboard';
import type { Difficulty, IGameState, IValues, Stat } from '../types';

interface IFill {
  left: number;
  width: number;
  pos: number;
}

const MID = 50;
const FULL = 100;
type Overlay = 'none' | 'leaderboard' | 'confirm-clear';

const appRoot = document.querySelector<HTMLDivElement>('#app');
if (!appRoot) throw new Error('Missing #app element');
const root: HTMLDivElement = appRoot;

let overlay: Overlay = 'none';
let nameError = '';
let scoreSaved = false;
let prevFill: Record<Stat, IFill> = {
  temperature: { left: MID, width: 0, pos: MID },
  density: { left: MID, width: 0, pos: MID },
  magicPower: { left: MID, width: 0, pos: MID },
};

/* ---------- helpers ---------- */
const pad = (n: number): string => String(n).padStart(2, '0');
const formatTime = (s: number): string => {
  const t = Math.max(0, Math.ceil(s));
  return `${pad(Math.floor(t / 60))}:${pad(t % 60)}`;
};
const formatDate = (ts: number): string => {
  const d = new Date(ts);
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const esc = (s: string): string => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const signed = (n: number): string => (n > 0 ? `+${n}` : n < 0 ? `\u2212${Math.abs(n)}` : '0');
const pct = (v: number, k: Stat): number =>
  Math.min(FULL, Math.max(0, ((v + BAR_DOMAIN[k]) / (2 * BAR_DOMAIN[k])) * FULL));
const fillOf = (v: number, k: Stat): IFill => {
  const p = pct(v, k);
  return { left: Math.min(p, MID), width: Math.abs(p - MID), pos: p };
};
const btn = (action: string, label: string, cls = '', disabled = false): string =>
  `<button class="btn ${cls}" type="button" data-action="${action}"${disabled ? ' disabled' : ''}>${label}</button>`;
const shelfList = (s: IGameState) => INGREDIENTS.slice(0, DIFFICULTY[s.difficulty].shelfSize);

/* ---------- view builders ---------- */
function statsHtml(s: IGameState): string {
  return [
    '<div class="hud__stats">',
    `<p class="hud__score">Score: <b>${s.score}</b></p>`,
    timeHtml(s),
    '</div>',
  ].join('');
}

function timeHtml(s: IGameState): string {
  const ratio = Math.min(1, s.timeLeft / DIFFICULTY[s.difficulty].startTime);
  const low = s.status !== 'menu' && s.timeLeft < LOW_TIME;
  return [
    `<div id="time" class="hud__time${low ? ' hud__time--low' : ''}">`,
    `Time: <b id="time-text">${formatTime(s.timeLeft)}</b>`,
    `<div class="hud__bar"><i id="time-fill" style="width:${ratio * FULL}%"></i></div></div>`,
  ].join('');
}

function livesHtml(s: IGameState): string {
  const total = s.status === 'menu' ? 0 : DIFFICULTY[s.difficulty].lives;
  const hearts = Array.from(
    { length: total },
    (_, i) => `<span class="heart${i < s.lives ? '' : ' heart--lost'}">\u2665</span>`,
  ).join('');
  return `<div class="hud__lives" aria-label="Lives">${hearts}</div>`;
}

function headerHtml(s: IGameState): string {
  return [
    '<header class="hud">',
    statsHtml(s),
    '<h1 class="title">Alchemist\u2019s Cauldron</h1>',
    livesHtml(s),
    '</header>',
  ].join('');
}

function shelfHtml(s: IGameState): string {
  if (s.status === 'menu') return '<p class="shelf__empty">The shelf is empty</p>';
  const locked =
    s.status !== 'playing' || s.cauldronIngredients.length >= DIFFICULTY[s.difficulty].maxCauldron;
  return shelfList(s)
    .map((ing) => {
      const stock = s.shelfStock[ing.id] ?? 0;
      if (stock <= 0) return '<li class="card card--empty"><span class="badge">0</span></li>';
      return [
        '<li class="card"',
        '>',
        `<button class="card__btn" type="button" data-id="${ing.id}"`,
        locked ? ' disabled' : '',
        '>',
        `<span class="badge">${stock}</span>`,
        `<span class="card__icon" aria-hidden="true">${ing.icon}</span>`,
        `<span class="card__name">${ing.name}</span>`,
        `<span class="card__stats">${STATS.map((k) => `<span>${STAT_SHORT[k]} ${signed(ing[k])}</span>`).join('')}</span>`,
        '</button></li>',
      ].join('');
    })
    .join('');
}

function cauldronHtml(s: IGameState): string {
  const items = s.cauldronIngredients
    .map((i, n) => `<span class="float" style="--i:${n}" aria-hidden="true">${i.icon}</span>`)
    .join('');
  return [
    '<div class="cauldron"',
    '>',
    `<div class="cauldron__pot"><div class="cauldron__content">${items}</div></div>`,
    '</div>',
  ].join('');
}

function recipeHtml(s: IGameState): string {
  const r = s.activeRecipe;
  const max = DIFFICULTY[s.difficulty].maxCauldron;
  const full = s.cauldronIngredients.length >= max;
  const rows = STATS.map(
    (k) =>
      `<div class="recipe__row"><span>${STAT_LABEL[k]}</span><b>${r ? `${r[k].min}..${r[k].max}` : '\u2014'}</b></div>`,
  ).join('');
  return [
    '<aside class="recipe"><h2 class="recipe__label">Current recipe</h2>',
    `<p class="recipe__name">${r ? r.name : 'No recipe yet'}</p>${rows}`,
    `<p class="recipe__count${full ? ' recipe__count--full' : ''}">Ingredients: ${s.cauldronIngredients.length} / ${max}</p></aside>`,
  ].join('');
}

function barsHtml(s: IGameState, values: IValues): string {
  const tol = DIFFICULTY[s.difficulty].tolerance;
  const r = s.activeRecipe;
  return STATS.map((k) => {
    let zones = '';
    let ok = false;
    if (r) {
      const a = pct(r[k].min - tol, k);
      const b = pct(r[k].max + tol, k);
      const c = pct(r[k].min, k);
      const d = pct(r[k].max, k);
      zones = `<i class="bar__zone bar__zone--tol" style="left:${a}%;width:${b - a}%"></i><i class="bar__zone" style="left:${c}%;width:${d - c}%"></i>`;
      ok = s.cauldronIngredients.length > 0 && inRange(values[k], r[k], tol);
    }
    const f = prevFill[k];
    return [
      `<section class="bar bar--${k}${ok ? ' bar--ok' : ''}">`,
      `<h3 class="bar__title">${STAT_LABEL[k]}</h3>`,
      `<div class="bar__track">${zones}<i class="bar__zero"></i>`,
      `<i class="bar__fill" data-stat="${k}" style="left:${f.left}%;width:${f.width}%"></i>`,
      `<i class="bar__marker" data-marker="${k}" style="left:${f.pos}%"></i></div>`,
      `<span class="bar__value">${signed(Math.round(values[k]))}</span></section>`,
    ].join('');
  }).join('');
}

function actionsHtml(s: IGameState): string {
  const playing = s.status === 'playing';
  const empty = s.cauldronIngredients.length === 0;
  const side =
    s.status === 'menu' ? btn('leaderboard', 'Leaderboard') : btn('pause', 'Pause', '', !playing);
  const main =
    s.status === 'menu'
      ? btn('start', 'Start Game', 'btn--brew')
      : [btn('brew', 'Brew', 'btn--brew', !playing || empty)].join('');
  return [
    '<footer class="actions">',
    '<span></span>',
    `<div class="actions__main">${main}</div>`,
    side || '<span></span>',
    '</footer>',
  ].join('');
}

const modal = (title: string, body: string): string =>
  `<div class="overlay"><div class="modal" role="dialog" aria-modal="true" aria-label="${title}"><h2 class="modal__title">${title}</h2>${body}</div></div>`;

function boardHtml(d: Difficulty): string {
  const rows = loadBoard(d);
  if (rows.length === 0) return '<p>No records yet.</p>';
  const body = rows
    .map((e, i) =>
      [
        `<tr><td>${i + 1}</td><td>${esc(e.name)}</td><td>${e.score}</td>`,
        `<td>${formatDate(e.timestamp)}</td></tr>`,
      ].join(''),
    )
    .join('');
  return [
    '<div class="board-wrap"><table class="board"><thead><tr><th>#</th><th>Name</th><th>Score</th>',
    `<th>Date</th></tr></thead><tbody>${body}</tbody></table></div>`,
  ].join('');
}

function entryHtml(s: IGameState): string {
  if (scoreSaved || !qualifies(s.score, s.difficulty)) return '';
  return [
    '<form class="entry"><label>Your name <input name="name" maxlength="15" autocomplete="off" required /></label>',
    `<button class="btn btn--small" type="submit">Save</button><p class="entry__error">${nameError}</p></form>`,
  ].join('');
}

function overlayHtml(s: IGameState): string {
  if (overlay === 'leaderboard') {
    return modal(
      'Leaderboard',
      `${boardHtml(s.difficulty)}<div class="modal__row">${btn('confirm-clear', 'Clear Leaderboard')}${btn('close', 'Close')}</div>`,
    );
  }
  if (overlay === 'confirm-clear') {
    return modal(
      'Clear leaderboard?',
      `<div class="modal__row">${btn('clear', 'Yes, clear')}${btn('leaderboard', 'Cancel')}</div>`,
    );
  }
  if (s.status === 'paused') {
    return modal(
      'Paused',
      `<div class="modal__stack">${btn('resume', 'Resume', 'btn--brew')}${btn('exit', 'Exit to Menu')}</div>`,
    );
  }
  if (s.status === 'game-over') {
    return modal(
      'Game Over',
      [
        `<p class="modal__score">Final score: <b>${s.score}</b></p><p>${s.gameOverReason}</p>`,
        entryHtml(s),
        boardHtml(s.difficulty),
        '<div class="modal__row">',
        btn('start', 'Play Again', 'btn--brew'),
        btn('exit', 'Menu'),
        '</div>',
      ].join(''),
    );
  }
  return '';
}

/* ---------- render ---------- */
function render(): void {
  const s = getState();
  const values = calculateCauldron(s.cauldronIngredients);
  const fills = Object.fromEntries(STATS.map((k) => [k, fillOf(values[k], k)])) as Record<
    Stat,
    IFill
  >;
  root.innerHTML = [
    '<div class="game',
    s.status === 'paused' ? ' game--paused' : '',
    '">',
    headerHtml(s),
    '<main class="field"><ul class="shelf">',
    shelfHtml(s),
    '</ul>',
    cauldronHtml(s),
    recipeHtml(s),
    '</main>',
    `<section class="bars">${barsHtml(s, values)}</section>`,
    actionsHtml(s),
    '</div>',
    overlayHtml(s),
  ].join('');
  void root.offsetWidth;
  root.querySelectorAll<HTMLElement>('.bar__fill').forEach((el) => {
    const f = fills[el.dataset.stat as Stat];
    el.style.left = `${f.left}%`;
    el.style.width = `${f.width}%`;
  });
  root.querySelectorAll<HTMLElement>('.bar__marker').forEach((el) => {
    el.style.left = `${fills[el.dataset.marker as Stat].pos}%`;
  });
  prevFill = fills;
  root.querySelector<HTMLElement>('[data-action="resume"]')?.focus();
}

function updateHud(): void {
  const s = getState();
  const text = document.querySelector<HTMLElement>('#time-text');
  const fill = document.querySelector<HTMLElement>('#time-fill');
  const box = document.querySelector<HTMLElement>('#time');
  if (!text || !fill || !box) return;
  text.textContent = formatTime(s.timeLeft);
  fill.style.width = `${Math.min(1, s.timeLeft / DIFFICULTY[s.difficulty].startTime) * FULL}%`;
  box.classList.toggle('hud__time--low', s.timeLeft < LOW_TIME);
}

/* ---------- actions ---------- */
const ui = (fn: () => void) => (): void => {
  fn();
  render();
};

const actions: Record<string, (el: HTMLElement) => void> = {
  start: () => {
    overlay = 'none';
    scoreSaved = false;
    nameError = '';
    startGame();
  },
  brew,
  pause,
  resume,
  exit: exitToMenu,
  leaderboard: ui(() => {
    overlay = 'leaderboard';
  }),
  'confirm-clear': ui(() => {
    overlay = 'confirm-clear';
  }),
  clear: ui(() => {
    clearBoard(getState().difficulty);
    overlay = 'leaderboard';
  }),
  close: ui(() => {
    overlay = 'none';
  }),
};

/* ---------- events ---------- */
export function initApp(): void {
  subscribe(render);
  subscribeTick(updateHud);

  root.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const act = target.closest<HTMLElement>('[data-action]');
    if (act?.dataset.action) {
      actions[act.dataset.action]?.(act);
      return;
    }
    const card = target.closest<HTMLElement>('[data-id]');
    if (card?.dataset.id) addIngredient(card.dataset.id);
  });

  root.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = String(new FormData(e.target as HTMLFormElement).get('name') ?? '').trim();
    if (!NAME_PATTERN.test(name)) {
      nameError = '2\u201315 characters: letters, digits, space, _ or -';
    } else {
      const s = getState();
      addEntry({ name, score: s.score, difficulty: s.difficulty, timestamp: Date.now() });
      scoreSaved = true;
      nameError = '';
    }
    render();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pause();
  });
  window.setInterval(tick, TICK_MS);
  render();
}
