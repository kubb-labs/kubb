[API](../../../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../../../index.md) / [ts](../../../../../index.md) / [server](../../../index.md) / [protocol](../index.md) / TodoCommentRequestArgs

# TodoCommentRequestArgs

Arguments for TodoCommentRequest request.

## Extends

- [`FileRequestArgs`](FileRequestArgs.md)

## Properties

### descriptors

```ts
descriptors: TodoCommentDescriptor[];
```

Array of target TodoCommentDescriptors that describes TODO comments to be found

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:285

***

### file

```ts
file: string;
```

The file for the request (absolute pathname required).

#### Inherited from

[`FileRequestArgs`](FileRequestArgs.md).[`file`](FileRequestArgs.md#file)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:241

***

### projectFileName?

```ts
optional projectFileName: string;
```

#### Inherited from

[`FileRequestArgs`](FileRequestArgs.md).[`projectFileName`](FileRequestArgs.md#projectfilename)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:242
