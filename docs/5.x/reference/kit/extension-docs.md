---
layout: doc
title: Extension docs
description: Reference for the docs folder a Kubb plugin, adapter, or parser
  ships on npm. Covers the files kubb.dev renders, titles and descriptions,
  guide ids, the Markdown that renders, and what an overview covers.
outline:
  - 2
  - 3
order: 16
navigation:
  title: Extension docs
  icon: i-iconoir-book
---

# Extension docs

An extension ships its docs in a `docs/` folder at the package root, next to its [manifest](/docs/5.x/reference/kit/manifest). The [registry](/docs/5.x/reference/registry#detail) reads the folder from the npm tarball or the GitHub release of the pinned version, and kubb.dev renders it under `/extensions/<owner>/<slug>`. Add `docs` to `files` in `package.json`, so npm ships it.

## Files

| File                  | Page on kubb.dev                         | Required |
| --------------------- | ---------------------------------------- | -------- |
| `docs/overview.md`    | `/extensions/<owner>/<slug>`             | Yes      |
| `docs/options.md`     | `/extensions/<owner>/<slug>/options`     | No       |
| `docs/guides/<id>.md` | `/extensions/<owner>/<slug>/guides/<id>` | No       |

The registry ignores other files in `docs/`. It skips a file larger than 256 KiB and reports it.

## Title and description

Start each file with a `#` title on its first line. The first paragraph after the title is the description. Files have no frontmatter. For a guide, kubb.dev shows the description on the guide's card, in the guide filter, and as the meta description.

## Guides

| Rule            | Detail                                                                     |
| --------------- | -------------------------------------------------------------------------- |
| File name       | Kebab case, such as `base-url.md`. The id is the file name without `.md`.  |
| Order and limit | By file name, at most 50. A version that ships more lists the first 50.    |
| Listing         | A guide without a title, a description, or a kebab-case id is not listed.  |

## Markdown

Write plain Markdown, and use absolute `https://` URLs for links and images. A code fence can carry a title, such as ` ```typescript [kubb.config.ts] `.

| Renders                                                                                            | Does not render                                         |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| The callouts `> [!NOTE]`, `> [!TIP]`, `> [!IMPORTANT]`, and `> [!WARNING]`                         | Raw HTML                                                |
| `::code-group`, `::field-group` with `:::field`, `::steps`, `::code-collapse`, `::tabs` with `:::tabs-item` | `<!--@include-->` lines, twoslash code fences, and any other component |

Validation reports each item that does not render before a version is approved.

## Overview

`overview.md` is the extension's page on kubb.dev. Cover these points in order, and add headings only when they help:

1. What the extension is and does, in one or two short paragraphs.
2. How it works, only when that is not obvious.
3. The setup it needs, such as other plugins or peer packages.
4. Options worth explaining, and known limits.

When the package runs an install script, uses the network, or touches files outside its output path, say so in the overview.

Use sentence case, plain language, and no em dashes. Leave out install commands, badges, a changelog, license text, and marketing. The page already shows how to install, so validation fails for an overview that contains `kubb add`, `npm install`, `npm i`, `pnpm add`, or `yarn add`.
