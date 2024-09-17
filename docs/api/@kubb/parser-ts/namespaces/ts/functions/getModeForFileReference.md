[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / getModeForFileReference

# getModeForFileReference()

```ts
function getModeForFileReference(ref, containingFileMode): ResolutionMode
```

Calculates the resulting resolution mode for some reference in some file - this is generally the explicitly
provided resolution mode in the reference, unless one is not present, in which case it is the mode of the containing file.

## Parameters

• **ref**: `string` \| [`FileReference`](../interfaces/FileReference.md)

• **containingFileMode**: [`ResolutionMode`](../type-aliases/ResolutionMode.md)

## Returns

[`ResolutionMode`](../type-aliases/ResolutionMode.md)

## Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9425
