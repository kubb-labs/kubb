---
'@kubb/parser-ts': patch
---

Render a single string export name as a named re-export.

`printExport` warned to the console and fell back to a wildcard when `name` was a string without `asAlias`, silently dropping the name. It now emits `export { Name } from './path'`, which matches the single-export form documented on `ExportNode`, and no longer writes to the console from a string builder.
