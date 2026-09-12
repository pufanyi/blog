# Blog handbook

This handbook explains how to write for this blog, develop its application, and keep it maintainable. The Markdown files in `docs/` are also the source of the documentation published at `/docs`.

## For blog authors

Start with [your first post](writing/first-post.md), then use the references for [Markdown and math](writing/markdown.md), [images, diagrams, and embeds](writing/media.md), and [citations](writing/references.md). The [publishing checklist](writing/publishing.md) covers previewing, updates, and moving an existing article.

Authors importing old material should also read [content migrations](content-migrations.md). The ML Revisited series has additional [editorial principles](ml-editorial.md).

## For developers

Follow [local development](development.md) to install the pinned toolchain and start the watcher. Read [architecture](architecture.md) before changing generation or browser lifecycles. Use [configuration](configuration.md), [testing](testing.md), and [deployment](deployment.md) for the corresponding workflows.

[Maintaining documentation](documentation.md) explains which pages to update with a code change, how the documentation site works, and how to add a page. [Dependency policy](dependencies.md) records upgrade constraints; [browser troubleshooting](browser-troubleshooting.md) covers host-specific setup problems.

## Where things live

| Source | Purpose | Edited by |
| --- | --- | --- |
| `content/posts/<slug>/index.mdx` | Article prose and front matter | Authors |
| Article assets, `styles.css`, and `scripts/` | Images, diagrams, and interactive examples | Authors and developers |
| `content/cv.yaml` | Profile and CV content | Authors |
| `configs/` | Site, archive, comments, and redirect settings | Maintainers |
| `docs/` | This handbook and maintenance records | Everyone changing the project |
| `src/app/` excluding `data/` | Angular routes, components, and browser behavior | Developers |
| `scripts/` | Content generation, validation, and deployment preparation | Developers |
| `src/app/data/`, `.generated/`, and `dist/` | Generated modules, exports, and production output | Build tools only |

## Reading maintenance records

The [ordered maintenance tasks](maintenance/tasks.md) explain the completed six-dimension review and its validation. The [original audit](audits/2026-09-12-maintainability.md) is a historical snapshot: its findings describe the code before those fixes. Use the current developer guides for present behavior and the records to understand decisions, measurements, and known tradeoffs.

## Documentation and changes

Update the relevant guide in the same change as code, configuration, or authoring behavior. Local development regenerates documentation when saved; production publishes it with the next site deployment. There is no separate copy of the prose and no separate documentation deployment.
