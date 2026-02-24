import type { Enchantment } from '../data/enchantments';
import { ENCHANTMENTS } from '../data/enchantments';

export interface EnchantLevel {
  enchantmentId: string;
  level: number;
}

export interface Item {
  id: string;
  label: string;
  isBook: boolean;
  enchantments: EnchantLevel[];
  penalty: number; // work penalty count (0-based, actual cost = 2^penalty - 1)
}

export interface ForgeStep {
  target: Item;
  sacrifice: Item;
  result: Item;
  cost: number; // XP levels
}

export interface CalcResult {
  steps: ForgeStep[];
  totalCost: number;
  tooExpensive: boolean;
  calcTimeMs?: number;
}

function getEnchantById(id: string): Enchantment | undefined {
  return ENCHANTMENTS.find(e => e.id === id);
}

function hasConflict(enchId: string, otherEnchId: string): boolean {
  const ench = getEnchantById(enchId);
  if (!ench) return false;
  return ench.conflicts.includes(otherEnchId);
}

function penaltyCost(penalty: number): number {
  return Math.pow(2, penalty) - 1;
}

/** Calculate the enchantment cost of an item as sacrifice (ignoring penalty) */
function calcSacrificeCost(item: Item): number {
  let cost = 0;
  for (const e of item.enchantments) {
    const data = getEnchantById(e.enchantmentId);
    if (!data) continue;
    const multiplier = item.isBook ? data.bookMultiplier : data.itemMultiplier;
    cost += multiplier * e.level;
  }
  return cost;
}

export function preForge(
  target: Item,
  sacrifice: Item,
  isJava: boolean,
  ignorePenalty: boolean = false
): { result: Item; cost: number } {
  let cost = 0;

  // Enchantment costs
  const resultEnchantments: EnchantLevel[] = [...target.enchantments];

  for (const bEnch of sacrifice.enchantments) {
    const bEnchData = getEnchantById(bEnch.enchantmentId);
    if (!bEnchData) continue;

    // Check conflict with any enchantment in target
    const conflictsWithTarget = target.enchantments.some(aEnch =>
      hasConflict(bEnch.enchantmentId, aEnch.enchantmentId) ||
      hasConflict(aEnch.enchantmentId, bEnch.enchantmentId)
    );

    const multiplier = sacrifice.isBook ? bEnchData.bookMultiplier : bEnchData.itemMultiplier;

    if (conflictsWithTarget) {
      if (isJava) cost += 1;
      // Bedrock: no cost for conflict
      continue;
    }

    const existingIdx = resultEnchantments.findIndex(e => e.enchantmentId === bEnch.enchantmentId);
    if (existingIdx >= 0) {
      const aLvl = resultEnchantments[existingIdx].level;
      const bLvl = bEnch.level;
      let combinedLevel: number;
      if (aLvl === bLvl && aLvl < bEnchData.maxLevel) {
        combinedLevel = aLvl + 1;
      } else {
        combinedLevel = Math.max(aLvl, bLvl);
      }
      if (isJava) {
        cost += multiplier * combinedLevel;
      } else {
        cost += multiplier * (combinedLevel - aLvl);
      }
      resultEnchantments[existingIdx] = { enchantmentId: bEnch.enchantmentId, level: combinedLevel };
    } else {
      cost += multiplier * bEnch.level;
      resultEnchantments.push({ enchantmentId: bEnch.enchantmentId, level: bEnch.level });
    }
  }

  // Penalty cost
  if (!ignorePenalty) {
    cost += penaltyCost(target.penalty) + penaltyCost(sacrifice.penalty);
  }

  const resultPenalty = Math.max(target.penalty, sacrifice.penalty) + 1;

  const result: Item = {
    id: `${target.id}+${sacrifice.id}`,
    label: '',
    isBook: target.isBook,
    enchantments: resultEnchantments,
    penalty: resultPenalty,
  };

  return { result, cost };
}

