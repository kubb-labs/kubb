---
layout: doc
title: Customize generated code with printers
description: Printers turn Kubb's AST schema nodes into generated code. The
  printer option on plugin-ts, plugin-zod, and plugin-faker replaces the handler
  for a single schema type, so you change what one plugin emits without forking
  it.
outline: deep
order: 5
navigation:
  title: Customize generated code with printers
  icon: i-iconoir-printing-page
---

# Customize generated code with printers

Set `printer.nodes` on TypeScript, Zod, or Faker plugins to change how schema types are emitted. Override only the handlers you need.

Write handlers as regular methods, not arrow functions, when they use `this.base`, `this.transform`, or `this.options`. See [printer handlers](/docs/5.x/reference/kit/ast#printer-handlers-and-context) for the context and signatures. To change the schema itself before every output, use a [macro](/docs/5.x/how-to/macros) instead.

## TypeScript types

`@kubb/plugin-ts` prints type strings, so a handler returns the TypeScript type as a string. This override prints `date` schemas as the JavaScript `Date` object instead of `string`.

```typescript [date.ts]
import { pluginTs } from '@kubb/plugin-ts'

pluginTs({
  printer: {
    nodes: {
      date() {
        return 'Date'
      },
    },
  },
})
```

Inside a handler, `this.transform(node)` returns the printed type of a nested schema as a string. This is a breaking change for handlers that passed that result into `ts.factory`: build the type as a string instead.

## Zod schemas

`@kubb/plugin-zod` prints expression strings, so a handler returns the Zod code as a string. With `mini: true` the same overrides target the Zod Mini printer instead.

```typescript [date.ts]
import { pluginZod } from '@kubb/plugin-zod'

pluginZod({
  printer: {
    nodes: {
      date() {
        return 'z.iso.date()'
      },
    },
  },
})
```

Use `this.base` to keep the default output and decorate it. This override appends `.openapi(...)` to every object schema, and nested nodes still print through the regular handlers.

```typescript [openapi.ts]
import { pluginZod } from '@kubb/plugin-zod'

pluginZod({
  printer: {
    nodes: {
      object(node) {
        return `${this.base(node)}.openapi(${JSON.stringify({ description: node.description })})`
      },
    },
  },
})
```

A Zod handler can also read `this.options.direction`, which is `'decode'` while printing response schemas and `'encode'` while printing request bodies and parameters. Return a different expression per direction and the plugin treats the node as a two-way conversion, emitting an `${name}InputSchema` variant that request bodies resolve to. See [Encode a custom type on requests](/extensions/kubb-labs/plugin-zod/guides/customization#encode-custom-types).

## Faker mocks

`@kubb/plugin-faker` also prints strings, one Faker expression per schema node. This override generates floats where the spec declares integers.

```typescript [integer.ts]
import { pluginFaker } from '@kubb/plugin-faker'

pluginFaker({
  printer: {
    nodes: {
      integer() {
        return 'faker.number.float()'
      },
    },
  },
})
```
