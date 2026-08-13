---
'@kubb/ast': patch
---

Cut the cost of assembling one file out of many fragments.

`createFile` runs again every time a fragment is merged into a file, and its import filter asked `source.includes(name)` for every import name, scanning the whole accumulated file each time. A file built from many fragments paid that scan again for every fragment it had already absorbed, so the cost grew faster than the file did.

The check now reads from the identifier runs collected in a single pass over the source. Every character of an import name is an identifier character, so an occurrence of the name always sits inside one run, and the answer comes out the same as before. A name that appears only inside a longer identifier still counts as used, the way it always has.

Measured on one file assembled from N fragments: 400 fragments drops from 343ms to 223ms, 800 from 2.0s to 0.9s, and 1600 from 29.2s to 3.8s. Under roughly 200 fragments the two are level.
