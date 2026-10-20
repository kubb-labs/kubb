---
'@kubb/core': patch
'@kubb/studio': patch
---

Make Kubb Studio generate the same code from its editor drafts as from the saved `kubb.config.ts`.

- Keep the options an adapter was created with on `adapter.rawOptions`. The agent merges Studio's adapter overrides onto them, so a default derived from another option, such as `emptySchemaType` from `unknownType`, follows a change to it.
- Accept removing an option the config file does not set, instead of refusing the edit.
- Report diagnostics from a plugin that loads its own copy of `@kubb/core`, such as one installed in the project beside the Studio agent. Before, the agent dropped them, and a run passed that failed in the CLI.
- Write an SDK class to the output folder when its plugin groups by path, instead of failing with `Cannot read properties of undefined (reading 'split')`.
