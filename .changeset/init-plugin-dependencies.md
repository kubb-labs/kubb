---
"@kubb/cli": minor
---

`kubb init` checks the chosen plugins against their `kubb-extension.json` after it installs them. When a plugin's `dependencies` are not all chosen, or a `consumer` plugin such as `plugin-react-query` has no client plugin, it names what is missing and exits without writing `kubb.config.ts`. Before, `kubb generate` failed later with "No client plugin is registered".
