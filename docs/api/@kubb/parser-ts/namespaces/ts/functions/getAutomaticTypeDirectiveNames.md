[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / getAutomaticTypeDirectiveNames

# getAutomaticTypeDirectiveNames()

```ts
function getAutomaticTypeDirectiveNames(options, host): string[]
```

Given a set of options, returns the set of type directive names
  that should be included for this program automatically.
This list could either come from the config file,
  or from enumerating the types root + initial secondary types lookup location.
More type directives might appear in the program later as a result of loading actual source files;
  this list is only the set of defaults that are implicitly included.

## Parameters

• **options**: [`CompilerOptions`](../interfaces/CompilerOptions.md)

• **host**: [`ModuleResolutionHost`](../interfaces/ModuleResolutionHost.md)

## Returns

`string`[]

## Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9222
