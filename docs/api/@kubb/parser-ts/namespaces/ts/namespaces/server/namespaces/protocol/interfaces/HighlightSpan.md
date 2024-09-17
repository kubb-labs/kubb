[API](../../../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../../../index.md) / [ts](../../../../../index.md) / [server](../../../index.md) / [protocol](../index.md) / HighlightSpan

# HighlightSpan

Span augmented with extra information that denotes the kind of the highlighting to be used for span.

## Extends

- [`TextSpanWithContext`](TextSpanWithContext.md)

## Properties

### contextEnd?

```ts
optional contextEnd: Location;
```

#### Inherited from

[`TextSpanWithContext`](TextSpanWithContext.md).[`contextEnd`](TextSpanWithContext.md#contextend)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:772

***

### contextStart?

```ts
optional contextStart: Location;
```

#### Inherited from

[`TextSpanWithContext`](TextSpanWithContext.md).[`contextStart`](TextSpanWithContext.md#contextstart)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:771

***

### end

```ts
end: Location;
```

One character past last character of the definition.

#### Inherited from

[`TextSpanWithContext`](TextSpanWithContext.md).[`end`](TextSpanWithContext.md#end)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:750

***

### kind

```ts
kind: HighlightSpanKind;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:857

***

### start

```ts
start: Location;
```

First character of the definition.

#### Inherited from

[`TextSpanWithContext`](TextSpanWithContext.md).[`start`](TextSpanWithContext.md#start)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:746
