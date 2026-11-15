---
'@kubb/adapter-oas': patch
'@kubb/parser-md': patch
'@kubb/parser-ts': patch
'@kubb/plugin-barrel': patch
---

Rewrite the docs these packages ship for kubb.dev to lead with tables and examples. Each overview shows a config and its generated output, the adapter options are grouped by what they change, and the barrel docs now state that types go in a separate `export type` statement and that a path outside the output root fails with `KUBB_PATH_TRAVERSAL`.
