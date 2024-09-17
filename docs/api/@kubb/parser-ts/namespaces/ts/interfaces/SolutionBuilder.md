[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / SolutionBuilder

# SolutionBuilder\<T\>

## Type Parameters

• **T** *extends* [`BuilderProgram`](BuilderProgram.md)

## Methods

### build()

```ts
build(
   project?, 
   cancellationToken?, 
   writeFile?, 
   getCustomTransformers?): ExitStatus
```

#### Parameters

• **project?**: `string`

• **cancellationToken?**: [`CancellationToken`](CancellationToken.md)

• **writeFile?**: [`WriteFileCallback`](../type-aliases/WriteFileCallback.md)

• **getCustomTransformers?**

#### Returns

[`ExitStatus`](../enumerations/ExitStatus.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9864

***

### buildReferences()

```ts
buildReferences(
   project, 
   cancellationToken?, 
   writeFile?, 
   getCustomTransformers?): ExitStatus
```

#### Parameters

• **project**: `string`

• **cancellationToken?**: [`CancellationToken`](CancellationToken.md)

• **writeFile?**: [`WriteFileCallback`](../type-aliases/WriteFileCallback.md)

• **getCustomTransformers?**

#### Returns

[`ExitStatus`](../enumerations/ExitStatus.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9866

***

### clean()

```ts
clean(project?): ExitStatus
```

#### Parameters

• **project?**: `string`

#### Returns

[`ExitStatus`](../enumerations/ExitStatus.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9865

***

### cleanReferences()

```ts
cleanReferences(project?): ExitStatus
```

#### Parameters

• **project?**: `string`

#### Returns

[`ExitStatus`](../enumerations/ExitStatus.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9867

***

### getNextInvalidatedProject()

```ts
getNextInvalidatedProject(cancellationToken?): undefined | InvalidatedProject<T>
```

#### Parameters

• **cancellationToken?**: [`CancellationToken`](CancellationToken.md)

#### Returns

`undefined` \| [`InvalidatedProject`](../type-aliases/InvalidatedProject.md)\<`T`\>

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9868
