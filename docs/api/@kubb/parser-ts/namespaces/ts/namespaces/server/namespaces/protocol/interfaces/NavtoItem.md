[API](../../../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../../../index.md) / [ts](../../../../../index.md) / [server](../../../index.md) / [protocol](../index.md) / NavtoItem

# NavtoItem

An item found in a navto response.

## Extends

- [`FileSpan`](FileSpan.md)

## Properties

### containerKind?

```ts
optional containerKind: ScriptElementKind;
```

Kind of symbol's container symbol (if any).

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2249

***

### containerName?

```ts
optional containerName: string;
```

Name of symbol's container symbol (if any); for example,
the class name if symbol is a class member.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2245

***

### end

```ts
end: Location;
```

One character past last character of the definition.

#### Inherited from

[`FileSpan`](FileSpan.md).[`end`](FileSpan.md#end)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:750

***

### file

```ts
file: string;
```

File containing text span.

#### Inherited from

[`FileSpan`](FileSpan.md).[`file`](FileSpan.md#file)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:759

***

### isCaseSensitive

```ts
isCaseSensitive: boolean;
```

If this was a case sensitive or insensitive match.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2236

***

### kind

```ts
kind: ScriptElementKind;
```

The symbol's kind (such as 'className' or 'parameterName').

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2228

***

### kindModifiers?

```ts
optional kindModifiers: string;
```

Optional modifiers for the kind (such as 'public').

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2240

***

### matchKind

```ts
matchKind: string;
```

exact, substring, or prefix.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2232

***

### name

```ts
name: string;
```

The symbol's name.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2224

***

### start

```ts
start: Location;
```

First character of the definition.

#### Inherited from

[`FileSpan`](FileSpan.md).[`start`](FileSpan.md#start)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:746
