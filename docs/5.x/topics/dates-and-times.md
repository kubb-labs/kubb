---
layout: doc
title: Dates and times - Types, schemas, and mocks
description: See how Kubb types, validates, and mocks date-time, date, and time fields in plugin-ts, plugin-zod, and plugin-faker, set by the adapter's dateType.
outline:
  - 2
  - 3
order: 1
navigation:
  title: Dates and times
  icon: i-iconoir-calendar
---

# Dates and times

How each plugin types, validates, and mocks `date-time`, `date`, and `time` fields. Read it when a generated date does not match what your API sends.

## How each plugin handles a date {#dates-and-times}

The adapter's [`dateType`](/extensions/kubb-labs/adapter-oas/options#datetype) sets the type, and the plugins follow it. For a `date-time` field:

| Plugin | `'string'`, `'stringOffset'`, or `'stringLocal'` | `'date'` |
| --- | --- | --- |
| `@kubb/plugin-ts` | `string` | `Date` |
| `@kubb/plugin-zod` | `z.iso.datetime()`, with `{ offset: true }` or `{ local: true }` for the offset and local values | A `Date` in response schemas, an ISO string in request schemas |
| `@kubb/plugin-zod` with `mini: true` | `z.string()` | `z.date()`, without the conversion |
| `@kubb/plugin-faker` | A string, formatted by [`dateParser`](#mock-dates-with-faker) | `faker.date.anytime()`. A `dateParser` other than `'faker'` cannot format a `Date`, so generation fails. |

- The string values all type the field as `string`. Schema plugins such as `@kubb/plugin-zod` check the offset or local format.
- A `Date` needs parsing to revive it from JSON.

### Set each format on its own {#date-type-object}

Pass an object to `dateType` to give `date-time`, `date`, and `time` different types.

- `dateTime` takes every `dateType` value.
- `date` and `time` take `false`, `'string'`, or `'date'`.
- A key you leave out is `'string'`, whatever the other keys are.

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'
import { adapterOas } from '@kubb/adapter-oas'

export default defineConfig({
  input: './petStore.yaml',
  output: { path: './src/gen' },
  adapter: adapterOas({
    dateType: {
      dateTime: 'date', // Date object for timestamps
      date: 'string',
      time: 'string',
    },
  }),
})
```

### Convert dates in Zod schemas {#zod-dates}

Set `dateType: 'date'` on the adapter for built-in conversion. Response schemas then convert ISO date-times to `Date`, and request schemas convert them back with `toISOString()`. With `mini: true`, both print a plain `z.date()` without the conversion.

```typescript [src/gen/zod/dateFieldSchema.ts]
export const dateFieldSchema = z.iso.datetime().transform((value) => new Date(value))

export const dateFieldInputSchema = z.date().transform((value) => value.toISOString())
```

For other date types, such as `Temporal`, see [Encode custom types](/extensions/kubb-labs/plugin-zod/guides/customization#encode-custom-types).

### Mock dates with Faker {#mock-dates-with-faker}

`@kubb/plugin-faker` formats string dates with the library you set in [`dateParser`](/extensions/kubb-labs/plugin-faker/options#dateparser). With `dateType: 'date'`, a `dateParser` other than `'faker'` cannot format the `Date`, so generation fails.

| Format | `'faker'` (default) | Any other `dateParser` |
| --- | --- | --- |
| `date` | `YYYY-MM-DD` | `YYYY-MM-DD` |
| `time` | `HH:mm:ss` | `HH:mm:ss` |
| `date-time` | `toISOString()` output | `YYYY-MM-DDTHH:mm:ss[Z]`, without the `Z` for a local date-time, and with a numeric offset when the schema declares one |

Any other module name renders a `date` field as `name(faker.date.anytime()).format("YYYY-MM-DD")`.

- The module needs a default export with the dayjs API.
- Kubb imports it under the camelCased module name, so `'my-date-lib'` becomes `myDateLib` and `'@scope/lib'` becomes `scopeLib`.
