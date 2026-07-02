---
"@kubb/parser-md": patch
---

Correct the `parserMd` JSDoc: the parser runs by default next to `parserTs` and `parserTsx` instead of being opt-in, and a custom `parsers` array replaces the default set.
