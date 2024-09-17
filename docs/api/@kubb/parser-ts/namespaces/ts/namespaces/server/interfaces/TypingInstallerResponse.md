[API](../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../index.md) / [ts](../../../index.md) / [server](../index.md) / TypingInstallerResponse

# TypingInstallerResponse

## Extended by

- [`InitializationFailedResponse`](InitializationFailedResponse.md)
- [`ProjectResponse`](ProjectResponse.md)

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

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2571
