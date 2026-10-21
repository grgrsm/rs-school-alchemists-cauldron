import { STAT_SHORT, STATS } from '../data/constants';
import { DIFFICULTY } from '../data/difficulty';
import { INGREDIENTS } from '../data/ingredients';
import { addIngredient, getState, startGame, subscribe } from '../state/game-state';
import type { IGameState } from '../types';

const appRoot = document.querySelector<HTMLDivElement>('#app');
if (!appRoot) throw new Error('Missing #app element');
const root: HTMLDivElement = appRoot;

/* ---------- helpers ---------- */
const signed = (n: number): string => (n > 0 ? `+${n}` : n < 0 ? `\u2212${Math.abs(n)}` : '0');
const shelfList = (s: IGameState) => INGREDIENTS.slice(0, DIFFICULTY[s.difficulty].shelfSize);

/* ---------- view builders ---------- */

function headerHtml(): string {
  return [
    '<header class="hud">',
    '<h1 class="title">Alchemist\u2019s Cauldron</h1>',
    '</header>',
  ].join('');
}

function shelfHtml(s: IGameState): string {
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

/* ---------- render ---------- */
function render(): void {
  const s = getState();
  root.innerHTML = [
    '<div class="game',
    '">',
    headerHtml(),
    '<main class="field"><ul class="shelf">',
    shelfHtml(s),
    '</ul>',
    cauldronHtml(s),
    '</main>',
    '</div>',
  ].join('');
}

/* ---------- events ---------- */
export function initApp(): void {
  subscribe(render);

  root.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const card = target.closest<HTMLElement>('[data-id]');
    if (card?.dataset.id) addIngredient(card.dataset.id);
  });
  startGame();
}
