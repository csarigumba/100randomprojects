import { test } from 'node:test';
import assert from 'node:assert/strict';
import { UNITS, convert, formatConversion } from '../public/convert.js';

const near = (actual, expected) =>
  assert.ok(Math.abs(actual - expected) <= 1e-9 * Math.max(1, Math.abs(expected)), `${actual} != ${expected}`);

test('UNITS lists every family', () => {
  assert.deepEqual(UNITS, {
    length: ['mm', 'cm', 'm', 'km', 'in', 'ft', 'yd', 'mi'],
    weight: ['mg', 'g', 'kg', 'oz', 'lb'],
    temperature: ['C', 'F', 'K'],
  });
});

test('every pair in every family round-trips and same unit is identity', () => {
  for (const units of Object.values(UNITS)) {
    for (const a of units) {
      for (const b of units) {
        near(convert(convert(12.5, a, b), b, a), 12.5);
      }
      assert.equal(convert(7.25, a, a), 7.25);
    }
  }
});

test('length known values', () => {
  near(convert(1, 'in', 'cm'), 2.54);
  near(convert(1, 'ft', 'm'), 0.3048);
  near(convert(1, 'yd', 'm'), 0.9144);
  near(convert(1, 'mi', 'm'), 1609.344);
  near(convert(1, 'km', 'm'), 1000);
  near(convert(1, 'm', 'cm'), 100);
  near(convert(1, 'cm', 'mm'), 10);
  near(convert(1, 'ft', 'in'), 12);
  near(convert(1, 'mi', 'ft'), 5280);
});

test('weight known values', () => {
  near(convert(1, 'lb', 'oz'), 16);
  near(convert(1, 'kg', 'g'), 1000);
  near(convert(1, 'g', 'mg'), 1000);
  near(convert(1, 'oz', 'g'), 28.349523125);
  near(convert(1, 'lb', 'kg'), 0.45359237);
});

test('temperature formulas', () => {
  near(convert(100, 'C', 'F'), 212);
  near(convert(0, 'C', 'F'), 32);
  near(convert(-40, 'C', 'F'), -40);
  near(convert(-40, 'F', 'C'), -40);
  near(convert(0, 'C', 'K'), 273.15);
  near(convert(0, 'K', 'F'), -459.67);
  near(convert(212, 'F', 'K'), 373.15);
  near(convert(373.15, 'K', 'C'), 100);
});

test('throws on unknown unit', () => {
  assert.throws(() => convert(1, 'parsec', 'm'), Error);
  assert.throws(() => convert(1, 'm', 'parsec'), Error);
});

test('throws on cross-family conversion', () => {
  assert.throws(() => convert(1, 'm', 'kg'), Error);
  assert.throws(() => convert(1, 'C', 'g'), Error);
});

test('formatConversion rejects non-numbers', () => {
  for (const raw of ['abc', '', '  ']) assert.throws(() => formatConversion(raw, 'C', 'F'), { message: 'Enter a number' });
});

test('formatConversion formats rounded result with unit', () => {
  assert.equal(formatConversion('-40', 'C', 'F'), '-40 F');
  assert.equal(formatConversion('100', 'C', 'F'), '212 F');
  assert.equal(formatConversion('1', 'ft', 'm'), '0.3048 m');
});
