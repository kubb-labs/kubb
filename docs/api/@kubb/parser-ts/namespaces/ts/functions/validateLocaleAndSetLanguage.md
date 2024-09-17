[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / validateLocaleAndSetLanguage

# validateLocaleAndSetLanguage()

```ts
function validateLocaleAndSetLanguage(
   locale, 
   sys, 
   errors?): void
```

Checks to see if the locale is in the appropriate format,
and if it is, attempts to set the appropriate language.

## Parameters

• **locale**: `string`

• **sys**

• **sys.fileExists**

• **sys.getExecutingFilePath?**

• **sys.readFile?**

• **sys.resolvePath?**

• **errors?**: [`Diagnostic`](../interfaces/Diagnostic.md)[]

## Returns

`void`

## Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8508
