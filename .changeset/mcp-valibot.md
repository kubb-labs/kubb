---
'@kubb/mcp': patch
---

Validate tool input with `valibot`, which `tmcp` already installs, instead of `zod`. This removes `zod` from the install and makes `npm i kubb` about 6 MB smaller. The tool schemas that MCP clients see are unchanged.
