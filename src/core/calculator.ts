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
function calcSacrificeCost(item: Item, isJava: boolean): number {
  let cost = 0;
  for (const e of item.enchantments) {
    const data = getEnchantById(e.enchantmentId);
    if (!data) continue;
    const multiplier = item.isBook ? data.bookMultiplier : data.itemMultiplier;
    cost += multiplier * e.level;
  }
  // For Java edition, include penalty in sacrifice cost for sorting purposes
  if (!isJava) return cost;
  return cost;
}

/** Forge two items and return the resulting item (without cost calculation) */
function forgeItems(target: Item, sacrifice: Item): Item {
  const resultEnchantments: EnchantLevel[] = [...target.enchantments];

  for (const bEnch of sacrifice.enchantments) {
    const bEnchData = getEnchantById(bEnch.enchantmentId);
    if (!bEnchData) continue;

    const conflictsWithTarget = target.enchantments.some(aEnch =>
      hasConflict(bEnch.enchantmentId, aEnch.enchantmentId) ||
      hasConflict(aEnch.enchantmentId, bEnch.enchantmentId)
    );

    if (conflictsWithTarget) continue;

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
      resultEnchantments[existingIdx] = { enchantmentId: bEnch.enchantmentId, level: combinedLevel };
    } else {
      resultEnchantments.push({ enchantmentId: bEnch.enchantmentId, level: bEnch.level });
    }
  }

  return {
    id: '',
    label: '',
    isBook: target.isBook,
    enchantments: resultEnchantments,
    penalty: Math.max(target.penalty, sacrifice.penalty) + 1,
  };
}

