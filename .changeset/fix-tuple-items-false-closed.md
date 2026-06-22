---
'@kubb/adapter-oas': patch
---

Close tuples when `prefixItems` is paired with `items: false`.

A `prefixItems` schema with `items: false` is the canonical closed-tuple pattern in JSON Schema 2020-12 / OpenAPI 3.1: the prefix defines the positions and `items: false` forbids any extra elements. The boolean was being read as a falsy rest schema, so the tuple gained a stray `...any[]` tail (`[number, number, ...any[]]`) that both allowed extra elements and widened them to `any`. The rest element is now omitted, producing a closed `[number, number]`. An absent `items` still widens the tail to `any`, and `items: true` keeps the unconstrained rest.
