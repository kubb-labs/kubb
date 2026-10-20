---
'@kubb/studio': major
'@kubb/core': patch
---

Keep Studio output on disk and make existing output available for review before generating.

- Return an immutable output ID and content hashes on connect.
- Stage generation on disk when project writes are disabled.
- Remove `ReadFilesInput.jobType`, `ReadFilesInput.source`, `ReadDiffInput.base.source`, `FileSource`, and the pre-run disk comparison.
- Preserve cached file bytes exactly, including whitespace and empty files.

```diff
- { jobId, jobType: 'generation', source: 'output', paths }
+ { jobId, paths }
```

Upgrade Studio and its agents together. Read files with `{ jobId, paths }` and compare output sets with `{ jobId, path, base: { jobId }, limit }`.
