---
"@kubb/cli": minor
---

`kubb init` takes its plugins from the Kubb registry and adds each one the way `kubb add` does: at the version the registry pins, and edited into `kubb.config.ts` by the same code. `--plugins` takes registry ids, so community plugins work too, and an id that is not in the registry stops init instead of falling back to the defaults.

Before it installs anything, `kubb init` checks the chosen plugins' manifests. When a plugin's `dependencies` are not all chosen, or a `consumer` plugin such as `plugin-react-query` has no client plugin, it names what is missing and stops. Before, `kubb generate` failed later with "No client plugin is registered".
