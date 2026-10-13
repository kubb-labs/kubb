---
layout: doc
title: HTTP serialization
description: Default parameter styles and serialized values for generated Fetch and Axios clients.
outline: deep
order: 9
navigation:
  title: HTTP serialization
  icon: i-iconoir-network
---

# HTTP serialization

Fetch and Axios clients use the OpenAPI operation's serialization metadata to encode path, query, header, and cookie parameters.

## Parameter styles

### Query

Query parameters default to the `form` style. Arrays explode into repeated keys unless the spec
says otherwise, and `spaceDelimited`, `pipeDelimited`, and `deepObject` change how arrays and
objects collapse.

| Style              | `explode` | Input              | Result            |
| ------------------ | --------- | ------------------ | ----------------- |
| `form` (default)   | `true`    | `{ id: [3, 4, 5] }` | `id=3&id=4&id=5`  |
| `form`             | `false`   | `{ id: [3, 4, 5] }` | `id=3,4,5`        |
| `spaceDelimited`   | `false`   | `{ id: [3, 4, 5] }` | `id=3%204%205`    |
| `pipeDelimited`    | `false`   | `{ id: [3, 4, 5] }` | `id=3\|4\|5`      |
| `deepObject`       | `n/a`     | `{ a: { b: 1 } }`  | `a%5Bb%5D=1`      |

With `explode: true`, `spaceDelimited` and `pipeDelimited` fall back to repeated keys like `form`,
so the delimiter only shows with `explode: false`.

### Path

Path parameters default to the `simple` style, which emits the bare value. `label` prefixes a
`.` and `matrix` prefixes a `;name=` segment. The results below are the serialized segment for a
parameter named `id`.

| Style              | `explode` | Input            | Result             |
| ------------------ | --------- | ---------------- | ------------------ |
| `simple` (default) | `false`   | `[3, 4, 5]`      | `3,4,5`            |
| `label`            | `true`    | `[3, 4, 5]`      | `.3.4.5`           |
| `matrix`           | `true`    | `[3, 4, 5]`      | `;id=3;id=4;id=5`  |
| `simple`           | `false`   | `{ x: 1, y: 2 }` | `x,1,y,2`          |

### Header and cookie

Header parameters use the `simple` style and cookie parameters use the `form` style. Both fix the
style and only let `explode` vary, so the metadata for these locations carries `explode` alone.
Header values are sent as-is, and cookie values are URL-encoded into a single `Cookie` header.

| Location | `explode` | Input                            | Result                  |
| -------- | --------- | -------------------------------- | ----------------------- |
| header   | `false`   | `[3, 4]`                         | `X-Ids: 3,4`            |
| header   | `true`    | `{ role: 'admin' }`              | `X-Filter: role=admin`  |
| cookie   | `false`   | `{ session: 'abc', ids: [1, 2] }` | `session=abc; ids=1,2`  |
| cookie   | `true`    | `{ ids: [1, 2] }`                | `ids=1; ids=2`          |

For custom serializers, body codecs, response decoding, and validation, see [Configure serialization](/extensions/kubb-labs/plugin-fetch/guides/serialization).
