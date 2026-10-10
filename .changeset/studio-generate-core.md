---
'@kubb/studio': minor
---

Studio runs a generation through `@kubb/core`, so the format, lint and `output.postGenerate` passes run inside core. A failing pass fails the job and arrives as a `kubb:diagnostic` event with the code `KUBB_FORMAT_FAILED`, `KUBB_LINT_FAILED` or `KUBB_POST_GENERATE_FAILED`. The output manifest is committed after the passes, so the next run skips files the formatter already handled.
