[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / UpdateOutputFileStampsProject

# UpdateOutputFileStampsProject

## Extends

- [`InvalidatedProjectBase`](InvalidatedProjectBase.md)

## Properties

### kind

```ts
readonly kind: UpdateOutputFileStamps;
```

#### Overrides

[`InvalidatedProjectBase`](InvalidatedProjectBase.md).[`kind`](InvalidatedProjectBase.md#kind)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9885

***

### project

```ts
readonly project: ResolvedConfigFileName;
```

#### Inherited from

[`InvalidatedProjectBase`](InvalidatedProjectBase.md).[`project`](InvalidatedProjectBase.md#project)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9876

## Methods

### done()

```ts
done(
   cancellationToken?, 
   writeFile?, 
   customTransformers?): ExitStatus
```

To dispose this project and ensure that all the necessary actions are taken and state is updated accordingly

#### Parameters

• **cancellationToken?**: [`CancellationToken`](CancellationToken.md)

• **writeFile?**: [`WriteFileCallback`](../type-aliases/WriteFileCallback.md)

• **customTransformers?**: [`CustomTransformers`](CustomTransformers.md)

#### Returns

[`ExitStatus`](../enumerations/ExitStatus.md)

#### Inherited from

[`InvalidatedProjectBase`](InvalidatedProjectBase.md).[`done`](InvalidatedProjectBase.md#done)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9880

***

### getCompilerOptions()

```ts
getCompilerOptions(): CompilerOptions
```

#### Returns

[`CompilerOptions`](CompilerOptions.md)

#### Inherited from

[`InvalidatedProjectBase`](InvalidatedProjectBase.md).[`getCompilerOptions`](InvalidatedProjectBase.md#getcompileroptions)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9881

***

### getCurrentDirectory()

```ts
getCurrentDirectory(): string
```

#### Returns

`string`

#### Inherited from

[`InvalidatedProjectBase`](InvalidatedProjectBase.md).[`getCurrentDirectory`](InvalidatedProjectBase.md#getcurrentdirectory)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9882

***

### updateOutputFileStatmps()

```ts
updateOutputFileStatmps(): void
```

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9886
