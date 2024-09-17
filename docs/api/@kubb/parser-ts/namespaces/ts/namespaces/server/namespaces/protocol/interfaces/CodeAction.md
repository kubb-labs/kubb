[API](../../../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../../../index.md) / [ts](../../../../../index.md) / [server](../../../index.md) / [protocol](../index.md) / CodeAction

# CodeAction

## Extended by

- [`CodeFixAction`](CodeFixAction.md)

## Properties

### changes

```ts
changes: FileCodeEdits[];
```

Text changes to apply to each file as part of the code action

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1558

***

### commands?

```ts
optional commands: object[];
```

A command is an opaque object that should be passed to `ApplyCodeActionCommandRequestArgs` without modification.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1560

***

### description

```ts
description: string;
```

Description of the code action to display in the UI of the editor

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1556
