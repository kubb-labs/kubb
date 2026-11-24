---
'@kubb/core': patch
'@kubb/mcp': patch
'@kubb/cli': patch
---

Fix error reporting and listener leaks in the build, and limit what an AI client and a server URL can reach.

- The MCP `generate` tool refuses an `output` path outside the working directory, and an `input` path outside it unless the input is an `http:` or `https:` URL. Before, a client could make `output.clean` empty a folder elsewhere on the machine.
- A plugin that reports two different warnings without a location now shows both. Before, only the first one survived.
- An error thrown in a plugin's `kubb:build:start`, `kubb:plugins:end`, `kubb:build:end` or `kubb:plugin:end` hook names that plugin and counts it as failed, instead of reporting `KUBB_UNKNOWN`.
- An invalid `input` no longer leaves plugin listeners behind. Before, the next config in a `defineConfig([...])` array also ran the previous config's hooks.
- Calling `kubb.setup()` before `kubb.generate()` no longer runs each plugin hook twice.
- Opening a link in the browser accepts only `http:` and `https:` URLs and local report paths. On Windows it no longer goes through `cmd`, so a `&` in a URL cannot start another command.
