---
'@kubb/core': major
'@kubb/renderer-jsx': major
---

Drop the renderer `stream()` capability. `Renderer.stream` is gone from `@kubb/core`'s renderer contract, `KubbDriver#dispatch` no longer looks for it, and `@kubb/renderer-jsx`'s `jsxRenderer`/`Runtime` no longer expose `stream()`.

The renderer walk is synchronous and in-memory, with no IO to overlap, so yielding files one at a time bought nothing over `render()` collecting them into `files` first. Custom renderers that implemented `stream()` should implement `render()`/`files` instead, the only path `dispatch` uses now.

`Kubb.build()`'s `storage` also changed: it's the configured `Storage` backend directly rather than a view scoped to the current build's file paths. Use `files` to list what a build produced; `storage` is for reading a generated file's content back.
