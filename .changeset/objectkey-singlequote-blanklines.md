---
"@kubb/parser-ts": minor
"@kubb/ast": minor
---

Tighten generated-output formatting so it reads cleanly without a formatter. `objectKey` now quotes a key only when it is not valid identifier syntax (reserved words and globals like `name` and `class` stay bare) and uses single quotes when it must quote. `@kubb/parser-ts` collapses runs of three or more newlines to a single blank line, so two consecutive `<br/>` breaks never produce a double blank line between statements. A shared `singleQuote` helper backs the single-quote output.
