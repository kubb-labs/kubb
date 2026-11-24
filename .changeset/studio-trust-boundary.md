---
'@kubb/studio': patch
---

Harden what a Kubb Studio agent accepts from Studio.

- A generation keeps the sandbox or managed mode it started with, so a `connect()` from Studio during the run can no longer switch off the public-only fetch or widen what the run reads.
- A generation with a missing or non-string job id is refused before any work, instead of writing output and failing at the end.
- The config Studio sends is checked first: `plugins` and `parsers` must be lists of named entries, `adapter` an object, and `input` a string. Plugin options from Studio lose keys such as `__proto__` at every depth, including for a plugin only Studio names.
- A managed agent refuses a `url` input that is not `http:` or `https:`, such as `C:\spec.yaml`, which the adapter would read from disk.
- Two generations that overlap in one process no longer leave the public-only `fetch` installed after both finish.
