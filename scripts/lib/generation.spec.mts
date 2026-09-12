import assert from 'node:assert/strict';
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  utimesSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { generateData } from '../build-posts.mts';

function outputs(root: string): Map<string, { content: string; mtime: number }> {
  const result = new Map<string, { content: string; mtime: number }>();
  function visit(directory: string): void {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) visit(path);
      else result.set(path, { content: readFileSync(path, 'utf8'), mtime: statSync(path).mtimeMs });
    }
  }
  visit(join(root, 'src/app/data'));
  visit(join(root, '.generated/agent-content'));
  return result;
}

test('no-op generation preserves outputs and late export failures retain the last successful corpus', async (t) => {
  const root = mkdtempSync(join(tmpdir(), 'blog-generation-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const repository = fileURLToPath(new URL('../../', import.meta.url));
  cpSync(join(repository, 'configs'), join(root, 'configs'), { recursive: true });
  mkdirSync(join(root, 'content/posts/example'), { recursive: true });
  cpSync(join(repository, 'content/cv.yaml'), join(root, 'content/cv.yaml'));
  const post = join(root, 'content/posts/example/index.mdx');
  const source =
    '---\ntitle: Example\ndate: "2026-01-01"\n---\n\n## Introduction\n\nA successful post.\n';
  writeFileSync(post, source);
  await generateData(root);
  const oldTime = new Date('2020-01-01');
  for (const path of outputs(root).keys()) utimesSync(path, oldTime, oldTime);
  const previous = outputs(root);
  await generateData(root);
  assert.deepEqual(outputs(root), previous);
  const config = join(root, 'configs/site.yaml');
  writeFileSync(
    config,
    readFileSync(config, 'utf8').replace(/^title:.*$/m, 'title: A changed site title'),
  );
  writeFileSync(post, `${source}\n<a href="http://[">An invalid export URL</a>\n`);
  await assert.rejects(generateData(root), /Invalid URL/);
  assert.deepEqual(outputs(root), previous);
});
