export interface Weapon {
  id: string;
  nameZh: string;
  nameEn: string;
  index: number;
  icon: string;
}

export const WEAPONS: Weapon[] = [
  { id: 'sword', nameZh: '剑', nameEn: 'Sword', index: 0, icon: '⚔️' },
  { id: 'pickaxe', nameZh: '镐', nameEn: 'Pickaxe', index: 1, icon: '⛏️' },
  { id: 'axe', nameZh: '斧', nameEn: 'Axe', index: 2, icon: '🪓' },
  { id: 'shovel', nameZh: '铲', nameEn: 'Shovel', index: 3, icon: '🪏' },
  { id: 'hoe', nameZh: '锄', nameEn: 'Hoe', index: 4, icon: '🌾' },
  { id: 'helmet', nameZh: '头盔', nameEn: 'Helmet', index: 5, icon: '⛑️' },
  { id: 'chestplate', nameZh: '胸甲', nameEn: 'Chestplate', index: 6, icon: '👕' },
  { id: 'leggings', nameZh: '护腿', nameEn: 'Leggings', index: 7, icon: '👖' },
  { id: 'boots', nameZh: '靴', nameEn: 'Boots', index: 8, icon: '👢' },
  { id: 'bow', nameZh: '弓', nameEn: 'Bow', index: 9, icon: '🏹' },
  { id: 'crossbow', nameZh: '弩', nameEn: 'Crossbow', index: 10, icon: '🎯' },
  { id: 'trident', nameZh: '三叉戟', nameEn: 'Trident', index: 11, icon: '🔱' },
  { id: 'fishing_rod', nameZh: '钓鱼竿', nameEn: 'Fishing Rod', index: 12, icon: '🎣' },
  { id: 'mace', nameZh: '重锤', nameEn: 'Mace', index: 13, icon: '🔨' },
];
