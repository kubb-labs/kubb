---
layout: doc
title: Extension model
description: Understand plugin lifecycles, generators, resolvers, macros, and
  renderers when extending Kubb.
outline:
  - 2
  - 3
order: 2
navigation:
  title: Extension model
  icon: i-iconoir-ev-plug
---

# Extension model

Use an existing [plugin](/extensions/kind/plugins) when it generates the output you need. To add an output or replace a pipeline layer, build on `kubb/kit`, a subpath of the `kubb` package.

## Choose an extension

| You need to change | Extension | Why |
| --- | --- | --- |
| Input format | Adapter | Translate the format into Kubb's shared AST. |
| Schema meaning before generation | Macro | Transform nodes before the plugin processes them. |
| Generated names or paths | Resolver | Keep declarations and imports consistent. |
| Code emitted for a schema type | Printer | Change one output target without changing the input model. |
| A new kind of output | Plugin and generators | Choose the files and content to generate. |
| File syntax or assembly | Parser | Convert emitted nodes into source text. |
| Where files are stored | Storage | Reuse generation with another destination. |

For example, turning a date into a TypeScript `Date` type is a printer customization. Moving model files into a folder is a resolver customization. Changing a schema before several generators consume it calls for a macro. Macros run before printer handlers, so a macro change is visible to every output target while a printer change stays in one.

## Plugins {#plugins}

A plugin factory returns a name, options, and lifecycle hooks. It registers generators and a resolver during `kubb:plugin:setup`, then produces files during generation. Setup can use the setup context through its `ctx` argument or through [composables](/docs/5.x/reference/kit/plugins#setup-context) such as `addGenerator()`, which work in any function setup calls.

::plugin-anatomy
::

### Lifecycle {#lifecycle}

Setup runs once per plugin. Kubb then walks schemas and operations, invokes generators, collects files, and runs output passes. Hooks let a plugin observe or change specific stages.

::lifecycle-timeline
::

The [lifecycle reference](/docs/5.x/reference/kit/hooks) lists the firing order and payloads.

### Dependencies and ordering {#dependencies}

Declared dependencies run before their dependents. Kubb uses `enforce: 'pre'`, normal plugins, then `enforce: 'post'` and declaration order to break ties. Dependencies take priority over `enforce`.

A plugin declares its dependencies as a record keyed by plugin name. A missing required entry fails the run with `KUBB_MISSING_DEPENDENCY` before any plugin runs, and an `optional: true` entry is skipped when its plugin is missing. See [Extensions](/docs/5.x/reference/kit/extensions#dependencies). Resolvers let cooperating plugins read each other's names and paths instead of guessing them.

Post-enforced plugins can process other plugins' emitted files. The built-in barrel plugin uses this to generate re-exports.

## Generators {#generators}

A generator handles `schema` nodes, `operation` nodes, or the complete `operations` batch. Splitting output into generators keeps each task separate. An optional `match` predicate filters schema and operation handlers. It does not filter the batch handler.

Generators return files directly or elements for a renderer. See [Generator reference](/docs/5.x/reference/kit/generators) for handler signatures and context properties.

## Resolvers {#resolvers}

A resolver determines identifiers, filenames, and paths. Generators use the active resolver, and dependent plugins read it to import the correct output.

The plugin's `resolver` option patches its defaults. Use it to rename or relocate output. Use macros to change the underlying schema. See [Override a resolver](/docs/5.x/how-to/resolvers).

## Macros and printers {#macros}

Macros rewrite the AST before generation. Printers turn schema nodes into output for one target, such as TypeScript types or Zod expressions.

Use a macro when the schema meaning changes. Override a printer when one target needs different code. See [Write a macro](/docs/5.x/how-to/macros) and [Override a printer](/docs/5.x/how-to/printers).

## Renderers {#renderers}

Generators can build `FileNode`s with `ast.factory` or return elements that a renderer converts into files. `kubb/jsx` provides the JSX renderer without React. Enable it per generator through `renderer`.

A custom renderer is useful for another templating format. Direct node builders need no renderer. See [JSX reference](/docs/5.x/reference/jsx#renderers).
