[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / transform

# transform()

```ts
function transform<T>(
   source, 
   transformers, 
compilerOptions?): TransformationResult<T>
```

Transform one or more nodes using the supplied transformers.

## Type Parameters

• **T** *extends* [`Node`](../interfaces/Node.md)

## Parameters

• **source**: `T` \| `T`[]

A single `Node` or an array of `Node` objects.

• **transformers**: [`TransformerFactory`](../type-aliases/TransformerFactory.md)\<`T`\>[]

An array of `TransformerFactory` callbacks used to process the transformation.

• **compilerOptions?**: [`CompilerOptions`](../interfaces/CompilerOptions.md)

Optional compiler options.

## Returns

[`TransformationResult`](../interfaces/TransformationResult.md)\<`T`\>

## Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:11326
