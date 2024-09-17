[API](../../../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../../../index.md) / [ts](../../../../../index.md) / [server](../../../index.md) / [protocol](../index.md) / EndInstallTypesEventBody

# EndInstallTypesEventBody

## Extends

- [`InstallTypesEventBody`](InstallTypesEventBody.md)

## Properties

### eventId

```ts
eventId: number;
```

correlation id to match begin and end events

#### Inherited from

[`InstallTypesEventBody`](InstallTypesEventBody.md).[`eventId`](InstallTypesEventBody.md#eventid)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2390

***

### packages

```ts
packages: readonly string[];
```

list of packages to install

#### Inherited from

[`InstallTypesEventBody`](InstallTypesEventBody.md).[`packages`](InstallTypesEventBody.md#packages)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2394

***

### success

```ts
success: boolean;
```

true if installation succeeded, otherwise false

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2402
