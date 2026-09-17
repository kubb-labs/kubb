---
'@kubb/studio': patch
---

Stop holding a whole generation's output in memory for the life of a Studio session.

`studio:files` and `studio:snapshot` used to read every generated file into one `Record<string,
string>` the moment a run finished, and kept that map alive until the next generation. A run
producing gigabytes of source meant the agent process held gigabytes in RAM, whether or not anyone
ever opened a file or took a snapshot.

The agent now keeps the live `Storage` a run wrote through, plus the list of paths it produced, and
reads a file's content back from `Storage` only when `studio:files` or `studio:snapshot` actually
asks for it. A path outside that list is refused before it reaches storage, so this changes nothing
about what a session can read, only when the read happens.
