---
'@kubb/studio': patch
---

A managed agent now generates from a spec that Studio sends: the document itself, a URL, or a `git+<repo>#<ref>:<path>` file. It fetches only from public addresses, over https for git, and refuses a file path. A sandbox still takes the document only.
