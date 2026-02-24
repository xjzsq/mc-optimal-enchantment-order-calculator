export interface Weapon {
  id: string;
  nameZh: string;
  nameEn: string;
  index: number;
}

export const WEAPONS: Weapon[] = [
  { id: 'sword', nameZh: '剑', nameEn: 'Sword', index: 0 },
  { id: 'pickaxe', nameZh: '镐', nameEn: 'Pickaxe', index: 1 },
  { id: 'axe', nameZh: '斧', nameEn: 'Axe', index: 2 },
  { id: 'shovel', nameZh: '铲', nameEn: 'Shovel', index: 3 },
  { id: 'hoe', nameZh: '锄', nameEn: 'Hoe', index: 4 },
  { id: 'helmet', nameZh: '头盔', nameEn: 'Helmet', index: 5 },
  { id: 'chestplate', nameZh: '胸甲', nameEn: 'Chestplate', index: 6 },
  { id: 'leggings', nameZh: '护腿', nameEn: 'Leggings', index: 7 },
  { id: 'boots', nameZh: '靴', nameEn: 'Boots', index: 8 },
  { id: 'bow', nameZh: '弓', nameEn: 'Bow', index: 9 },
  { id: 'crossbow', nameZh: '弩', nameEn: 'Crossbow', index: 10 },
  { id: 'trident', nameZh: '三叉戟', nameEn: 'Trident', index: 11 },
  { id: 'fishing_rod', nameZh: '钓鱼竿', nameEn: 'Fishing Rod', index: 12 },
  { id: 'mace', nameZh: '重锤', nameEn: 'Mace', index: 13 },
];
