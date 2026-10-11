---
'@kubb/cli': patch
---

Rebuild once per editor save in `kubb generate --watch`. An atomic save (write a temp file, then rename it) could trigger two rebuilds, because the 100 ms debounce matched chokidar's 100 ms atomic-save window. The debounce is now 250 ms.
