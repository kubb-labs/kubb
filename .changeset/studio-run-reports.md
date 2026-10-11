---
'@kubb/studio': patch
---

Tell both the host and Kubb Studio why a generation did not go as asked.

- Log a plugin Studio asked for that cannot be loaded as a `kubb:error` on the host.
- Send the "Ignored the spec from Studio" warning through the generation's event stream, so Studio sees it too.
- Warn on the host when a dropped connection cancels the running generation.
