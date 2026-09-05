import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkLintNoUndefinedReferences from 'remark-lint-no-undefined-references';
import remarkMath from 'remark-math';
import remarkMdx from 'remark-mdx';
import remarkPresetLintConsistent from 'remark-preset-lint-consistent';
import remarkPresetLintRecommended from 'remark-preset-lint-recommended';
import type { Preset } from 'unified';

export default {
  plugins: [
    remarkFrontmatter,
    remarkGfm,
    remarkMath,
    remarkMdx,
    remarkPresetLintConsistent,
    remarkPresetLintRecommended,
    // Pandoc citations (`[@key]`) and rehype-citation's `[^ref]` placeholder
    // intentionally look like unresolved Markdown references at this stage.
    [remarkLintNoUndefinedReferences, false],
  ],
} satisfies Preset;
