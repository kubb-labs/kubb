---
'@kubb/studio': minor
---

Generate through core's `createKubb().generate()`: formatting, linting and `output.postGenerate` now run inside core, a failing pass arrives as a `kubb:diagnostic` event (`KUBB_FORMAT_FAILED`, `KUBB_LINT_FAILED`, `KUBB_POST_GENERATE_FAILED`) and fails the job, hook ids are core's UUIDs, and the output manifest is committed so the next run skips files the formatter already handled.
