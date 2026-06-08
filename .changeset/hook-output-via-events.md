---
'@kubb/core': minor
'@kubb/cli': patch
---

Route hook subprocess output through events instead of a sink-factory callback.

Hook output (formatter, linter, and `done` hooks) now reaches loggers over the event emitter: a new `kubb:hook:line` event carries each streamed stdout line while a hook runs, and `kubb:hook:end` gained optional `stdout`/`stderr` fields holding a failed hook's captured output. The CLI's `makeSink`/`HookSinkFactory` channel and its threading are removed, so loggers are pure event subscribers and the runner decides whether to stream from the `kubb:hook:line` listener count. Behavior is unchanged: clack still streams live dimmed lines, the plain logger still prints failure output, and a failed hook's output still surfaces at the silent log level.
