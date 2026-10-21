/**
 * scripts/audit-body-claims.ts
 *
 * Lists wording in the static copy that makes body, health or medical claims (see src/lib/dailyContentGuard.ts).
 * Read-only: it reports, it never edits. Exit code 1 if the static DAILY copy has any.
 *
 *   npx tsx scripts/audit-body-claims.ts
 */
import * as fs from 'fs';
import { findBodyClaims } from '../src/lib/dailyContentGuard';

const DAILY = [
  'src/lib/pulseSynthesis.ts',
  'src/lib/forecastEngine.ts',
  'src/lib/innerCircleDictionary.ts',
  'src/lib/dailyRitual.ts',
  'src/lib/transitBridge.ts',
  'src/lib/lensesPersonal.ts',
  'src/lib/currentMoon.ts',
  'src/lib/moonTransitions.ts',
  'src/pages/Triad.tsx',
  'src/components/DailyPulse.tsx',
  'src/components/DailyRitual.tsx',
  'src/components/ClimateGauge.tsx',
  'src/components/VoidIntervalSection.tsx',
  'src/components/GreatCycleSection.tsx',
  'src/components/LunarSignatureSection.tsx',
  'src/components/TransitDetailModal.tsx',
  'src/pages/Transit.tsx',
  'src/mocks/transitQueue.ts',
];

// Permanent reference copy (library articles, rituals, crystals, herbs): reported only, because it is not daily
// content and rewriting it is an editorial decision.
const PERMANENT = [
  'src/lib/zodiacDeepContent.ts',
  ...fs.readdirSync('src/content/library').map((f) => `src/content/library/${f}`),
  'src/content/campaigns/eclipseAug2026.ts',
];

const QUOTED = /(["'`])(?:(?!\1)[^\\]|\\.){25,}\1/g;

function scan(files: string[]): number {
  let n = 0;
  for (const file of files) {
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
    lines.forEach((line, i) => {
      // only quoted copy, not code or comments
      for (const str of line.match(QUOTED) ?? []) {
        const hits = findBodyClaims(str);
        if (hits.length) {
          n++;
          console.log(`${file}:${i + 1}  [${hits.join(', ')}]  ${str.slice(0, 110)}`);
        }
      }
    });
  }
  return n;
}

console.log('== Static daily copy (must be 0) ==');
const daily = scan(DAILY);
console.log(`${daily} line(s)\n`);

console.log('== Permanent library/reference copy (report only) ==');
const permanent = scan(PERMANENT);
console.log(`${permanent} line(s)`);

process.exitCode = daily > 0 ? 1 : 0;
