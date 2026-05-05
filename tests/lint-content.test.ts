import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';

const ROOT = join(__dirname, '..');
const SCAN_DIRS = ['src', 'functions'];
const SKIP_FILES = new Set([
  // Allows the lint test itself to mention banned phrases for matching.
  'lint-content.test.ts',
]);

const BANNED_PHRASES = [
  'free valuation',
  'hot market',
  'boom',
  'cash in',
  "don't miss out",
  'call now',
  'sell today',
  'guaranteed result',
  'massive demand',
];

const EMOJI_REGEX = /\p{Extended_Pictographic}/u;

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...walk(full));
    } else if (/\.(ts|tsx|css|html|sql)$/.test(entry) && !SKIP_FILES.has(entry)) {
      out.push(full);
    }
  }
  return out;
}

function userFacingStrings(source: string): string[] {
  // Extract characters between matched quotes (single, double, or backtick) — naive but
  // catches every string literal and JSX text node in our codebase.
  const out: string[] = [];
  const re = /(['"`])((?:\\.|(?!\1).)*?)\1/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source))) out.push(m[2]);
  // Also capture JSX text nodes (between > and <).
  const jsx = /(?<=>)[^<>{}\n]+(?=<)/g;
  let j: RegExpExecArray | null;
  while ((j = jsx.exec(source))) out.push(j[0]);
  return out;
}

describe('content lint', () => {
  const files = SCAN_DIRS.flatMap((d) => walk(join(ROOT, d)));

  test('no emojis in source', () => {
    for (const file of files) {
      const text = readFileSync(file, 'utf8');
      const match = text.match(EMOJI_REGEX);
      expect(match, `Emoji found in ${file}: ${match?.[0]}`).toBeNull();
    }
  });

  test('no exclamation marks in user-facing strings or JSX text', () => {
    for (const file of files) {
      const text = readFileSync(file, 'utf8');
      for (const s of userFacingStrings(text)) {
        expect(s.includes('!'), `Exclamation mark in ${file}: "${s}"`).toBe(false);
      }
    }
  });

  test('no banned phrases anywhere', () => {
    for (const file of files) {
      const text = readFileSync(file, 'utf8').toLowerCase();
      for (const phrase of BANNED_PHRASES) {
        expect(text.includes(phrase), `Banned phrase "${phrase}" found in ${file}`).toBe(false);
      }
    }
  });
});
