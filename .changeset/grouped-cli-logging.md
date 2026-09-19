---
'@kubb/cli': minor
'@kubb/core': minor
---

Group `kubb generate` output per config, with a spinner that reports each phase as started, then done or failed.

- A `Configuration` group opens first: it spins while the config loads, then reports the file it loaded or the failure.
- Each named config gets its own group, from its name and input down to its summary and its success or failure line.
- Formatting, linting, and post-generate hooks each get their own spinner and one result line with a duration. A failed hook ends its phase on the error symbol instead of reading as done.
- A hook's streamed output is collected and printed under the phase it belongs to, so nothing is drawn over.
- The plain writer prints the same ordered phases and summaries, without the animation.

`@kubb/core` gains `createCliReporter`, which takes a `render` callback so a host can write the summary through output it already owns. The exported `cliReporter` still writes to the console.

```ts
import { createCliReporter } from '@kubb/core'

const reporter = createCliReporter({ render: (lines) => lines.forEach((line) => myLogger.info(line)) })
```
