const ROMAN_NUMERALS = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

export function toRoman(num: number): string {
  if (num >= 1 && num < ROMAN_NUMERALS.length) return ROMAN_NUMERALS[num];
  return String(num);
}
