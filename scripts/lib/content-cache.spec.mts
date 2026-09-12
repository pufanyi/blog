import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { InputDigests } from './content-cache.mts';

const repository = fileURLToPath(new URL('../../', import.meta.url));
const exec = promisify(execFile);

test('cached generation follows shared imports, repairs outputs, and prunes deleted posts', async (t) => {
  mkdirSync(join(repository, '.generated'), { recursive: true });
  const root = mkdtempSync(join(repository, '.generated/cache-test-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  cpSync(join(repository, 'configs'), join(root, 'configs'), { recursive: true });
  mkdirSync(join(root, 'content/posts/one/scripts'), { recursive: true });
  mkdirSync(join(root, 'content/posts/two'), { recursive: true });
  cpSync(join(repository, 'content/cv.yaml'), join(root, 'content/cv.yaml'));
  const source = '---\ntitle: Example\ndate: "2026-01-01"\n---\n\n';
  writeFileSync(join(root, 'content/posts/one/index.mdx'), `${source}<Example />\n`);
  writeFileSync(join(root, 'content/posts/two/index.mdx'), `${source}An independent post.\n`);
  writeFileSync(
    join(root, 'content/posts/one/scripts/example.post-component.tsx'),
    'import React from "react";\nimport { label } from "../../../../shared.ts";\nexport const POST_COMPONENTS = { Example: () => <p>{label}</p> };\n',
  );
  writeFileSync(join(root, 'shared.ts'), 'export { label } from "./nested.ts";\n');
  writeFileSync(join(root, 'nested.ts'), 'export const label = "First version";\n');
  async function generate(): Promise<{ rendered: number; cached: number }> {
    const { stdout } = await exec(
      process.execPath,
      [
        '--import',
        'tsx',
        '--input-type=module',
        '-e',
        `import { generateData } from './scripts/build-posts.mts'; console.log('STATS=' + JSON.stringify(await generateData(${JSON.stringify(root)})));`,
      ],
      {
        cwd: repository,
        env: { ...process.env, TSX_TSCONFIG_PATH: join(repository, 'tsconfig.scripts.json') },
      },
    );
    return JSON.parse(
      stdout
        .split('\n')
        .find((line) => line.startsWith('STATS='))!
        .slice(6),
    );
  }
  mkdirSync(join(root, 'docs'), { recursive: true });
  const docsNavigation = (pages: string[]) =>
    writeFileSync(
      join(root, 'docs/navigation.json'),
      JSON.stringify({
        sourceUrl: 'https://example.com/source',
        groups: [{ title: 'Guides', pages }],
      }),
    );
  docsNavigation(['index.md', 'extra.md']);
  writeFileSync(join(root, 'linked.ts'), '// Linked source.\n');
  writeFileSync(
    join(root, 'docs/index.md'),
    '# Handbook\n\nFirst documentation version.\n\n[Source](../linked.ts)\n',
  );
  writeFileSync(join(root, 'docs/extra.md'), '# Extra\n\nAn extra page.\n');
  assert.equal((await generate()).rendered, 2);
  assert.equal((await generate()).rendered, 0);
  rmSync(join(root, 'linked.ts'));
  await assert.rejects(generate(), /missing repository link/);
  writeFileSync(join(root, 'linked.ts'), '// Restored source.\n');
  const docOutput = join(root, '.generated/agent-content/docs/index.md');
  writeFileSync(join(root, 'docs/index.md'), '# Handbook\n\nSecond documentation version.\n');
  assert.equal((await generate()).rendered, 0);
  assert.match(readFileSync(docOutput, 'utf8'), /Second documentation version/);
  writeFileSync(join(root, 'docs/index.md'), '# Handbook\n\n[Broken](missing.md)\n');
  await assert.rejects(generate(), /missing repository link/);
  assert.match(readFileSync(docOutput, 'utf8'), /Second documentation version/);
  writeFileSync(join(root, 'docs/index.md'), '# Handbook\n\nRecovered.\n');
  rmSync(join(root, 'docs/extra.md'));
  docsNavigation(['index.md']);
  assert.equal((await generate()).rendered, 0);
  assert.throws(() => readFileSync(join(root, 'src/app/data/docs/extra.ts')), /ENOENT/);
  assert.throws(() => readFileSync(join(root, '.generated/agent-content/docs/extra.md')), /ENOENT/);
  writeFileSync(join(root, 'nested.ts'), 'export const label = "Second version";\n');
  const changed = await generate();
  assert.equal(changed.rendered, 1);
  assert.equal(changed.cached, 1);
  assert.match(readFileSync(join(root, 'src/app/data/posts/one.ts'), 'utf8'), /Second version/);
  const markdown = join(root, '.generated/agent-content/blog/one.md');
  const expected = readFileSync(markdown, 'utf8');
  writeFileSync(markdown, 'Corrupted output');
  assert.equal((await generate()).rendered, 0);
  assert.equal(readFileSync(markdown, 'utf8'), expected);
  writeFileSync(join(root, '.generated/content-cache/one.json'), '{invalid cache');
  rmSync(markdown);
  assert.equal((await generate()).rendered, 1);
  rmSync(join(root, 'content/posts/two'), { recursive: true });
  assert.equal((await generate()).rendered, 0);
  assert.throws(() => readFileSync(join(root, 'src/app/data/posts/two.ts')), /ENOENT/);
  assert.throws(() => readFileSync(join(root, '.generated/content-cache/two.json')), /ENOENT/);
});

test('MDX imports and cycles participate in dependency fingerprints', (t) => {
  mkdirSync(join(repository, '.generated'), { recursive: true });
  const root = mkdtempSync(join(repository, '.generated/dependencies-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const mdx = join(root, 'index.mdx');
  writeFileSync(mdx, 'import { value } from "./value.ts"\n\nMath $x_{i}$ and {value}\n');
  writeFileSync(join(root, 'value.ts'), 'import "./cycle.ts"; export const value = 1;');
  writeFileSync(join(root, 'cycle.ts'), 'import "./value.ts";');
  const before = new InputDigests().files([mdx], true);
  writeFileSync(join(root, 'value.ts'), 'import "./cycle.ts"; export const value = 2;');
  assert.notEqual(new InputDigests().files([mdx], true), before);
});
