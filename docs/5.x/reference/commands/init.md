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

`kubb init` sets up Kubb in your project. It asks three questions, shows you the config, then installs Kubb, writes `kubb.config.ts`, and runs the first generation.

```shell [Terminal]
npx kubb init
```

## What the wizard does

::steps{level="3"}

### Detect the project

Kubb finds your package manager by the rules in [Project files](/docs/5.x/reference/commands#project-files). Without a `package.json`, it offers to create one.

It looks for `openapi*` or `swagger*` files (`.yaml`, `.yml`, or `.json`) up to three folders deep. See [Spec detection in kubb init](#init-spec-detection).

### Ask three questions

| Question | Choices | Default |
| --- | --- | --- |
| Which spec to read | A file it found, a URL, or another file | The first file found, else `./openapi.yaml` |
| Which [plugins](/extensions/kind/plugins) to add | The registry plugins that support your Kubb and Node.js versions | `plugin-ts` |
| Output folder | Any path | `./src/gen` |

Kubb does not pick plugins from your framework or installed libraries.

### Review the config

Kubb checks each plugin's [extension manifest](/docs/5.x/reference/kit/manifest). When a plugin needs another one you did not pick, such as a client plugin next to `plugin-react-query`, the wizard names it and asks again.

Then it shows you `kubb.config.ts` and the packages to install. Pick **Change a choice** to answer again. If `kubb.config.ts` exists, Kubb asks before it overwrites it.

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

Set the spec, output folder, and plugins, with no prompts:

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

## Less common cases {#less-common-cases}

### Spec detection in kubb init {#init-spec-detection}

On start, `kubb init` detects the package manager and looks for a spec.

- It reads the package manager (`npm`, `pnpm`, `yarn`, or `bun`) from the `packageManager` field or a lockfile, else `npm`.
- Without a `package.json`, it offers to create one.
- It looks up to three folders deep for `openapi*` or `swagger*` files ending in `.yaml`, `.yml`, or `.json`.
- It skips `node_modules`, `dist`, `build`, `coverage`, and hidden folders.
- It shows the version and operation count of the first one.

For a spec with another name or a deeper path, pass it with [`--input`](#options).
