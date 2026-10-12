---
'@kubb/core': minor
'@kubb/kit': minor
'@kubb/cli': patch
---

`definePlugin` accepts a `schema`: any Standard Schema, such as a Zod schema. It validates the options when the factory is called, applies their defaults, and types `setup`.

```ts
import { z } from 'zod'
import { definePlugin, type PluginType } from 'kubb/kit'

const optionsSchema = z.object({ prefix: z.string().default('Api') })

export type PluginExample = PluginType<'plugin-example', typeof optionsSchema>

export const pluginExample = definePlugin<PluginExample>({
  meta: { name: 'plugin-example' },
  schema: optionsSchema,
  setup(options) {
    // options.prefix is a string, 'Api' by default
    return options
  },
})
```

- `PluginType` takes the schema as its options type. `options` is the schema's input type, and `setup` receives its output type. `PluginOptions<typeof optionsSchema>` gives the input type.
- The plugin keeps the raw options on `options` and the parsed ones on `parsedOptions`. The factory exposes the schema as `pluginExample.schema`.
- Invalid options throw `KUBB_INVALID_OPTIONS`, naming the plugin and each option path, such as `enum.type`. A schema that validates asynchronously is refused.
- `kubb generate` now reports a diagnostic thrown while the config file loads with its code and fix, instead of only `Config failed loading`.

`PluginFactoryOptions` gains a `parsedOptions` key. Factory option types built with `PluginFactoryOptions<...>` or `PluginType<...>` get it automatically. A type written out by hand needs `parsedOptions`, usually the same type as `options`.
