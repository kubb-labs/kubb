---
'@kubb/cli': patch
'@kubb/mcp': patch
---

Escape the input and output paths that `kubb init` and the MCP `init` tool write into `kubb.config.ts`. A path with a `'` no longer breaks the file or injects code, and a Windows path such as `C:\new\gen` keeps its backslashes.
