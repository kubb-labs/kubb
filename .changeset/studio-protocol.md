---
'@kubb/studio': patch
---

Export `applyConfigEdits`, which applies config edits to a source string without touching a file. `GenerateInput` and `SaveConfigInput` take an optional `requestedBy`, which `studio:command` carries along with `failed` for a failed generation. `PublishedSnapshot` gains the optional `number` and `webUrl` fields, and `changes.base` gains `number`.
