---
'@kubb/cli': patch
---

Fix the clack logger rendering plugins side by side during generation.

Plugins run concurrently, but the logger started a separate `clack.progress()` bar per plugin. clack renders one progress UI per line, so the bars collided onto a single line, printed blank gutter rows, and piled up `keypress` listeners until Node warned about an EventEmitter leak. The plugin phase now shares one progress bar that lists the plugins currently generating and advances as each finishes. The `kubb:info` line also no longer prints a trailing space when no extra info is attached.
