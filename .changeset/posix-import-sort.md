---
'@kubb/ast': patch
---

Sort imports by the specifier written in the file, the POSIX path relative to the importing file, so Windows and macOS/Linux generate the same import order. Parent imports (`../`) now come before sibling imports (`./`).
