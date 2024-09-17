[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / InvalidatedProjectBase

# InvalidatedProjectBase

## Extended by

- [`UpdateOutputFileStampsProject`](UpdateOutputFileStampsProject.md)
- [`BuildInvalidedProject`](BuildInvalidedProject.md)

## Properties

### kind

```ts
readonly kind: InvalidatedProjectKind;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9875

***

### project

```ts
readonly project: ResolvedConfigFileName;
```

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

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9880

***

### getCompilerOptions()

```ts
getCompilerOptions(): CompilerOptions
```

#### Returns

[`CompilerOptions`](CompilerOptions.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9881

***

### getCurrentDirectory()

```ts
getCurrentDirectory(): string
```

#### Returns

`string`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9882
