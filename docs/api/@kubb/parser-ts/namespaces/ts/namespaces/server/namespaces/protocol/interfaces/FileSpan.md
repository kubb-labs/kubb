[API](../../../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../../../index.md) / [ts](../../../../../index.md) / [server](../../../index.md) / [protocol](../index.md) / FileSpan

# FileSpan

Object found in response messages defining a span of text in a specific source file.

## Extends

- [`TextSpan`](TextSpan.md)

## Extended by

- [`FileSpanWithContext`](FileSpanWithContext.md)
- [`NavtoItem`](NavtoItem.md)

## Properties

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

### file

```ts
file: string;
```

File containing text span.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:759

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
