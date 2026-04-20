---
"@kubb/core": patch
---

Fix path traversal vulnerabilities in file path resolution.

- `camelCase` / `pascalCase` with `isFile: true` no longer produces a leading `/` when a schema name starts with `.{letter}` (e.g. `..Schema`). Empty segments produced by such names are now filtered before joining with `/`, preventing the result from being interpreted as an absolute path.
- `defaultResolvePath` default group name for `group.type === 'path'` now strips `.` and `..` components from the OpenAPI operation path before selecting the first segment as a subdirectory name.
- Added an output-directory boundary check to `defaultResolvePath`: if the resolved path escapes the configured output directory an error is thrown, providing defense-in-depth against path traversal in malicious OpenAPI specs or misconfigured `group.name` functions.
