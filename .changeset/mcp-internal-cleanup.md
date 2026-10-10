---
'@kubb/mcp': patch
---

Load `@kubb/adapter-oas` directly in the `validate` tool. It is a dependency of `@kubb/mcp`, so the "install @kubb/adapter-oas" hint could never show.
