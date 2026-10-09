---
'@kubb/core': patch
'@kubb/studio': patch
---

Correct three doc comments so they match what the code does: `group.name` keeps the first path segment as written for `path` groups, the `defaultBanner` example shows the banner Kubb writes, and the Studio heartbeat note says a ping is persisted at most once an hour.
