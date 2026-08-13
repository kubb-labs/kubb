---
'@kubb/adapter-oas': patch
---

Load the OpenAPI validator only when validation runs.

`@readme/openapi-parser` is the heaviest dependency in the package, and it was imported at the top of the module that holds `validateDocument`. Importing `@kubb/adapter-oas` pulled it in, which every `kubb.config.ts` does, so the cost landed on runs that never validate anything.

It is now loaded inside `validateDocument`. Importing the adapter drops from 144ms to 88ms, medians of three runs. Setting `validate: false` saves that outright, and so does any tool that loads the adapter without parsing a document. With validation on, which is the default, the same work moves into the parse step instead of disappearing.
