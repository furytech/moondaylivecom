// src/test/transitBridge.test.ts
import { describe, it, expect } from 'vitest';
import {
  getTransitBridge,
  getTransitBridgeForSigns,
  getSignElement,
  getSignModality,
} from '../lib/transitBridge';

describe('Transit Bridge Generator (Layer 2)', () => {

  // ── Core function ──────────────────────────────────────────────────────────

  it('returns a non-empty string for valid inputs', () => {
    const bridge = getTransitBridge('water', 'cardinal', 'Gemini');
    expect(typeof bridge).toBe('string');
    expect(bridge.length).toBeGreaterThan(20);
  });

  it('bridge sentences reference the transiting element, not the sign name', () => {
    // Gemini is Air — sentence describes "Air Moon", not "Gemini Moon"
    const bridge = getTransitBridge('water', 'cardinal', 'Gemini');
    expect(bridge).toContain('Air');
  });

  it('returns empty string for unrecognized transit sign', () => {
    expect(getTransitBridge('water', 'cardinal', 'NotASign')).toBe('');
  });

  it('handles case-insensitive and whitespace-padded inputs', () => {
    // Case insensitive on transit sign
    const a = getTransitBridge('water', 'cardinal', 'gemini');
    const b = getTransitBridge('water', 'cardinal', 'Gemini');
    const c = getTransitBridge('water', 'cardinal', 'GEMINI');
    expect(a).toBe(b);
    expect(b).toBe(c);
    // Whitespace-padded element and modality
    const padded = getTransitBridge('  water  ' as any, '  cardinal  ' as any, 'Gemini');
    expect(padded).toBe(b);
    expect(padded.length).toBeGreaterThan(20);
  });

  // ── 48 variations ─────────────────────────────────────────────────────────

  it('all 48 element × modality × transit element combinations return sentences', () => {
    const elements   = ['fire', 'earth', 'air', 'water'] as const;
    const modalities = ['cardinal', 'fixed', 'mutable'] as const;
    // One representative sign per transit element
    const transitsByElement: Record<string, string> = {
      fire: 'Aries', earth: 'Taurus', air: 'Gemini', water: 'Cancer',
    };

    for (const el of elements) {
      for (const mod of modalities) {
        for (const [, transitSign] of Object.entries(transitsByElement)) {
          const bridge = getTransitBridge(el, mod, transitSign);
          expect(
              bridge.length,
              `${el}-${mod}-${transitSign} should return a sentence`,
          ).toBeGreaterThan(20);
        }
      }
    }
  });

  it('modality variations produce distinct sentences for the same element pairing', () => {
    const cardinal = getTransitBridge('water', 'cardinal', 'Gemini');
    const fixed    = getTransitBridge('water', 'fixed',    'Gemini');
    const mutable  = getTransitBridge('water', 'mutable',  'Gemini');

    // All three reference the transit element (Air), not each other
    [cardinal, fixed, mutable].forEach(b => {
      expect(b.length).toBeGreaterThan(20);
      expect(b).toContain('Air');
    });

    // All three are distinct — modality changes the sentence
    expect(cardinal).not.toBe(fixed);
    expect(fixed).not.toBe(mutable);
    expect(cardinal).not.toBe(mutable);
  });

  // ── getTransitBridgeForSigns ───────────────────────────────────────────────

  it('getTransitBridgeForSigns resolves sign names to element + modality', () => {
    // Cancer = water/cardinal, Gemini = air
    const bridge = getTransitBridgeForSigns('Cancer', 'Gemini');
    expect(bridge.length).toBeGreaterThan(20);
    expect(bridge).toContain('Air');
    // Must be identical to the direct call with pre-resolved values
    expect(bridge).toBe(getTransitBridge('water', 'cardinal', 'Gemini'));
  });

  it('getTransitBridgeForSigns returns empty string for unrecognized signs', () => {
    expect(getTransitBridgeForSigns('NotASign', 'Gemini')).toBe('');
    expect(getTransitBridgeForSigns('Cancer', 'NotASign')).toBe('');
  });

  it('getTransitBridgeForSigns covers all 12 natal signs without throwing', () => {
    const allSigns = [
      'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
      'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
    ];
    for (const sign of allSigns) {
      const bridge = getTransitBridgeForSigns(sign, 'Scorpio');
      expect(
          bridge.length,
          `${sign} natal + Scorpio transit should return a sentence`,
      ).toBeGreaterThan(20);
    }
  });

  // ── getSignElement ─────────────────────────────────────────────────────────

  it('getSignElement maps all 12 signs to their correct element', () => {
    expect(getSignElement('Aries')).toBe('fire');
    expect(getSignElement('Leo')).toBe('fire');
    expect(getSignElement('Sagittarius')).toBe('fire');
    expect(getSignElement('Taurus')).toBe('earth');
    expect(getSignElement('Virgo')).toBe('earth');
    expect(getSignElement('Capricorn')).toBe('earth');
    expect(getSignElement('Gemini')).toBe('air');
    expect(getSignElement('Libra')).toBe('air');
    expect(getSignElement('Aquarius')).toBe('air');
    expect(getSignElement('Cancer')).toBe('water');
    expect(getSignElement('Scorpio')).toBe('water');
    expect(getSignElement('Pisces')).toBe('water');
    expect(getSignElement('NotASign')).toBeNull();
  });

  // ── getSignModality ────────────────────────────────────────────────────────

  it('getSignModality maps all 12 signs to their correct modality', () => {
    // Cardinal
    expect(getSignModality('Aries')).toBe('cardinal');
    expect(getSignModality('Cancer')).toBe('cardinal');
    expect(getSignModality('Libra')).toBe('cardinal');
    expect(getSignModality('Capricorn')).toBe('cardinal');
    // Fixed
    expect(getSignModality('Taurus')).toBe('fixed');
    expect(getSignModality('Leo')).toBe('fixed');
    expect(getSignModality('Scorpio')).toBe('fixed');
    expect(getSignModality('Aquarius')).toBe('fixed');
    // Mutable
    expect(getSignModality('Gemini')).toBe('mutable');
    expect(getSignModality('Virgo')).toBe('mutable');
    expect(getSignModality('Sagittarius')).toBe('mutable');
    expect(getSignModality('Pisces')).toBe('mutable');
    expect(getSignModality('NotASign')).toBeNull();
  });
});