/** Forge two items without cost calculation (for simulation in Hamming) */
function forgeOnly(target: Item, sacrifice: Item, isJava: boolean): Item {
  const { result } = preForge(target, sacrifice, isJava, false);
  return result;
}

let itemCounter = 0;
function newItemId(): string {
  return `item_${++itemCounter}`;
}

/** Build pool of items: weapon + enchanted books with level optimization */
function buildPool(
  weapon: Item,
  targetEnchantments: EnchantLevel[],
): Item[] {
  const pool: Item[] = [{ ...weapon, id: newItemId() }];

  for (const e of targetEnchantments) {
    let bookLevel = e.level;
    // Optimization: if weapon already has this enchantment at level N-1,
    // create a book at level N-1 so combining N-1 + N-1 = N (cheaper)
    const existing = weapon.enchantments.find(we => we.enchantmentId === e.enchantmentId);
    if (existing && e.level - existing.level === 1) {
      const enchData = getEnchantById(e.enchantmentId);
      if (enchData && e.level <= enchData.maxLevel) {
        bookLevel = e.level - 1;
      }
    }

    pool.push({
      id: newItemId(),
      label: '',
      isBook: true,
      enchantments: [{ enchantmentId: e.enchantmentId, level: bookLevel }],
      penalty: 0,
    });
  }

  return pool;
}

/** Find the weapon (non-book) index in the pool */
function findWeaponIndex(pool: Item[]): number {
  return pool.findIndex(item => !item.isBook);
}

/**
 * Sort pool matching reference: penalty ascending, then sacrifice cost descending
 * for books within the same penalty. Weapon position is preserved (only books swap).
 */
function sortPool(pool: Item[]): void {
  // Bubble sort to match reference behavior: only books move, weapon stays in place
  for (let i = 0; i < pool.length - 1; i++) {
    for (let j = 0; j < pool.length - 1 - i; j++) {
      if (pool[j].penalty > pool[j + 1].penalty) {
        [pool[j], pool[j + 1]] = [pool[j + 1], pool[j]];
      } else if (
        pool[j].penalty === pool[j + 1].penalty &&
        pool[j].isBook &&
        calcSacrificeCost(pool[j]) < calcSacrificeCost(pool[j + 1])
      ) {
        [pool[j], pool[j + 1]] = [pool[j + 1], pool[j]];
      }
    }
  }
}

/** Find the range of indices in pool with a given penalty */
function penaltyRange(pool: Item[], penalty: number): { begin: number; end: number } {
  let begin = -1, end = -1;
  for (let i = 0; i < pool.length; i++) {
    if (pool[i].penalty === penalty) {
      if (begin === -1) begin = i;
      end = i;
    }
  }
  return { begin, end };
}

/** Hamming weight (number of 1 bits) of a non-negative integer */
function hammingWeight(n: number): number {
  let count = 0;
  while (n > 0) {
    count += n & 1;
    n >>= 1;
  }
  return count;
}

/** Check if any step exceeds 39 levels (Java "Too Expensive" limit) */
function checkTooExpensive(steps: ForgeStep[], isJava: boolean): boolean {
  if (!isJava) return false;
  return steps.some(s => s.cost >= 40);
}

/**
 * DifficultyFirst algorithm - reference: Dinosaur-MC/BestEnchSeq
 *
 * Key principles:
 * 1. Merge items at the same penalty level first (minimizes penalty costs)
 * 2. Higher-cost items are merged as sacrifices first (when penalty is low)
 * 3. Weapon is target when at same penalty level
 * 4. When no same-penalty pairs exist, merge first two sorted items (books first)
 */
