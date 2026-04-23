---
"@kubb/middleware-barrel": patch
---

Fix two barrel-generation bugs in `@kubb/middleware-barrel`.

**Bug 1 — Non-TypeScript files produced malformed barrel exports**: `getBarrelFiles()` included every file in the output directory (`.json`, `.html`, etc.). `toRelativeModulePath` strips the extension, so `.mcp.json` became `.mcp` and the TypeScript printer turned that into `./mcp/.ts` or `./.js`. Fixed by filtering `relevantFiles` to only `.ts`, `.tsx`, `.js`, and `.jsx` files.

**Bug 2 — Files with `isIndexable: false` still appeared in named barrels**: `getBarrelFilesNamed()` fell back to `export *` for files whose sources all had `isIndexable: false`, causing internal files like `.kubb/config.ts` to appear in every root barrel. Fixed by skipping such files entirely; the wildcard fallback is now only used when a file has *no* sources at all (i.e. its exports are unknown).
