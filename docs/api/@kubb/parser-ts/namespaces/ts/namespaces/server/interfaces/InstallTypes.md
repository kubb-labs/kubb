[API](../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../index.md) / [ts](../../../index.md) / [server](../index.md) / InstallTypes

# InstallTypes

## Extends

- [`ProjectResponse`](ProjectResponse.md)

## Extended by

- [`BeginInstallTypes`](BeginInstallTypes.md)
- [`EndInstallTypes`](EndInstallTypes.md)

## Properties

### eventId

```ts
readonly eventId: number;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2617

***

### kind

```ts
readonly kind: "event::beginInstallTypes" | "event::endInstallTypes";
```

#### Overrides

[`ProjectResponse`](ProjectResponse.md).[`kind`](ProjectResponse.md#kind)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2616

***

### packagesToInstall

```ts
readonly packagesToInstall: readonly string[];
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2619

***

### projectName

```ts
readonly projectName: string;
```

#### Inherited from

[`ProjectResponse`](ProjectResponse.md).[`projectName`](ProjectResponse.md#projectname)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2610

***

### typingsInstallerVersion

```ts
readonly typingsInstallerVersion: string;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2618
