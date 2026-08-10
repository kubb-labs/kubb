---
'@kubb/adapter-oas': patch
---

Fail with `KUBB_INVALID_DOCUMENT` when `input` resolves to something that is not an OpenAPI or Swagger document.

`validateDocument` keeps spec violations non-fatal so imperfect but usable documents still generate. That leniency also swallowed input that was not a document at all, so a wrong file or a wrapper object produced an empty build with a success exit code. A document that declares neither `openapi` nor `swagger` is now a hard error regardless of the `validate` option, while every other validation failure stays non-fatal.
