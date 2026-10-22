---
'@kubb/studio': patch
---

A managed agent now generates from a spec that Studio sends: the document itself, a URL, or a `git+<repo>#<ref>:<path>` file. It fetches a URL and a git repository from public addresses only, and it refuses a file path. A sandbox still takes the document only.
