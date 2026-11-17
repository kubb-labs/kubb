---
'@kubb/studio': minor
---

The agent keeps a job's API input as `ast.json` text. Studio gets every ref target by asking `readInput` for `format: 'ast.json'`.

- `readInput({ jobId, format: 'ast.json' })` returns `{ json }`. Read it with `ast.json.parse` from `kubb/kit`.
- Without `format`, `readInput` returns `{ input }` without ref targets, as before.
- A job an earlier agent kept has no input after the update. Generate again to keep one.