export function preForge(
  target: Item,
  sacrifice: Item,
  isJava: boolean
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
  cost += penaltyCost(target.penalty) + penaltyCost(sacrifice.penalty);

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

/** Sort pool: by penalty ascending, then by enchant cost descending for books */
function sortPool(pool: Item[], isJava: boolean): void {
  pool.sort((a, b) => {
    if (a.penalty !== b.penalty) return a.penalty - b.penalty;
    // Within same penalty, sort by sacrifice cost descending
    // But keep weapon (non-book) in place by treating it as highest priority
    if (!a.isBook && b.isBook) return 0;
    if (a.isBook && !b.isBook) return 0;
    if (!a.isBook && !b.isBook) return 0;
    // Both books: sort by cost descending
    return calcSacrificeCost(b, isJava) - calcSacrificeCost(a, isJava);
  });
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

/**
 * DifficultyFirst algorithm - reference: Dinosaur-MC/BestEnchSeq
 *
 * Key principles:
 * 1. Merge items at the same penalty level first (minimizes penalty costs)
 * 2. Higher-cost items are merged as sacrifices first (when penalty is low)
 * 3. Weapon is ALWAYS the target (left side of anvil)
 * 4. When no same-penalty pairs exist, merge remaining items with weapon as target
 */
export function calcDifficultyFirst(
  weapon: Item,
  targetEnchantments: EnchantLevel[],
  isJava: boolean
): CalcResult {
  itemCounter = 0;
  const pool = buildPool(weapon, targetEnchantments);
  const steps: ForgeStep[] = [];

  let curPenalty = pool[0].penalty; // Start with weapon's penalty
  let mode = 0;

  while (pool.length > 1) {
    sortPool(pool, isJava);
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
        // Merge weapon (target) + first non-weapon at curPenalty (sacrifice)
        let sacrificeIdx = begin;
        if (w === begin) sacrificeIdx = begin + 1;

        const target = pool[w];
        const sacrifice = pool[sacrificeIdx];
        const { result, cost } = preForge(target, sacrifice, isJava);
        result.id = newItemId();
        result.label = `步骤${steps.length + 1}结果`;
        result.isBook = target.isBook;
        steps.push({ target, sacrifice, result, cost });

        // Replace weapon with result, remove sacrifice
        pool[w] = result;
        pool.splice(sacrificeIdx, 1);
      } else {
        // Weapon is NOT at current penalty level
        // Merge two items at curPenalty (first = target, second = sacrifice)
        const target = pool[begin];
        const sacrifice = pool[begin + 1];
        const { result, cost } = preForge(target, sacrifice, isJava);
        result.id = newItemId();
        result.label = `步骤${steps.length + 1}结果`;
        result.isBook = target.isBook;
        steps.push({ target, sacrifice, result, cost });

        // Replace second item with result, remove first
        pool[begin + 1] = result;
        pool.splice(begin, 1);
      }
    } else {
      // Mode 1: merge remaining items, weapon always as target
      const w = findWeaponIndex(pool);
      let targetIdx: number, sacrificeIdx: number;

      if (w === 1) {
        targetIdx = 1; // weapon
        sacrificeIdx = 0;
      } else {
        targetIdx = 0; // weapon (at 0 or weapon not found, use 0)
        sacrificeIdx = 1;
      }

      const target = pool[targetIdx];
      const sacrifice = pool[sacrificeIdx];
      const { result, cost } = preForge(target, sacrifice, isJava);
      result.id = newItemId();
      result.label = `步骤${steps.length + 1}结果`;
      result.isBook = target.isBook;
      steps.push({ target, sacrifice, result, cost });

      // Keep result at lower index, remove higher index
      const minIdx = Math.min(targetIdx, sacrificeIdx);
      const maxIdx = Math.max(targetIdx, sacrificeIdx);
      pool[minIdx] = result;
      pool.splice(maxIdx, 1);

      // Check if any penalty level has 2+ items to switch back to mode 0
      const maxPen = pool.length > 0 ? Math.max(...pool.map(p => p.penalty)) : 0;
      for (let i = 0; i <= maxPen; i++) {
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
  return { steps, totalCost };
}

/**
 * Hamming algorithm - reference: Dinosaur-MC/BestEnchSeq
 *
 * Uses Hamming weight to arrange items in a binary tree structure
 * ensuring optimal merging order. High-cost items are placed at
 * positions with low Hamming weight so they get merged first.
 */
export function calcHamming(
  weapon: Item,
  targetEnchantments: EnchantLevel[],
  isJava: boolean
): CalcResult {
  itemCounter = 0;
  const pool = buildPool(weapon, targetEnchantments);
  const steps: ForgeStep[] = [];

  if (pool.length <= 1) {
    return { steps, totalCost: 0 };
  }

  // Group items by penalty level
  let maxPenalty = 0;
  for (const item of pool) {
    maxPenalty = Math.max(maxPenalty, item.penalty);
  }

  const levels: Item[][] = [];
  for (let i = 0; i <= maxPenalty; i++) {
    levels.push([]);
  }
  for (const item of pool) {
    levels[item.penalty].push(item);
  }

  // Sort each level by sacrifice cost descending
  for (const level of levels) {
    level.sort((a, b) => calcSacrificeCost(b, isJava) - calcSacrificeCost(a, isJava));
  }

  // Arrange items using Hamming weight for optimal binary tree merging
  const arranged: Item[][] = [];
  for (let i = 0; i < levels.length; i++) {
    arranged.push([]);
    const n = levels[i].length;
    if (n === 0) continue;

    const tempItems = [...levels[i]];
    const result: (Item | null)[] = new Array(n).fill(null);

    // Place weapon at position 0
    const weaponIdx = tempItems.findIndex(item => !item.isBook);
    if (weaponIdx !== -1) {
      result[0] = tempItems.splice(weaponIdx, 1)[0];
    }

    // Place remaining items by Hamming weight order
    for (let hw = weaponIdx !== -1 ? 1 : 0; hw < n && tempItems.length > 0; hw++) {
      for (let pos = 0; pos < n && tempItems.length > 0; pos++) {
        if (result[pos] !== null) continue;
        if (hammingWeight(pos) === hw) {
          result[pos] = tempItems.shift()!;
        }
      }
    }

    // Fill any remaining gaps
    for (let pos = 0; pos < n && tempItems.length > 0; pos++) {
      if (result[pos] === null) {
        result[pos] = tempItems.shift()!;
      }
    }

    levels[i] = result.filter((item): item is Item => item !== null);

    // Merge pairs within this level, carry results to next level
    while (levels[i].length > 1) {
      const a = levels[i].shift()!;
      const b = levels[i].shift()!;
      const merged = forgeItems(a, b);
      merged.id = newItemId();

      // Ensure levels array is large enough
      while (levels.length <= i + 1 || levels.length <= merged.penalty) {
        levels.push([]);
      }

      if (!merged.isBook) {
        // Weapon result goes to next level
        levels[i + 1].push(merged);
      } else {
        // Book result goes to its penalty level
        levels[merged.penalty].push(merged);
      }
    }

    // If one item left, carry to next level
    if (levels[i].length === 1) {
      while (levels.length <= i + 1) {
        levels.push([]);
      }
      levels[i + 1].push(levels[i].shift()!);
    }

    arranged[i] = result.filter((item): item is Item => item !== null);
  }

  // Record actual forge steps from the arranged triangle
  for (let i = 0; i < arranged.length; i++) {
    while (arranged[i].length > 1) {
      const a = arranged[i].shift()!;
      const b = arranged[i].shift()!;
      const { result, cost } = preForge(a, b, isJava);
      result.id = newItemId();
      result.label = `步骤${steps.length + 1}结果`;
      result.isBook = a.isBook;
      steps.push({ target: a, sacrifice: b, result, cost });
    }
    if (arranged[i].length === 1 && i + 1 < arranged.length) {
      arranged[i + 1].unshift(arranged[i].shift()!);
    }
  }

  const totalCost = steps.reduce((sum, s) => sum + s.cost, 0);
  return { steps, totalCost };
}

/** Calculate the Hamming weight (number of 1 bits) of a non-negative integer */
function hammingWeight(n: number): number {
  let count = 0;
  while (n > 0) {
    if (n % 2 === 1) count++;
    n = Math.floor(n / 2);
  }
  return count;
}
