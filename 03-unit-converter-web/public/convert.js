export const UNITS = {
  length: ['mm', 'cm', 'm', 'km', 'in', 'ft', 'yd', 'mi'],
  weight: ['mg', 'g', 'kg', 'oz', 'lb'],
  temperature: ['C', 'F', 'K'],
};

const FACTORS = {
  mm: 0.001, cm: 0.01, m: 1, km: 1000, in: 0.0254, ft: 0.3048, yd: 0.9144, mi: 1609.344,
  mg: 0.001, g: 1, kg: 1000, oz: 28.349523125, lb: 453.59237,
};

const TO_C = { C: (v) => v, F: (v) => (v - 32) * 5 / 9, K: (v) => v - 273.15 };
const FROM_C = { C: (v) => v, F: (v) => v * 9 / 5 + 32, K: (v) => v + 273.15 };

const familyOf = (unit) => {
  const family = Object.keys(UNITS).find((f) => UNITS[f].includes(unit));
  if (!family) throw new Error(`Unknown unit: ${unit}`);
  return family;
};

export function convert(value, from, to) {
  const family = familyOf(from);
  if (familyOf(to) !== family) throw new Error(`Cannot convert ${from} to ${to}`);
  if (from === to) return value;
  if (family === 'temperature') return FROM_C[to](TO_C[from](value));
  return value * FACTORS[from] / FACTORS[to];
}
