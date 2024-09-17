[API](../../../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../../../index.md) / [ts](../../../../../index.md) / [server](../../../index.md) / [protocol](../index.md) / TextSpanWithContext

# TextSpanWithContext

Object found in response messages defining a span of text in source code.

## Extends

- [`TextSpan`](TextSpan.md)

## Extended by

- [`FileSpanWithContext`](FileSpanWithContext.md)
- [`HighlightSpan`](HighlightSpan.md)
- [`RenameTextSpan`](RenameTextSpan.md)

## Properties

### contextEnd?

```ts
optional contextEnd: Location;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:772

***

### contextStart?

```ts
optional contextStart: Location;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:771

***

### end

```ts
end: Location;
```

One character past last character of the definition.

#### Inherited from

[`TextSpan`](TextSpan.md).[`end`](TextSpan.md#end)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:750

***

### start

```ts
start: Location;
```

First character of the definition.

#### Inherited from

[`TextSpan`](TextSpan.md).[`start`](TextSpan.md#start)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:746
