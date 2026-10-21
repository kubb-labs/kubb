---
'@kubb/studio': minor
---

A managed agent now generates from a spec that Studio sends: the document itself, a URL, or a `git+<repo>#<ref>:<path>` file. A file path is refused, and a sandbox still takes the document only.
