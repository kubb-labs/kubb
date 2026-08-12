---
'@kubb/adapter-oas': minor
'@kubb/core': minor
---

Give a failing URL `input` its own diagnostic code instead of `KUBB_UNKNOWN`.

A URL that answers with a 4xx or 5xx status now reports `KUBB_INPUT_REQUEST_FAILED`, with the
status in the message and a fix tuned to it: a 401 or 403 points at the missing credentials Kubb
does not send, a 404 at the URL, and a 5xx at the server.

A URL that never answers reports `KUBB_INPUT_UNREACHABLE`. Node hides the reason for a refused
connection behind a bare `fetch failed` with an empty message, so the run used to print only a
stack. The reason is now dug out of the cause chain and shown, for example
`Cannot reach http://localhost:8000/api/schema/: connect ECONNREFUSED 127.0.0.1:8000`.

Both codes cover URLs reached through a `$ref` as well, so a document that pulls a remote schema
names the URL that failed. Each has a page under
[Diagnostics](https://kubb.dev/docs/5.x/reference/diagnostics), linked from the terminal output.
