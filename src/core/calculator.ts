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
    isBook: false,
    enchantments: resultEnchantments,
    penalty: resultPenalty,
  };

  return { result, cost };
}

let itemCounter = 0;
function newItemId(): string {
  return `item_${++itemCounter}`;
}

export function calcDifficultyFirst(
  weapon: Item,
  targetEnchantments: EnchantLevel[],
  isJava: boolean
): CalcResult {
  itemCounter = 0;
  // Pool: weapon + individual enchanted books
  const pool: Item[] = [
    { ...weapon, id: newItemId() },
    ...targetEnchantments.map(e => ({
      id: newItemId(),
      label: '',
      isBook: true,
      enchantments: [e],
      penalty: 0,
    })),
  ];

  const steps: ForgeStep[] = [];

  while (pool.length > 1) {
    // Sort by penalty ascending
    pool.sort((a, b) => a.penalty - b.penalty);

    // Find items to merge: target = first (lowest penalty), sacrifice = highest cost book among same penalty
    const targetIdx = 0; // first item (lowest penalty)

    // Find best sacrifice: among remaining items, pick highest enchant cost
    let bestSacrificeIdx = -1;
    let bestSacrificeCost = -1;

    for (let i = 1; i < pool.length; i++) {
      const { cost } = preForge(pool[targetIdx], pool[i], isJava);
      if (cost > bestSacrificeCost) {
        bestSacrificeCost = cost;
        bestSacrificeIdx = i;
      }
    }

    if (bestSacrificeIdx < 0) bestSacrificeIdx = 1;

    const target = pool[targetIdx];
    const sacrifice = pool[bestSacrificeIdx];
    const { result, cost } = preForge(target, sacrifice, isJava);

    result.id = newItemId();
    result.label = `步骤${steps.length + 1}结果`;

    steps.push({ target, sacrifice, result, cost });

    pool.splice(Math.max(targetIdx, bestSacrificeIdx), 1);
    pool.splice(Math.min(targetIdx, bestSacrificeIdx), 1);
    pool.push(result);
  }

  const totalCost = steps.reduce((sum, s) => sum + s.cost, 0);
  return { steps, totalCost };
}

export function calcHamming(
  weapon: Item,
  targetEnchantments: EnchantLevel[],
  isJava: boolean
): CalcResult {
  itemCounter = 0;
  // Group items into levels for binary-tree merging
  const allItems: Item[] = [
    { ...weapon, id: newItemId() },
    ...targetEnchantments.map(e => ({
      id: newItemId(),
      label: '',
      isBook: true,
      enchantments: [e],
      penalty: 0,
    })),
  ];

  const steps: ForgeStep[] = [];

  // Build binary tree bottom-up
  let currentLevel = allItems;

  while (currentLevel.length > 1) {
    const nextLevel: Item[] = [];
    // Pair items: merge pairs
    for (let i = 0; i < currentLevel.length; i += 2) {
      if (i + 1 < currentLevel.length) {
        const target = currentLevel[i];
        const sacrifice = currentLevel[i + 1];
        const { result, cost } = preForge(target, sacrifice, isJava);
        result.id = newItemId();
        result.label = `步骤${steps.length + 1}结果`;
        steps.push({ target, sacrifice, result, cost });
        nextLevel.push(result);
      } else {
        // Odd item out, carry to next level
        nextLevel.push(currentLevel[i]);
      }
    }
    currentLevel = nextLevel;
  }

  const totalCost = steps.reduce((sum, s) => sum + s.cost, 0);
  return { steps, totalCost };
}
