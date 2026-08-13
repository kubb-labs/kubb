---
'@kubb/renderer-jsx': minor
'@kubb/ast': minor
'kubb': patch
---

Trim exported symbols that no consumer uses, found by a knip audit of every package's public surface.

Unlike the previous two knip passes, this one narrows published API. Every symbol below was checked for usage across this repo, the plugins repo, the platform repo, and the docs site, including namespace member access (`ast.x`, `ast.factory.x`) and documentation code fences.

- `@kubb/renderer-jsx`: drop the `JSXElement` and `ReactNode` aliases from `jsx-runtime` and `jsx-dev-runtime`. They aliased `KubbReactElement`/`KubbReactNode`, which are the names plugins actually import, and no consumer referenced them. The JSX runtime contract itself (`jsx`, `jsxs`, `jsxDEV`, `Fragment`, and the `JSX` namespace) is unchanged.
- `@kubb/ast`: stop re-exporting `combineExports`, `combineImports`, and `combineSources` from the package barrel. The functions stay, and `createFile` still calls them through a direct module import.
- `kubb`: drop the unused `@kubb/ast` dependency. Nothing in the package imported it, and there is no `kubb/ast` subpath.

`@internals/utils` also stops re-exporting `isIdentifier` and `isValidVarName` from its barrel; both are still used through direct module imports. That package is private, so it carries no version bump.
