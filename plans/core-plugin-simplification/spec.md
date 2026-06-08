# Specification, core and plugin complexity reduction

## Overview

The contract between `@kubb/core` (with its foundation packages `@kubb/ast` and `@kubb/renderer-jsx`) and the plugin packages is wider and less guarded than it needs to be. Plugins emit code through a chain that still passes through a React reconciler even though the official plugins already default to the reconciler-free sync renderer. The dependency directions between the layers are conventions that nothing enforces, so a single import can couple a plugin to adapter internals. Each plugin also reimplements operation, parameter, and import logic that could be shared.

This feature reduces the complexity of that seam. A plugin author should have fewer concepts to learn, a smaller surface to import, boundaries that fail fast when crossed, and one place to find shared logic. The work is a refactor of the contract and the wiring around it. It does not change generated output.

## Functional requirements

- **FR-1** The dependency directions between the foundation packages, core, and plugins are explicit and enforced in CI. A forbidden import fails the build.
- **FR-2** A plugin can emit files through a structured builder API without depending on a JSX runtime.
- **FR-3** The code-emission layer no longer ships a React reconciler on the default path, and the published renderer surface shrinks accordingly.
- **FR-4** Operation, parameter, import, and grouping logic shared across plugins lives in one shared surface, and the framework plugins consume it instead of reimplementing it.
- **FR-5** Every plugin validates against a shared core-contract test built on core's testing mocks.
- **FR-6** The plugin-authoring documentation leads with the minimal path and names the three distinct emit roles.
- **FR-7** Generated output for every example and snapshot is byte-for-byte unchanged across the whole feature.

## Acceptance criteria

| ID   | Given / when / then | Maps to |
| ---- | ------------------- | ------- |
| AC-1 | Given a commit where a plugin package imports `@kubb/adapter-oas`, when CI runs the boundary check, then it fails and names the violated rule. | FR-1 |
| AC-2 | Given a generator that returns builder output with no JSX, when the build runs, then it produces the same files as the JSX version and that module imports no `@kubb/renderer-jsx`. | FR-2 |
| AC-3 | Given `@kubb/renderer-jsx` after the cut, when you inspect its installed dependencies, then `react-reconciler` and `scheduler` are absent and the size budget is below the recorded baseline. | FR-3 |
| AC-4 | Given the framework plugins react-query, vue-query, and swr, when you measure their non-test source, then the shared logic is imported from the kit and the duplicated helpers are gone. | FR-4 |
| AC-5 | Given a plugin with a deliberately broken resolver, when the conformance test runs, then it fails. With the resolver correct it passes for every plugin. | FR-5 |
| AC-6 | Given the creating-plugins guide, when it builds, then the first runnable example uses the builder API and a roles section names printer, renderer, and serializer. | FR-6 |
| AC-7 | Given the full test and example suite, when run after each slice, then all snapshots and end-to-end output match the pre-feature baseline. | FR-7 |

## Entities and data

The nouns this feature introduces or pins down:

- The layer tags that name each package's role: `ast`, `renderer`, `core`, `adapter`, `parser`, `middleware`, `plugin-kit`, `plugin`, `host`.
- The builder API: the `create*` factories in `@kubb/ast` that produce `FileNode` and code nodes directly.
- The shared plugin kit: the single home for operation, parameter, import, and grouping helpers.
- The conformance kit: a shared test built on `@kubb/core/mocks` that asserts the plugin contract.

## Out of scope

- Changing any generated output. Snapshots are the oracle, not a target.
- Merging the core and plugins repositories into one. That is a separate decision.
- The adapter and schema-dialect work, which continues independently.
- Deduplicating config and default resolution across hosts (cli, unplugin, agent, mcp). That is its own feature.
- Adding new plugins or new generated targets.
- Runtime performance work beyond what falls out of removing the reconciler.
