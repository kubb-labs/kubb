[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / CodeAction

# CodeAction

## Extended by

- [`CodeFixAction`](CodeFixAction.md)

## Properties

### changes

```ts
changes: FileTextChanges[];
```

Text changes to apply to each file as part of the code action

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10389

***

### commands?

```ts
optional commands: InstallPackageAction[];
```

If the user accepts the code fix, the editor should send the action back in a `applyAction` request.
This allows the language service to have side effects (e.g. installing dependencies) upon a code fix.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10394

***

### description

```ts
description: string;
```

Description of the code action to display in the UI of the editor

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10387
