---
'@kubb/ast': minor
'@kubb/adapter-oas': minor
'@kubb/core': minor
'@kubb/kit': minor
---

Write a status range in lower case. The adapter turns a response key such as `2XX` into `2xx`, and `StatusCode` lists `2xx` to `5xx`. The response `pointer` keeps the key as the document spells it. `camelCase` and `pascalCase` keep a range such as `2xx` as one word, so `listPets Status 2xx` becomes `listPetsStatus2xx` instead of `listPetsStatus2Xx`.
