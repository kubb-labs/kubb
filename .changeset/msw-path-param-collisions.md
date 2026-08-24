---
'@kubb/kit': patch
---

Fix `Url.toPath` producing route masks that `path-to-regexp` (used by MSW/Express) rejects or misparses:

- A parameter name starting with a character outside `[A-Za-z0-9_]` (e.g. `{$id}`) now sanitizes to a safe capture name instead of keeping the disallowed character.
- Distinct parameter names that normalize to the same identifier (e.g. `{group-id}` and `{group.id}`) are now deduplicated with an incrementing suffix (`groupId`, `groupId2`) instead of producing two identically named captures.
