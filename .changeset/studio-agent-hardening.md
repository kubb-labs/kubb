---
'@kubb/studio': patch
'@kubb/core': patch
'@kubb/cli': patch
'@kubb/mcp': patch
---

Harden the `kubb studio` agent with safer config edits, sandbox spec checks, and live reloads of JavaScript configs.

- Send Studio a JSON copy of plugin options, so config functions are never callable from Studio, and accept only inline spec content in a sandbox agent.
- Validate each config edit on its own, refuse `__proto__`, `constructor`, and `prototype` keys, and rewrite only the text an edit targets, including in `module.exports` configs.
- Reload `kubb.config.js`, `.mjs`, and `.cjs` on every generation instead of keeping the first version.
- Warn with `KUBB_PLUGIN_NOT_FOUND` for a missing plugin dependency, count a throwing `kubb:plugin:setup` as a failed plugin, and keep the previous output when a run with `output.clean` fails early.
- Hash in-memory output the way it is written, and clarify the `kubb studio` log lines for in-memory runs, canceled runs, and a takeover.
