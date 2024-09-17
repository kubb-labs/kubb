[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / collapseTextChangeRangesAcrossMultipleVersions

# collapseTextChangeRangesAcrossMultipleVersions()

```ts
function collapseTextChangeRangesAcrossMultipleVersions(changes): TextChangeRange
```

Called to merge all the changes that occurred across several versions of a script snapshot
into a single change.  i.e. if a user keeps making successive edits to a script we will
have a text change from V1 to V2, V2 to V3, ..., Vn.

This function will then merge those changes into a single change range valid between V1 and
Vn.

## Parameters

• **changes**: readonly [`TextChangeRange`](../interfaces/TextChangeRange.md)[]

## Returns

[`TextChangeRange`](../interfaces/TextChangeRange.md)

## Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8496
