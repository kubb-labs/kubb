---
layout: doc
title: Extension docs - The docs folder kubb.dev renders
description: "Reference for the docs folder a Kubb plugin, adapter, or parser ships on npm: the files kubb.dev renders, titles, guide ids, and the Markdown."
outline:
  - 2
  - 3
order: 16
navigation:
  title: Extension docs
  icon: i-iconoir-book
---

# Extension docs

An extension ships its docs in a `docs/` folder at the package root, next to its [manifest](/docs/5.x/reference/kit/manifest). The [registry](/docs/5.x/reference/registry#detail) reads it from the pinned version's npm tarball or GitHub release, and kubb.dev renders it under `/extensions/<owner>/<slug>`.

> [!IMPORTANT]
> Add `docs` to `files` in `package.json`, so npm ships it.

## Files

| File                  | Page on kubb.dev                         | Required |
| --------------------- | ---------------------------------------- | -------- |
| `docs/overview.md`    | `/extensions/<owner>/<slug>`             | Yes      |
| `docs/options.md`     | `/extensions/<owner>/<slug>/options`     | No       |
| `docs/guides/<id>.md` | `/extensions/<owner>/<slug>/guides/<id>` | No       |

The registry ignores other files and skips a file larger than 256 KiB.

## Title and description

Start each file with a `#` title on its first line, with no frontmatter. The first paragraph after the title is the description, which kubb.dev also uses as the meta description.

## Guides

| Rule            | Detail                                                                     |
| --------------- | -------------------------------------------------------------------------- |
| File name       | Kebab case, such as `base-url.md`. The id drops the `.md`.                 |
| Order and limit | By file name, at most 50.                                                  |
| Listing         | A guide without a title, a description, or a kebab-case id is not listed.  |

## Markdown

Write plain Markdown with absolute `https://` URLs for links and images. A code fence can carry a title, such as ` ```typescript [kubb.config.ts] `.

| Renders                                                                                            | Does not render                                         |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| The callouts `> [!NOTE]`, `> [!TIP]`, `> [!IMPORTANT]`, and `> [!WARNING]`                         | Raw HTML                                                |
| `::code-group`, `::field-group` with `:::field`, `::steps`, `::code-collapse`, `::tabs` with `:::tabs-item` | `<!--@include-->` lines, twoslash code fences, and any other component |

Validation reports each item that does not render before a version is approved.

## What the overview covers {#overview}

`overview.md` is the extension's page on kubb.dev. Cover these points in order:

1. What the extension does, in one or two short paragraphs.
2. How it works, only when that is not obvious.
3. The setup it needs, such as other plugins or peer packages.
4. Options worth explaining, and known limits.

> [!IMPORTANT]
> When the package runs an install script, uses the network, or touches files outside its output path, say so in the overview.

Use sentence case, plain language, and no em dashes. Leave out badges, a changelog, license text, and marketing.

> [!WARNING]
> The page already shows how to install. Validation fails for an overview that contains `kubb add`, `npm install`, `npm i`, `pnpm add`, or `yarn add`.

## Less common cases {#less-common-cases}

### Extension docs limits {#extension-docs-limits}

When the registry reads your package's `docs/` folder, it applies these limits.

- The registry ignores files other than `overview.md`, `options.md`, and `guides/<id>.md`. It skips a file larger than 256 KiB and reports it.
- Guides are sorted by file name, at most 50. A version that ships more lists the first 50.
- For a guide, kubb.dev shows the description on the guide's card, in the guide filter, and as the meta description.
