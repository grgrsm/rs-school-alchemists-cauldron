import { BAR_DOMAIN, STAT_LABEL, STAT_SHORT, STATS } from '../data/constants';
import { DIFFICULTY } from '../data/difficulty';
import { INGREDIENTS } from '../data/ingredients';
import { inRange } from '../logic/brew-check';
import { calculateCauldron } from '../logic/calculate-cauldron';
import { addIngredient, brew, getState, startGame, subscribe } from '../state/game-state';
import type { IGameState, IValues, Stat } from '../types';

interface IFill {
  left: number;
  width: number;
  pos: number;
}

const MID = 50;
const FULL = 100;

const appRoot = document.querySelector<HTMLDivElement>('#app');
if (!appRoot) throw new Error('Missing #app element');
const root: HTMLDivElement = appRoot;
let prevFill: Record<Stat, IFill> = {
  temperature: { left: MID, width: 0, pos: MID },
  density: { left: MID, width: 0, pos: MID },
  magicPower: { left: MID, width: 0, pos: MID },
};

/* ---------- helpers ---------- */
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
    '</div>',
  ].join('');
}

function headerHtml(s: IGameState): string {
  return [
    '<header class="hud">',
    statsHtml(s),
    '<h1 class="title">Alchemist\u2019s Cauldron</h1>',
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
  const side = '';
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
}

const actions: Record<string, (el: HTMLElement) => void> = {
  start: () => {
    startGame();
  },
  brew,
};

/* ---------- events ---------- */
export function initApp(): void {
  subscribe(render);

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
  render();
}
