---
'@kubb/adapter-oas': patch
---

Skip `api-ref-bundler` when the document has no `$ref` outside itself.

`bundleDocument` called `api-ref-bundler`'s `bundle()` on every input to hoist external file
`$ref`s into named `components.schemas` entries. `bundle` only rewrites external refs, so on a
document where every `$ref` is already an internal `#/...` fragment, the call is a no-op that
still walks the entire document to confirm that. Most real-world specs are a single file with no
external refs, and that walk is not free: profiling a 288-operation spec showed it accounting for
roughly 9% of total CPU time, and skipping it cut wall-clock time on that same case by about 30%.

`bundleDocument` now checks the parsed root for any `$ref` value that does not start with `#`
before calling `bundle`, and returns the parsed document directly when there is none. A document
that mixes internal and external refs, or has external refs anywhere, still bundles exactly as
before.
