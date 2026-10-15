---
'@kubb/studio': minor
---

Add `readDiff` to the agent, so Studio can show the diff of a large generated file without downloading it whole. The agent compares the file between two kept sets and returns only the changed lines with three lines of context, one page at a time. Studio reads more pages as you scroll. Reading a diff needs the same `--allow-read` permission as reading files.
