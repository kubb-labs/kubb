---
'@kubb/core': minor
'@kubb/kit': minor
'@kubb/studio': minor
'@kubb/cli': patch
---

Let a plugin describe and validate its options with any Standard Schema validator, such as Zod.

- Pass `{ schema, jsonSchema }` as the second argument of `definePlugin`. The factory receives the parsed options with their defaults, and invalid options throw `KUBB_INVALID_PLUGIN_OPTIONS` naming each option path.
- Add `getPluginOptionsJsonSchema(plugin)` to read a plugin's options as JSON Schema.
- Send that JSON Schema to Kubb Studio when the agent connects, so Studio can render the plugin's settings.
- Report a diagnostic thrown while the config file loads with its code and help, instead of only `Config failed loading`.

```ts
import { z } from 'zod'
import { definePlugin } from 'kubb/kit'

const optionsSchema = z.object({ prefix: z.string().default('Api') })

export const pluginExample = definePlugin<PluginExample>((options) => ({ name: 'plugin-example', options, hooks: {} }), {
  schema: optionsSchema,
})
```