export function calcDifficultyFirst(
  weapon: Item,
  targetEnchantments: EnchantLevel[],
  isJava: boolean,
  ignorePenalty: boolean = false
): CalcResult {
  itemCounter = 0;
  const pool = buildPool(weapon, targetEnchantments);
  const steps: ForgeStep[] = [];

  let curPenalty = pool[0].penalty; // Start with weapon's penalty
  let mode = 0;

  while (pool.length > 1) {
    sortPool(pool);
    const { begin, end } = penaltyRange(pool, curPenalty);

    if (mode === 0) {
      // Mode 0: merge items at the same penalty level
      if (begin === -1 || end - begin === 0) {
        // 0 or 1 item at this penalty level
        const maxPen = Math.max(...pool.map(p => p.penalty));
        if (curPenalty >= maxPen) {
          curPenalty = Math.min(...pool.map(p => p.penalty));
          mode = 1;
        } else {
          curPenalty++;
        }
        continue;
      }

      // At least 2 items at curPenalty
      const w = findWeaponIndex(pool);

      if (w !== -1 && pool[w].penalty === curPenalty) {
        // Weapon is at current penalty level
        let sacrificeIdx = begin;
        if (w === begin) sacrificeIdx = begin + 1;

        const target = pool[w];
        const sacrifice = pool[sacrificeIdx];
        const { result, cost } = preForge(target, sacrifice, isJava, ignorePenalty);
        result.id = newItemId();
        result.label = `步骤${steps.length + 1}结果`;
        steps.push({ target, sacrifice, result, cost });

        pool[w] = result;
        pool.splice(sacrificeIdx, 1);
      } else {
        // Weapon is NOT at current penalty level - merge two books/items
        const target = pool[begin];
        const sacrifice = pool[begin + 1];
        const { result, cost } = preForge(target, sacrifice, isJava, ignorePenalty);
        result.id = newItemId();
        result.label = `步骤${steps.length + 1}结果`;
        steps.push({ target, sacrifice, result, cost });

        pool[begin + 1] = result;
        pool.splice(begin, 1);
      }
    } else {
      // Mode 1: merge first two sorted items; weapon as target only when at pos 0 or 1
      const w = findWeaponIndex(pool);
      let targetIdx: number, sacrificeIdx: number;

      if (w === 1) {
        targetIdx = 1; // weapon at position 1
        sacrificeIdx = 0;
      } else {
        targetIdx = 0; // weapon at 0 or elsewhere
        sacrificeIdx = 1;
      }

      const target = pool[targetIdx];
      const sacrifice = pool[sacrificeIdx];
      const { result, cost } = preForge(target, sacrifice, isJava, ignorePenalty);
      result.id = newItemId();
      result.label = `步骤${steps.length + 1}结果`;
      steps.push({ target, sacrifice, result, cost });

      // Always replace at position 0 and remove position 1 (matching reference)
      pool[0] = result;
      pool.splice(1, 1);

      // Check if any penalty level has 2+ items to switch back to mode 0
      const maxPen = pool.length > 0 ? Math.max(...pool.map(p => p.penalty)) : 0;
      for (let i = 0; i < maxPen; i++) {
        const range = penaltyRange(pool, i);
        if (range.begin !== -1 && range.end - range.begin > 0) {
          curPenalty = i;
          mode = 0;
          break;
        }
      }
    }
  }

  const totalCost = steps.reduce((sum, s) => sum + s.cost, 0);
  return { steps, totalCost, tooExpensive: checkTooExpensive(steps, isJava) };
}

/**
 * Hamming algorithm - reference: Dinosaur-MC/BestEnchSeq
 *
 * Uses penalty-level grouping and Hamming weight arrangement for optimal
 * binary tree merge order. Higher-cost items are placed at lower Hamming
 * weight positions so they get merged at optimal points in the tree.
 */
