---
'@kubb/adapter-oas': patch
---

Use less memory while validating a spec.

The worker thread that validates the spec now keeps a small young-generation heap, so it frees short-lived objects sooner. On a 1.3 MB spec, peak memory of `kubb generate` drops from about 242 MB to 216 MB, and on the pet store spec from about 125 MB to 116 MB. Generation takes the same time.
