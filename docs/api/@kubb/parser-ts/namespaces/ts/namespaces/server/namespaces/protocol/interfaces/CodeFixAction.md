[API](../../../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../../../index.md) / [ts](../../../../../index.md) / [server](../../../index.md) / [protocol](../index.md) / CodeFixAction

# CodeFixAction

## Extends

- [`CodeAction`](CodeAction.md)

## Properties

### changes

```ts
changes: FileCodeEdits[];
```

Text changes to apply to each file as part of the code action

#### Inherited from

[`CodeAction`](CodeAction.md).[`changes`](CodeAction.md#changes)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1558

***

### commands?

```ts
optional commands: object[];
```

A command is an opaque object that should be passed to `ApplyCodeActionCommandRequestArgs` without modification.

#### Inherited from

[`CodeAction`](CodeAction.md).[`commands`](CodeAction.md#commands)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1560

***

### description

```ts
description: string;
```

Description of the code action to display in the UI of the editor

#### Inherited from

[`CodeAction`](CodeAction.md).[`description`](CodeAction.md#description)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1556

***

### fixAllDescription?

```ts
optional fixAllDescription: string;
```

Should be present if and only if 'fixId' is.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1575

***

### fixId?

```ts
optional fixId: object;
```

If present, one may call 'getCombinedCodeFix' with this fixId.
This may be omitted to indicate that the code fix can't be applied in a group.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1573

***

### fixName

```ts
fixName: string;
```

Short name to identify the fix, for use by telemetry.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1568
