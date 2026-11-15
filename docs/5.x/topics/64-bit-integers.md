---
layout: doc
title: 64-bit integers - int64 types, mocks, and JSON
description: See how Kubb types, validates, mocks, and sends int64 and uint64 fields, and when a bigint throws instead of losing precision in JSON.
outline:
  - 2
  - 3
order: 2
navigation:
  title: 64-bit integers
  icon: i-iconoir-hashtag
---

# 64-bit integers

How each plugin types, validates, mocks, and sends `int64` and `uint64` fields. Read it when large IDs lose precision or a `bigint` fails to serialize.

## How each plugin handles an int64 field {#64-bit-integers}

The adapter's [`integerType`](/extensions/kubb-labs/adapter-oas/options#integertype) sets the type of a schema with `format: int64` or `format: uint64`. Other integers are always `number`.

| Plugin | `'bigint'` (default) | `'number'` |
| --- | --- | --- |
| `@kubb/plugin-ts` | `bigint` | `number` |
| `@kubb/plugin-zod` | `z.coerce.bigint()` | `z.int()` |
| `@kubb/plugin-faker` | A `bigint` | A `number` |
| `@kubb/plugin-msw` | Sends the Faker `bigint` as a JSON number | A JSON number |
| `@kubb/plugin-axios`, `@kubb/plugin-fetch` | Sends a `bigint` in a request body as a JSON number | A JSON number |

> [!WARNING]
> A `number` loses precision above `Number.MAX_SAFE_INTEGER`. Keep the default `bigint` for larger IDs and pass them as `123n`.

### Pick the type for every plugin {#integer-type}

Set `integerType` on the adapter to change `int64` fields in every plugin at once. With `integerType: 'number'`, an example can pass `123` as an `int64` ID.

A `@kubb/plugin-zod` printer handler changes one plugin only. Its `integer` handler controls `int32` fields on its own. To print `int64` fields as `z.int()` in Zod alone, replace the `bigint` handler, as in [Use numbers for int64 fields](/extensions/kubb-labs/plugin-zod/guides/customization#use-numbers-for-int64-fields).

### Send a bigint as JSON {#bigint-json}

`JSON.stringify` cannot write a `bigint`, so the generated code passes a replacer.

- The clients of `@kubb/plugin-axios` and `@kubb/plugin-fetch` send a `bigint` in a request body as a JSON number. See [Encode request bodies](/extensions/kubb-labs/plugin-fetch/guides/serialization#encode-request-bodies).
- `@kubb/plugin-msw` handlers send a Faker `bigint` as a JSON number.
- A value outside the safe-integer range throws a `TypeError` instead of losing precision.

### int64 values sent as strings {#int64-strings}

A schema with `type: string` stays a `string` whatever its `format`. The [ProtoJSON](https://protobuf.dev/programming-guides/json/#int64-strings) `int64` strings that gRPC-gateway sends stay strings too.

- `@kubb/plugin-zod` checks them with a digits regex.
- `@kubb/plugin-faker` mocks them as numeric strings.

### bigint in the AST {#bigint-ast}

For plugin authors: a schema node of type `integer` prints as `number`. A `bigint` node appears only when the adapter's `integerType` is `'bigint'`. See [Schema node types](/docs/5.x/reference/kit/ast#schema-node-types).
