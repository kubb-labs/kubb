---
'@kubb/adapter-oas': minor
'@kubb/core': minor
---

Give a failing URL `input` its own diagnostic code instead of `KUBB_UNKNOWN`.

`KUBB_INPUT_REQUEST_FAILED` covers a 4xx or 5xx response and carries the status. `KUBB_INPUT_UNREACHABLE` covers a URL that never answers, with the reason (`connect ECONNREFUSED 127.0.0.1:8000`) pulled out of the cause chain Node hides behind an empty `fetch failed`. Both also apply to URLs reached through a `$ref`.
