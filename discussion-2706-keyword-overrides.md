# Discussion #2706 — Overriding keyword output in v5

Reply for https://github.com/orgs/kubb-labs/discussions/2706

---

In **v5 this is now possible** without copying any plugin code. Every code-producing plugin (`plugin-zod`, `plugin-faker`, `plugin-ts`) ships a *printer* with a `printer.nodes` option: a map of schema node type → handler that **globally** overrides the built-in output for *every* node of that type — exactly the "all keys of a type" override `mapper` couldn't do (`mapper` is per-name).

```ts
import { pluginZod } from '@kubb/plugin-zod'
import { pluginFaker } from '@kubb/plugin-faker'

pluginZod({
  printer: {
    nodes: {
      datetime: () => 'z.string().datetime()', // default: z.iso.datetime()
      date: () => 'z.string().date()',         // default: z.iso.date()
    },
  },
}),
pluginFaker({
  printer: {
    nodes: {
      datetime: () => 'faker.date.past().toISOString()', // default: faker.date.anytime().toISOString()
    },
  },
}),
```

The override keys are the schema types: `string`, `number`, `integer`, `bigint`, `boolean`, `date`, `datetime`, `time`, `uuid`, `email`, `url`, `ipv4`, `ipv6`, `blob`, `object`, `array`, `enum`, `union`, `ref`, etc. Handlers receive the node and can use `this.options` and `this.transform(node)` to recurse, so you can branch on the node's own metadata rather than its property name.

Verified on `5.0.0-beta.35` with a spec containing `format: date-time` and `format: date` fields:

| | default | with `printer.nodes` |
|---|---|---|
| zod datetime | `z.iso.datetime()` | `z.string().datetime()` |
| zod date | `z.iso.date()` | `z.string().date()` |
| faker datetime | `faker.date.anytime().toISOString()` | `faker.date.past().toISOString()` |

Types you don't override keep their built-in handlers. For zod, with `mini: true` the overrides target the Zod Mini printer.
