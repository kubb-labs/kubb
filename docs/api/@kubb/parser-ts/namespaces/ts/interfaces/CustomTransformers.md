[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / CustomTransformers

# CustomTransformers

## Properties

### after?

```ts
optional after: (CustomTransformerFactory | TransformerFactory<SourceFile>)[];
```

Custom transformers to evaluate after built-in .js transformations.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6077

***

### afterDeclarations?

```ts
optional afterDeclarations: (CustomTransformerFactory | TransformerFactory<SourceFile | Bundle>)[];
```

Custom transformers to evaluate after built-in .d.ts transformations.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6079

***

### before?

```ts
optional before: (CustomTransformerFactory | TransformerFactory<SourceFile>)[];
```

Custom transformers to evaluate before built-in .js transformations.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6075
