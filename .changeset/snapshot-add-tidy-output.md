---
'@kubb/cli': patch
'@kubb/core': patch
---

Keep `kubb studio snapshot` to its three step lines and the summary, instead of one line per generated file, and show the expiry as a date. `kubb add` shows only the first sentence of an extension's description.

Shorten command descriptions in help and wrap long Studio status values below their labels on narrow terminals.

Remove the empty heading and extra spacer between the mascot and the first text in interactive commands.

Lead generation summaries with the outcome and duration, label plugin results, and show added, modified, deleted, and unchanged output files. Show compact line-change totals and label dry runs as plans without listing every file.
