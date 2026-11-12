---
'@kubb/core': patch
'@kubb/studio': patch
---

A `type: 'method'` filter now matches in either case, so the documented `pattern: 'GET'` selects operations like `'get'` does. An `override` entry's `output` gets its `mode` from `output.path`, which fixes the `No extname found` crash for `output: { path: 'admin' }`. Core now emits `kubb:generation:summary` after `kubb:generation:end`, and the `KUBB_PATH_TRAVERSAL` message for a resolver `file.path` names the output directory.
