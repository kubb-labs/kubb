[API](../../../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../../../index.md) / [ts](../../../../../index.md) / [server](../../../index.md) / [protocol](../index.md) / MapCodeRequestDocumentMapping

# MapCodeRequestDocumentMapping

## Properties

### contents

```ts
contents: string[];
```

The specific code to map/insert/replace in the file.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1783

***

### focusLocations?

```ts
optional focusLocations: TextSpan[][];
```

Areas of "focus" to inform the code mapper with. For example, cursor
location, current selection, viewport, etc. Nested arrays denote
priority: toplevel arrays are more important than inner arrays, and
inner array priorities are based on items within that array. Items
earlier in the arrays have higher priority.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1791
