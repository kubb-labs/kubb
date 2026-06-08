# Plan, core and plugin complexity reduction

## Overview

Reduce the contract between `@kubb/core` and the plugins in six ordered slices. First pin and enforce the layer boundaries. Then make a JSX-free builder the primary emit path and remove the React reconciler. Then extract a shared plugin kit and thin the framework plugins over it. Then make the core contract executable with a conformance kit. Finally document the simplified path. Generated output stays byte-identical throughout.

## Architecture

The seam has three bands, and the plan tightens each one.

- Foundation. `@kubb/ast` is the leaf: the node vocabulary, the `create*` builders, and the visitors. `@kubb/renderer-jsx` turns JSX into `FileNode`s and shrinks to the sync walker.
- Engine. `@kubb/core` owns the surface plugins consume: `definePlugin`, `defineGenerator`, `defineResolver`, the parsers, and the `@kubb/core/mocks` testing utilities.
- Plugins. Each plugin depends on core and ast, on `renderer-jsx` only when it uses JSX, and on a shared kit for operation, parameter, import, and group logic. The framework plugins react-query, vue-query, and swr become thin mappers over that kit.

A boundary check encodes the allowed dependency directions, and a conformance kit asserts that each plugin honors the contract.

Allowed dependency directions:

```
ast                        -> (none)
renderer-jsx               -> ast
core                       -> ast, renderer-jsx
adapter / parser / middleware -> core, ast
plugin-kit                 -> core, ast
plugin-*                   -> core, ast, plugin-kit, renderer-jsx (only if using JSX), other plugin-*
host (cli, kubb, unplugin, agent, mcp) -> any
```

## Slices

| Slice | Name | Outcome |
| ----- | ---- | ------- |
| 001 | Enforce core and plugin boundaries | A forbidden import fails `pnpm boundaries` in CI, and baseline metrics are recorded. |
| 002 | Builder-first emit path | One generator emits identical files through `create*` builders with no JSX import. |
| 003 | Remove the React reconciler | `react-reconciler` and `scheduler` leave `@kubb/renderer-jsx`, snapshots are unchanged, and the size budget drops. |
| 004 | Extract the shared plugin kit | The framework plugins import shared operation and import logic from one kit, and the duplicated helpers are deleted. |
| 005 | Plugin conformance kit | One shared contract test runs green for every plugin and red on a broken resolver. |
| 006 | Document the simplified contract | The creating-plugins guide leads with the builder path and names the three emit roles. |

## Success criteria

- [ ] All `AC-N` in `spec.md` verified via `verification.md`
- [ ] Generated output is byte-identical to the pre-feature baseline across snapshots and examples (AC-7)
- [ ] `react-reconciler` and `scheduler` removed from `@kubb/renderer-jsx`
- [ ] Boundary check runs in CI for both the kubb and plugins repositories
- [ ] Documentation updated
- [ ] Changeset added (`pnpm changeset`) for published-package changes
