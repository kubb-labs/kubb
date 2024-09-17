[API](../../../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../../../index.md) / [ts](../../../../../index.md) / [server](../../../index.md) / [protocol](../index.md) / CodeEdit

# CodeEdit

Object found in response messages defining an editing
instruction for a span of text in source code.  The effect of
this instruction is to replace the text starting at start and
ending one character before end with newText. For an insertion,
the text span is empty.  For a deletion, newText is empty.

## Properties

### end

```ts
end: Location;
```

One character past last character of the text span to edit.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1539

***

### newText

```ts
newText: string;
```

Replace the span defined above with this string (may be
the empty string).

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1544

***

### start

```ts
start: Location;
```

First character of the text span to edit.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1535
