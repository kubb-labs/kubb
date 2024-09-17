[API](../../../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../../../index.md) / [ts](../../../../../index.md) / [server](../../../index.md) / [protocol](../index.md) / DefinitionInfo

# DefinitionInfo

Object found in response messages defining a span of text in a specific source file.

## Extends

- [`FileSpanWithContext`](FileSpanWithContext.md)

## Properties

### contextEnd?

```ts
optional contextEnd: Location;
```

#### Inherited from

[`FileSpanWithContext`](FileSpanWithContext.md).[`contextEnd`](FileSpanWithContext.md#contextend)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:772

***

### contextStart?

```ts
optional contextStart: Location;
```

#### Inherited from

[`FileSpanWithContext`](FileSpanWithContext.md).[`contextStart`](FileSpanWithContext.md#contextstart)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:771

***

### end

```ts
end: Location;
```

One character past last character of the definition.

#### Inherited from

[`FileSpanWithContext`](FileSpanWithContext.md).[`end`](FileSpanWithContext.md#end)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:750

***

### file

```ts
file: string;
```

File containing text span.

#### Inherited from

[`FileSpanWithContext`](FileSpanWithContext.md).[`file`](FileSpanWithContext.md#file)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:759

***

### start

```ts
start: Location;
```

First character of the definition.

#### Inherited from

[`FileSpanWithContext`](FileSpanWithContext.md).[`start`](FileSpanWithContext.md#start)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:746

***

### unverified?

```ts
optional unverified: boolean;
```

When true, the file may or may not exist.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:780
