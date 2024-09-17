[API](../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../index.md) / [ts](../../../index.md) / [server](../index.md) / ITypingsInstaller

# ITypingsInstaller

## Properties

### globalTypingsCacheLocation

```ts
readonly globalTypingsCacheLocation: undefined | string;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2685

## Methods

### attach()

```ts
attach(projectService): void
```

#### Parameters

• **projectService**: [`ProjectService`](../classes/ProjectService.md)

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2683

***

### enqueueInstallTypingsRequest()

```ts
enqueueInstallTypingsRequest(
   p, 
   typeAcquisition, 
   unresolvedImports): void
```

#### Parameters

• **p**: [`Project`](../classes/Project.md)

• **typeAcquisition**: [`TypeAcquisition`](../../../interfaces/TypeAcquisition.md)

• **unresolvedImports**: `undefined` \| [`SortedReadonlyArray`](../../../interfaces/SortedReadonlyArray.md)\<`string`\>

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2682

***

### installPackage()

```ts
installPackage(options): Promise<ApplyCodeActionCommandResult>
```

#### Parameters

• **options**: [`InstallPackageOptionsWithProject`](InstallPackageOptionsWithProject.md)

#### Returns

`Promise`\<[`ApplyCodeActionCommandResult`](../../../interfaces/ApplyCodeActionCommandResult.md)\>

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2681

***

### isKnownTypesPackageName()

```ts
isKnownTypesPackageName(name): boolean
```

#### Parameters

• **name**: `string`

#### Returns

`boolean`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2680

***

### onProjectClosed()

```ts
onProjectClosed(p): void
```

#### Parameters

• **p**: [`Project`](../classes/Project.md)

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2684
