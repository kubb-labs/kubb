[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / CodeFixAction

# CodeFixAction

## Extends

- [`CodeAction`](CodeAction.md)

## Properties

### changes

```ts
changes: FileTextChanges[];
```

Text changes to apply to each file as part of the code action

#### Inherited from

[`CodeAction`](CodeAction.md).[`changes`](CodeAction.md#changes)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10389

***

### commands?

```ts
optional commands: InstallPackageAction[];
```

If the user accepts the code fix, the editor should send the action back in a `applyAction` request.
This allows the language service to have side effects (e.g. installing dependencies) upon a code fix.

#### Inherited from

[`CodeAction`](CodeAction.md).[`commands`](CodeAction.md#commands)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10394

***

### description

```ts
description: string;
```

Description of the code action to display in the UI of the editor

#### Inherited from

[`CodeAction`](CodeAction.md).[`description`](CodeAction.md#description)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10387

***

### fixAllDescription?

```ts
optional fixAllDescription: string;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10404

***

### fixId?

```ts
optional fixId: object;
```

If present, one may call 'getCombinedCodeFix' with this fixId.
This may be omitted to indicate that the code fix can't be applied in a group.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10403

***

### fixName

```ts
fixName: string;
```

Short name to identify the fix, for use by telemetry.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10398
