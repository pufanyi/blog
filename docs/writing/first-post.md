# Your first post

An article is a directory containing `index.mdx`, optional references, and its own assets. You can write ordinary Markdown first and add diagrams or browser interaction only when the explanation needs them.

## Prepare the preview

Use the Node version in [`.nvmrc`](../../.nvmrc) and the pnpm version declared in [`package.json`](../../package.json). From the repository root:

```bash
pnpm install --frozen-lockfile
pnpm start
```

Open `http://localhost:4200/`. Keep this command running while editing; it watches content, configuration, documentation, and post-local components. Wait for successful generation and Angular compilation before refreshing. A failed edit is reported in the terminal and leaves the last successful generated content available.

See [local development](../development.md) for tooling details and [browser troubleshooting](../browser-troubleshooting.md) for unusual Linux hosts.

## Create the article directory

For example, create `content/posts/notes/example/index.mdx`:

```mdx
---
title: An example article
date: "2026-09-12"
description: A short explanation of the problem this article solves.
---

Introduce the question and what the reader will learn.

## The idea

Explain the mechanism with a concrete example.

## An example

Show the result and explain what it means.
```

The directory path becomes the slug `notes/example` and the URL `/blog/notes/example`. Its folders appear automatically in `/blog/contents`; there is no separate category registration. Use letters, digits, `_`, and `-` in path segments. Top-level `page` and `contents`, and the article basename `index`, are reserved.

A category directory contains child categories or article directories. Keep supporting files inside an article directory, where discovery stops at `index.mdx`. Do not put notes, backups, or an `AGENTS.md` inside category directories.

## Front matter reference

| Field | Required | Meaning |
| --- | --- | --- |
| `title` | Yes | Article title; the page supplies the main heading |
| `date` | Yes | Publication date as a quoted `YYYY-MM-DD` string |
| `description` | No | Metadata, search, feed, and Markdown description |
| `updated` | No | Known substantive update date, on or after publication |
| `coverImage` | No | Optional sharing/article image, such as `./images/cover.avif` |
| `draft` | No | Boolean; `true` removes the article from generated article routes and indexes |

Unknown fields and invalid dates fail generation. The archive excerpt comes from opening prose rather than `description`, so make the opening paragraph useful on its own. Do not insert another level-one heading into the body.

## Preview and publish

Open the article's URL directly, check its category and archive entry, and inspect the generated Markdown at `/blog/notes/example.md`. Check a narrow screen and both themes, especially after adding figures, tables, or formulas. Follow the full [publishing checklist](publishing.md) before committing.

Drafts are omitted from article HTML, search, feeds, and Markdown exports. **Draft status is not an asset privacy boundary**: eligible files inside `content/posts` are still copied by the asset pipeline. Keep confidential drafts and private attachments outside published asset directories.
