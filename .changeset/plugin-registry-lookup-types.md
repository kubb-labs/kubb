---
'@kubb/core': minor
'@kubb/mcp': patch
---

Type plugin lookups by name through `Kubb.PluginRegistry`.

`getPlugin`, `requirePlugin`, and `getResolver` (on the generator context, `KubbBuildStartContext`, and `KubbDriver`) now take a single signature keyed on the plugin name: a name registered in `Kubb.PluginRegistry` resolves to that plugin's exact factory options, any other string falls back to the generic `Plugin`. Registered names autocomplete, and the `dependencies` field on a plugin autocompletes them too. Two helpers back this and are exported from `@kubb/core`: `PluginName` (the accepted name type) and `ResolvePluginOptions<TName>` (name to factory options).

`Reporter.name` and `UserReporter.name` accept `LiteralUnion<ReporterName>`, so the built-in `cli`/`json`/`file` names autocomplete while custom reporter names still assign.

Breaking: the explicit type-argument form `getPlugin<MyOptions>(name)` is gone, since the type parameter is now the plugin name rather than the options type. Register the plugin in `Kubb.PluginRegistry` and call it by name with no type argument to get the typed result.
