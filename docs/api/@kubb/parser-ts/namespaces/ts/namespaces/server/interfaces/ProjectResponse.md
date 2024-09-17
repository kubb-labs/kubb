[API](../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../index.md) / [ts](../../../index.md) / [server](../index.md) / ProjectResponse

# ProjectResponse

## Extends

- [`TypingInstallerResponse`](TypingInstallerResponse.md)

## Extended by

- [`PackageInstalledResponse`](PackageInstalledResponse.md)
- [`InvalidateCachedTypings`](InvalidateCachedTypings.md)
- [`InstallTypes`](InstallTypes.md)
- [`SetTypings`](SetTypings.md)
- [`WatchTypingLocations`](WatchTypingLocations.md)

## Properties

### kind

```ts
readonly kind: 
  | "action::set"
  | "action::invalidate"
  | "event::typesRegistry"
  | "action::packageInstalled"
  | "event::beginInstallTypes"
  | "event::endInstallTypes"
  | "event::initializationFailed"
  | "action::watchTypingLocations";
```

#### Inherited from

[`TypingInstallerResponse`](TypingInstallerResponse.md).[`kind`](TypingInstallerResponse.md#kind)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2571

***

### projectName

```ts
readonly projectName: string;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2610
