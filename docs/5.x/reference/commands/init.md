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

`kubb init` is a setup wizard. It looks at the project, asks three questions, shows the config for review, then installs the packages, writes `kubb.config.ts`, and runs the first generation.

```shell [Terminal]
npx kubb init
```

## What the wizard does

::steps{level="3"}

### Detect the project

Kubb reads the package manager (`npm`, `pnpm`, `yarn`, or `bun`) from the `packageManager` field or a lockfile, else uses `npm`. Without a `package.json`, it offers to create one.

It looks for spec files named `openapi*` or `swagger*` with a `.yaml`, `.yml`, or `.json` extension, up to three folders deep, and skips `node_modules`, `dist`, `build`, `coverage`, and hidden folders. It shows the version and operation count of the first one.

### Ask three questions

| Question | Choices | Default |
| --- | --- | --- |
| Which spec to read | A file it found, a URL, or another file | The first file found, else `./openapi.yaml` |
| Which [plugins](/extensions/kind/plugins) to add | The plugins in the registry that support your Kubb and Node.js versions | `plugin-ts` |
| Output folder | Any path | `./src/gen` |

The CLI does not infer plugins from your framework or installed libraries.

### Review the config

Kubb first checks the [manifest](/docs/5.x/reference/kit/manifest) of each chosen plugin. When a plugin's `dependencies` are not all chosen, or a plugin with `role: "consumer"` (such as `plugin-react-query`) has no client plugin next to it, the wizard names what is missing and asks again.

Then it shows the full `kubb.config.ts` and the packages it installs. Pick **Change a choice** to answer the questions again. When `kubb.config.ts` exists, the prompt asks to overwrite it.

### Install, write, and generate

Kubb installs `kubb` at the version of the CLI you ran and each plugin at the version the registry pins. It writes `kubb.config.ts`, adds `"generate": "kubb generate"` to the `package.json` scripts when no `generate` script exists, and runs the first generation.

::

## Options

| Option | Default | Description |
| --- | --- | --- |
| `--yes`, `-y` | `false` | Skip every prompt and the review, use the defaults above, and print one line per step. Overwrites an existing `kubb.config.ts`. |
| `--input <path>`, `-i` | | Spec path or URL. Skips the spec question. |
| `--output <path>`, `-o` | | Output folder. Skips the output question. |
| `--plugins <ids>` | | Comma-separated registry ids, the same ids [`kubb add`](/docs/5.x/reference/commands/add) takes, such as `plugin-ts,plugin-zod`, or short names such as `ts,zod`. Skips the plugin question. An id that is not in the registry stops `kubb init`. |
| `--dry-run` | `false` | Run the wizard without installing packages, writing files, or running the first generation. |

Each flag skips only its own question and combines with `--yes`. Pass all three value flags to skip the questions and the review. Kubb still asks before it overwrites `kubb.config.ts` unless you pass `--yes`.

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

`kubb init` exits with code 1 when:

- The first generation fails. Kubb shows the error and keeps the setup.
- A chosen plugin misses a dependency with `--yes` or all three value flags. Kubb names what is missing.
- A `--plugins` id is not in the registry, the registry cannot be read, or the install fails.

It exits with code 0 when you cancel a prompt.
