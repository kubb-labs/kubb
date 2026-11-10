---
'@kubb/adapter-oas': patch
---

Report `KUBB_UNSUPPORTED_FORMAT` once per format, at the first schema that uses it, with the number of schemas that use it. The Stripe spec printed 826 warnings for three formats and now prints three.
