[API](../../../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../../../index.md) / [ts](../../../../../index.md) / [server](../../../index.md) / [protocol](../index.md) / GetEditsForRefactorRequestArgs

# GetEditsForRefactorRequestArgs

```ts
type GetEditsForRefactorRequestArgs: FileLocationOrRangeRequestArgs & object;
```

Request the edits that a particular refactoring action produces.
Callers must specify the name of the refactor and the name of the action.

## Type declaration

### action

```ts
action: string;
```

### interactiveRefactorArguments?

```ts
optional interactiveRefactorArguments: InteractiveRefactorArguments;
```

### refactor

```ts
refactor: string;
```

## Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:533
