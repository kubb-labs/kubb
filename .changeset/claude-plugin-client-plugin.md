---
"@kubb/claude-plugin": patch
---

The Claude Code plugin now tells Claude that `plugin-react-query` and `plugin-vue-query` need `plugin-axios` or `plugin-fetch`. Before, `/kubb:init` could pick a framework plugin without a client plugin, and `/kubb:generate` then failed with "No client plugin is registered".
