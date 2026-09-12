import { type ChildProcess, spawn } from 'node:child_process';
import { watch } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createBuildQueue } from './lib/build-queue.mts';

const root = fileURLToPath(new URL('..', import.meta.url));
const mode = process.argv[2];
if (mode !== 'serve' && mode !== 'build') throw new Error('Expected serve or build');
let angular: ChildProcess | undefined;
let closing = false;
const queue = createBuildQueue(
  async () => {
    // A fresh process also invalidates Node's module cache for authored TSX imports.
    await new Promise<void>((resolve, reject) => {
      const child = spawn(process.execPath, ['--import', 'tsx', 'scripts/build-posts.mts'], {
        cwd: root,
        stdio: 'inherit',
        env: { ...process.env, TSX_TSCONFIG_PATH: 'tsconfig.scripts.json' },
      });
      child.once('error', reject);
      child.once('exit', (code) =>
        code === 0 ? resolve() : reject(new Error(`Content generation exited with ${code}`)),
      );
    });
    if (!angular && !closing) {
      angular = spawn(
        process.execPath,
        [
          fileURLToPath(import.meta.resolve('@angular/cli/bin/ng.js')),
          ...(mode === 'serve'
            ? ['serve']
            : ['build', '--watch', '--configuration', 'development']),
          ...process.argv.slice(3),
        ],
        { cwd: root, stdio: 'inherit' },
      );
      angular.once('error', (error) => {
        console.error(error);
        void stop(1);
      });
      angular.once('exit', (code) => {
        if (!closing) void stop(code ?? 1);
      });
    }
  },
  (error) => console.error('Content was not updated; fix the source and save again.', error),
);
const watchers = ['content', 'configs', 'docs', 'scripts', 'src'].map((directory) =>
  watch(new URL(`../${directory}/`, import.meta.url), { recursive: true }, (_event, file) => {
    if (
      directory === 'src' &&
      (file === 'app/data' || file?.startsWith('app/data/') || file?.startsWith('app/.data-stage-'))
    )
      return;
    queue.request();
  }),
);
watchers.push(
  watch(root, (_event, file) => {
    if (file && /^(package\.json|pnpm-lock\.yaml|tsconfig(?:\.scripts)?\.json)$/.test(file))
      queue.request();
  }),
);
async function stop(code: number): Promise<void> {
  if (closing) return;
  closing = true;
  for (const watcher of watchers) watcher.close();
  const angularExited =
    angular && angular.exitCode === null
      ? new Promise<void>((resolve) => {
          angular!.once('exit', () => resolve());
          angular!.kill('SIGTERM');
        })
      : Promise.resolve();
  // Allow a current publish/rollback to finish before exiting.
  await Promise.all([queue.close(), angularExited]);
  process.exitCode = code;
}
process.once('SIGINT', () => {
  void stop(0);
});
process.once('SIGTERM', () => {
  void stop(0);
});
queue.request();
