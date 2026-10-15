---
'@kubb/studio': minor
'@kubb/cli': minor
---

Add a separate `allowReadAst` permission (`--allow-read-ast`) for reading the parsed spec. `allowRead` now covers only generated files, so projects that granted `allowRead` before are asked once more about the spec.
