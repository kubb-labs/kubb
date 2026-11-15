---
layout: doc
title: kubb init - Set up Kubb in a project
description: The init command detects your spec and package manager, asks for plugins and an output folder, then installs Kubb and writes kubb.config.ts.
outline:
  - 2
  - 3
order: 1
navigation:
  title: kubb init
  icon: i-iconoir-magic-wand
---

# kubb init

`kubb init` is a setup wizard. It asks three questions, shows the config for review, then installs Kubb, writes `kubb.config.ts`, and runs the first generation.

```shell [Terminal]
npx kubb init
```

## What the wizard does

::steps{level="3"}

### Detect the project

Kubb finds the package manager the way the [extension commands](/docs/5.x/reference/commands#project-files) do. Without a `package.json`, it offers to create one.

It looks for `openapi*` or `swagger*` files (`.yaml`, `.yml`, or `.json`) up to three folders deep. See [How kubb init finds a spec](/docs/5.x/topics/extension-commands#init-spec-detection).

### Ask three questions

| Question | Choices | Default |
| --- | --- | --- |
| Which spec to read | A file it found, a URL, or another file | The first file found, else `./openapi.yaml` |
| Which [plugins](/extensions/kind/plugins) to add | The registry plugins that support your Kubb and Node.js versions | `plugin-ts` |
| Output folder | Any path | `./src/gen` |

Kubb does not pick plugins from your framework or installed libraries.

### Review the config

Kubb checks each plugin's [manifest](/docs/5.x/reference/kit/manifest). When a plugin needs another one you did not pick, such as a client plugin next to `plugin-react-query`, the wizard names it and asks again.

Then it shows `kubb.config.ts` and the packages to install. Pick **Change a choice** to answer again. When `kubb.config.ts` exists, the prompt asks to overwrite it.

### Install, write, and generate

Kubb installs `kubb` at the CLI version and each plugin at its registry pin. It writes `kubb.config.ts`, adds a `"generate": "kubb generate"` script when `package.json` has none, and runs the first generation.

::

## Options

| Flag | Alias | Default | What it does |
| --- | --- | --- | --- |
| `--yes` | `-y` | `false` | Skip every prompt and the review, and use the defaults. Overwrites an existing `kubb.config.ts`. |
| `--input <path>` | `-i` | | Spec path or URL. Skips the spec question. |
| `--output <path>` | `-o` | | Output folder. Skips the output question. |
| `--plugins <ids>` | | | Comma-separated [registry ids](/docs/5.x/reference/commands#ids) or short names, such as `ts,zod`. Skips the plugin question. An id the registry does not list stops `kubb init`. |
| `--dry-run` | | `false` | Run the wizard without installing packages, writing files, or generating. |

Each value flag skips only its own question. Pass all three to also skip the review. Without `--yes`, Kubb still asks before it overwrites `kubb.config.ts`.

## Examples

Run with the defaults and no prompts:

```shell [Terminal]
npx kubb init --yes
```

Run with no prompts and a specific spec, output folder, and plugins:

```shell [Terminal]
npx kubb init --yes --input ./openapi.yaml --plugins ts,zod --output src/api
```

```text [Output]
✓ Installed kubb @kubb/plugin-ts @kubb/plugin-zod with npm
✓ Wrote kubb.config.ts
✓ Generated 84 files in src/api
Kubb is set up. Run npm run generate after changing the spec.
```

## Exit codes

| Code | When |
| --- | --- |
| `0` | Kubb is set up, or you canceled a prompt. |
| `1` | The first generation fails. The setup stays. |
| `1` | A plugin misses a dependency (with `--yes` or all three value flags), a `--plugins` id is not in the registry, the registry cannot be read, or the install fails. |
