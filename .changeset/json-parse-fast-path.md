---
'@kubb/adapter-oas': patch
---

Parse a JSON input with `JSON.parse` instead of always routing it through the `yaml` package.

`resolveSource` called `yaml`'s `parse` on every source, JSON included, since JSON is valid YAML.
A general-purpose YAML parser (comments, anchors, block scalars, multi-document streams) does far
more work than `JSON.parse` needs for something that is already JSON.

`resolveSource` now tries `JSON.parse` first and falls back to the YAML parser on failure. A real
YAML document fails `JSON.parse` on or near its first character, so the fallback costs
essentially nothing on non-JSON input. Measured on a 288-operation spec read from a `.json` file
(`plugin-ts` + `plugin-axios` + `plugin-zod` + `plugin-faker`): median wall-clock time for that
case drops from ~5,845ms to ~3,960ms.
