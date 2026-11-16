import { readFile } from 'node:fs/promises';
import path from 'node:path';

const applyEnv = (text) => {
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
    if (process.env[key] != null && process.env[key] !== '') continue;
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
};

export const loadSkillEnv = async (startDir) => {
  let dir = path.resolve(startDir);
  const root = path.parse(dir).root;
  while (true) {
    try {
      const text = await readFile(path.join(dir, '.cursor', 'skills', '.env'), 'utf8');
      applyEnv(text);
      return;
    } catch {
      // This directory has no skill env file. Keep walking toward the repo root.
    }
    if (dir === root) return;
    const parent = path.dirname(dir);
    if (parent === dir) return;
    dir = parent;
  }
};
