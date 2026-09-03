---
'@kubb/studio': minor
'@kubb/cli': patch
---

Let Studio edit an array `defineConfig(...)` and comment a plugin out instead of deleting it.

`ConfigEdit` gains a `config` field that names which entry of an array config it targets, by index
or by the entry's `name`. Omitted, it targets the only entry, or the first one in an array. The
`configFile` view now lists every entry as `configs`, each with its own plugins, in place of the
single flat `plugins` list.

Two new operations, `disable-plugin` and `enable-plugin`, comment a plugin call out and back in.
The plugin's options stay on disk in the comment, so turning it back on restores them exactly, and
an `add-plugin` right after does not have to reconstruct them.

`kubb studio`'s `allowedPlugins` now unions the plugins of every config entry, not just the one it
generates from, so adding a plugin to an entry Studio isn't generating from no longer gets refused
on the next `generate`.
