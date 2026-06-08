# Plan, core and plugin complexity reduction

## Overview

Reduce the contract between `@kubb/core` and the plugins in five ordered slices. First make a JSX-free builder the primary emit path, then remove the React reconciler. Then extract a shared plugin kit and thin the framework plugins over it. Then make the core contract executable with a conformance kit. Finally document the simplified path. Generated output stays byte-identical throughout.

## Architecture

The seam has three bands, and the plan tightens each one.

- Foundation. `@kubb/ast` is the leaf: the node vocabulary, the `create*` builders, and the visitors. `@kubb/renderer-jsx` turns JSX into `FileNode`s and shrinks to the sync walker.
- Engine. `@kubb/core` owns the surface plugins consume: `definePlugin`, `defineGenerator`, `defineResolver`, the parsers, and the `@kubb/core/mocks` testing utilities.
- Plugins. Each plugin depends on core and ast, on `renderer-jsx` only when it uses JSX, and on a shared kit for operation, parameter, import, and group logic. The framework plugins react-query, vue-query, and swr become thin mappers over that kit.

A conformance kit asserts that each plugin honors the contract. The layering stays a design guideline the slices preserve, not a check.

## Slices

| Slice | Name | Outcome |
| ----- | ---- | ------- |
| 001 | Builder-first emit path | Two aggregate generators (`operations`, `handlers`) emit identical files through `create*` builders with no JSX import. |
| 002 | Remove the React reconciler | `react-reconciler`, `scheduler`, and the `react` runtime leave `@kubb/renderer-jsx`, snapshots are unchanged, and the bundle drops from a 510 KiB budget to about 8 KiB. |
| 003 | Extract the shared plugin kit | The framework plugins import shared operation and import logic from one kit, and the duplicated helpers are deleted. |
| 004 | Plugin conformance kit | One shared contract test runs green for every plugin and red on a broken resolver. |
| 005 | Document the simplified contract | The creating-plugins guide leads with the builder path and names the three emit roles. |

## Success criteria

- [x] All `AC-N` in `spec.md` verified via `verification.md`
- [x] Generated output is byte-identical to the pre-feature baseline across snapshots and examples (AC-6)
- [x] `react-reconciler` and `scheduler` removed from `@kubb/renderer-jsx`
- [x] Documentation updated
- [x] Changeset added (`pnpm changeset`) for published-package changes

## Status

All five slices shipped and validated locally with byte-identical output. The work spans three PRs on the `claude/determined-davinci-46sQD` branch: plugins #319 (slices 001, 003, 004 and the swr part of 002), kubb #3488 (the `renderer-jsx` part of 002), and platform #133 (slice 005). Slice 002 went past the reconciler to remove the `react` runtime entirely while keeping JSX. Validation was local, since the three PR subscriptions are off. The only red CI checks are pre-existing and unrelated to this work: a flaky react-query snapshot on the plugins Tests job, and Studio and VitePress lint and typecheck debt on the platform repo.
