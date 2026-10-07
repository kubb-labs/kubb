---
'@kubb/adapter-oas': patch
'@kubb/core': patch
---

Report spec validation problems as `KUBB_INVALID_SPEC` warnings during `kubb generate`. The adapter validated the spec by default but discarded the result, so an invalid spec generated silently. Each problem is now listed and generation continues. Set `validate: false` on the adapter to skip the check, which on a large spec saves about 20% of the run.
