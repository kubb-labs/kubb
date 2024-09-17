[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / DiagnosticMessageChain

# DiagnosticMessageChain

A linked list of formatted diagnostic messages to be used as part of a multiline message.
It is built from the bottom up, leaving the head to be the "main" diagnostic.
While it seems that DiagnosticMessageChain is structurally similar to DiagnosticMessage,
the difference is that messages are all preformatted in DMC.

## Properties

### category

```ts
category: DiagnosticCategory;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6845

***

### code

```ts
code: number;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6846

***

### messageText

```ts
messageText: string;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6844

***

### next?

```ts
optional next: DiagnosticMessageChain[];
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6847
