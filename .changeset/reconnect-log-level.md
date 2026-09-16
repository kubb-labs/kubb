---
'@kubb/studio': patch
'@kubb/cli': patch
---

The background reconnect loop's "Retrying connection" and "Reconnect attempt failed" lines, and
the teardown notice `disconnect()` prints on the way out, now go through `console.error` instead
of `console.info`/`console.log`, and only print when a host passes a `logLevel` above `silent` to
`StudioSession`. Previously they always printed unconditionally, which a CI runner that only
streams a child process's stderr live (such as `kubb-labs/action`) never surfaces, and which
contradicted `installLogger`'s own "prints nothing when left out" default.

`kubb studio` and `kubb studio snapshot` now pass their `--log-level` flag through, so these lines
respect the same flag as the rest of the command's output.
