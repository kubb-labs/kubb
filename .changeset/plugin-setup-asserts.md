---
'@kubb/core': patch
'@kubb/kit': patch
---

Add generic checks for plugin setup, so plugins no longer need their own helpers.

- `ctx.requirePlugin(name)` in `kubb:plugin:setup` returns the plugin, or fails the run with `KUBB_PLUGIN_NOT_FOUND`. The error names the plugin that needs it.
- `assertPluginOption({ plugin, option, value, allowed })` fails with `KUBB_INVALID_PLUGIN_OPTIONS` and lists the allowed values when an option holds anything else.
- `createMockedSetupContext()` in `@kubb/kit/testing` builds the setup context for unit tests. Its `requirePlugin` fails like the real one.

A plugin listed in `dependencies` but missing from the config no longer logs a `KUBB_PLUGIN_NOT_FOUND` warning. `dependencies` still declares the plugins a plugin builds on; call `ctx.requirePlugin` as well when the plugin cannot work without one.