export function calcHamming(
  weapon: Item,
  targetEnchantments: EnchantLevel[],
  isJava: boolean,
  ignorePenalty: boolean = false
): CalcResult {
  itemCounter = 0;
  const pool = buildPool(weapon, targetEnchantments);
  const steps: ForgeStep[] = [];

  if (pool.length <= 1) {
    return { steps, totalCost: 0, tooExpensive: false };
  }

  // Phase 1+2: Build merge structure grouped by penalty level
  let mP = 0;
  for (const item of pool) mP = Math.max(mP, item.penalty);

  // tmTriangle: working copy for simulation; triangle: arranged items for recording steps
  const tmTriangle: Item[][] = Array.from({ length: mP + 1 }, () => []);
  for (const item of pool) tmTriangle[item.penalty].push(item);

  const triangle: Item[][] = [];

  for (let i = 0; i < tmTriangle.length; i++) {
    // Ensure triangle has level i
    while (i > triangle.length - 1) triangle.push([]);

    const n = tmTriangle[i].length;
    if (n === 0) continue;

    // Sort by sacrifice cost descending
    tmTriangle[i].sort((a, b) => calcSacrificeCost(b) - calcSacrificeCost(a));

    // Create arranged array
    const arranged: (Item | null)[] = new Array(n).fill(null);

    // Place weapon (non-book) at position 0
    const wIdx = tmTriangle[i].findIndex(it => !it.isBook);
    if (wIdx !== -1) {
      arranged[0] = tmTriangle[i].splice(wIdx, 1)[0];
    }

    // Place remaining items by Hamming weight order
    for (let hw = 1; hw < n; hw++) {
      const positions: number[] = [];
      for (let pos = 0; pos < n; pos++) {
        if (hammingWeight(pos) === hw) positions.push(pos);
      }
      if (positions.length === 0) break;
      for (const pos of positions) {
        if (tmTriangle[i].length === 0) break;
        if (arranged[pos] === null) {
          arranged[pos] = tmTriangle[i].shift()!;
        }
      }
    }

    // Fill any remaining nulls
    for (let pos = 0; pos < n; pos++) {
      if (arranged[pos] === null && tmTriangle[i].length > 0) {
        arranged[pos] = tmTriangle[i].shift()!;
      }
    }

    // Finalize arranged items (all nulls should be filled)
    triangle[i] = arranged.filter((item): item is Item => item !== null);

    // Copy arranged items back to working array
    tmTriangle[i] = [...triangle[i]];

    if (tmTriangle[i].length < 2) continue;

    // Phase 2: Merge pairs within this level (simulation)
    while (tmTriangle[i].length > 1) {
      const a = tmTriangle[i].shift()!;
      const b = tmTriangle[i].shift()!;
      const merged = forgeOnly(a, b, isJava);
      merged.id = newItemId();

      // Extend arrays if needed
      while (merged.penalty > tmTriangle.length - 1 || i + 1 > tmTriangle.length - 1) {
        tmTriangle.push([]);
      }

      if (!merged.isBook) {
        tmTriangle[i + 1].push(merged);
      } else {
        tmTriangle[merged.penalty].push(merged);
      }
    }

    // Carry odd item to next level
    if (tmTriangle[i].length > 0) {
      while (i >= tmTriangle.length - 1) tmTriangle.push([]);
      tmTriangle[i + 1].push(tmTriangle[i].shift()!);
    }
  }

  // Phase 3: Record forge steps from the arranged triangle
  for (let i = 0; i < triangle.length; i++) {
    while (triangle[i].length > 1) {
      const a = triangle[i].shift()!;
      const b = triangle[i].shift()!;
      const { result, cost } = preForge(a, b, isJava, ignorePenalty);
      result.id = newItemId();
      result.label = `步骤${steps.length + 1}结果`;
      steps.push({ target: a, sacrifice: b, result, cost });
    }
    if (triangle[i].length === 1 && i + 1 < triangle.length) {
      triangle[i + 1].push(triangle[i].shift()!);
    }
  }

  const totalCost = steps.reduce((sum, s) => sum + s.cost, 0);
  return { steps, totalCost, tooExpensive: checkTooExpensive(steps, isJava) };
}
