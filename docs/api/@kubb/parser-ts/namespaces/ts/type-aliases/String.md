[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / \_\_String

# \_\_String

```ts
type __String: string & object | void & object | InternalSymbolName;
```

This represents a string whose leading underscore have been escaped by adding extra leading underscores.
The shape of this brand is rather unique compared to others we've used.
Instead of just an intersection of a string and an object, it is that union-ed
with an intersection of void and an object. This makes it wholly incompatible
with a normal string (which is good, it cannot be misused on assignment or on usage),
while still being comparable with a normal string via === (also good) and castable from a string.

## Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6510
