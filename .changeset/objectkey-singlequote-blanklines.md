---
"@kubb/parser-ts": minor
"@kubb/ast": minor
---

Tighten generated-output formatting so it reads cleanly without a formatter. `objectKey` now quotes a key only when it is not valid identifier syntax (reserved words and globals like `name` and `class` stay bare) and uses single quotes when it must quote. `@kubb/parser-ts` treats a `<br/>` break as a blank-line separator between statements, so consecutive or edge breaks fold into a single blank line instead of stacking. A shared `singleQuote` helper backs the single-quote output.
