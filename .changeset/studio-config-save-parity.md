---
'@kubb/core': patch
'@kubb/studio': patch
---

Make Kubb Studio generate the same code from its editor drafts as from the saved `kubb.config.ts`.

- Keep the options an adapter was created with on `adapter.options`, before defaults, as a plugin does. The agent merges Studio's adapter overrides onto them, so a default derived from another option, such as `emptySchemaType` from `unknownType`, follows a change to it, and Studio shows the option as unset. `Adapter['options']` is typed as the factory's input options now instead of its resolved options.
- Accept removing an option the config file does not set, instead of refusing the edit.
- Report diagnostics from a plugin that loads its own copy of `@kubb/core`, such as one installed in the project beside the Studio agent. Before, the agent dropped them, and a run passed that failed in the CLI.
- Write an SDK class to the output folder when its plugin groups by path, instead of failing with `Cannot read properties of undefined (reading 'split')`.
- Comment a plugin out of a one-line `plugins: [a(), b()]` array, which is also the shape `add-plugin` writes. Before, Studio refused with "shares a line with other code" and the plugin stayed on in the file.
