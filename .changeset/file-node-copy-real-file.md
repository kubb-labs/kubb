---
"@kubb/ast": minor
"@kubb/core": minor
"@kubb/renderer-jsx": minor
---

Add a `copy` field to the file model so plugins can emit a real on-disk file into the generated folder verbatim. Set `copy` to an absolute path on a `UserFileNode` (via `injectFile`/`upsertFile` or `createFile`), or pass `copy` to the JSX `<File copy={…} />` component, and Kubb writes that file's content unchanged, applying only `banner`/`footer` and bypassing the language parser. This lets a plugin ship a hand-authored template as a real `.ts` file and drop it into the output without inlining its source as a string.

Remove the unused `output.override` boolean from the config and plugin output options. It was documented as overwriting or skipping existing files, but nothing in the write path read it (`fsStorage` already skips writes only when content is byte-identical), so it had no effect.
