import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';

export interface GeneratedTree {
  directory: string;
  files: ReadonlyMap<string, string>;
}

function existingFiles(directory: string): string[] {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Generated output must not be a symlink: ${path}`);
    return entry.isDirectory() ? existingFiles(path) : [path];
  });
}

function pruneEmptyDirectories(directory: string): void {
  if (!existsSync(directory)) return;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const path = join(directory, entry.name);
    pruneEmptyDirectories(path);
    if (!readdirSync(path).length) rmSync(path, { recursive: true });
  }
}

/** Publish dedicated generated trees, preserving unchanged files and rolling back I/O failures. */
export function publishGeneratedFiles(trees: readonly GeneratedTree[]): {
  changed: number;
  removed: number;
} {
  const plans = trees.map(({ directory, files }) => {
    const root = resolve(directory);
    const desired = new Map<string, string>();
    for (const [path, content] of files) {
      const target = resolve(root, path);
      if (isAbsolute(path) || !target.startsWith(`${root}${sep}`)) {
        throw new Error(`Generated path escapes its output directory: ${path}`);
      }
      if (desired.has(target)) throw new Error(`Duplicate generated path: ${path}`);
      desired.set(target, content);
    }
    const existing = new Set(existingFiles(root));
    return {
      root,
      changed: [...desired].filter(
        ([path, content]) => !existing.has(path) || readFileSync(path, 'utf8') !== content,
      ),
      removed: [...existing].filter((path) => !desired.has(path)),
    };
  });
  const stages: string[] = [];
  const journal: { target: string; backup?: string }[] = [];
  try {
    // Stage every changed file before replacing any published file.
    const prepared = plans.map((plan) => {
      if (!plan.changed.length && !plan.removed.length) return { ...plan, stage: '' };
      mkdirSync(dirname(plan.root), { recursive: true });
      const stage = mkdtempSync(join(dirname(plan.root), `.${basename(plan.root)}-stage-`));
      stages.push(stage);
      for (const [target, content] of plan.changed) {
        const path = join(stage, 'next', relative(plan.root, target));
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, content);
      }
      return { ...plan, stage };
    });
    for (const plan of prepared) {
      for (const target of [...plan.changed.map(([path]) => path), ...plan.removed]) {
        mkdirSync(dirname(target), { recursive: true });
        const backup = existsSync(target)
          ? join(plan.stage, 'previous', relative(plan.root, target))
          : undefined;
        if (backup) {
          mkdirSync(dirname(backup), { recursive: true });
          renameSync(target, backup);
        }
        journal.push({ target, backup });
        const staged = join(plan.stage, 'next', relative(plan.root, target));
        if (existsSync(staged)) renameSync(staged, target);
      }
    }
  } catch (error) {
    for (const { target, backup } of journal.reverse()) {
      rmSync(target, { force: true });
      if (backup) renameSync(backup, target);
    }
    throw error;
  } finally {
    for (const stage of stages) rmSync(stage, { recursive: true, force: true });
  }
  for (const { root } of plans) pruneEmptyDirectories(root);
  return {
    changed: plans.reduce((sum, plan) => sum + plan.changed.length, 0),
    removed: plans.reduce((sum, plan) => sum + plan.removed.length, 0),
  };
}
