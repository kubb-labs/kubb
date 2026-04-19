---
"@kubb/core": minor
---

Remove `UserGroup` type and make `Group.name` optional.

`UserGroup` and `Group` were structurally identical after making `name` optional on `Group`, so `UserGroup` has been removed. Use `Group` everywhere.

`defaultResolvePath` now supplies built-in defaults when `name` is omitted: `${camelCase(tag)}Controller` for tag groups and the first path segment for path groups.
