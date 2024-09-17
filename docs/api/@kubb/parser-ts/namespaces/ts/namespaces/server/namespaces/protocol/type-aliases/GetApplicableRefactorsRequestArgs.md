[API](../../../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../../../index.md) / [ts](../../../../../index.md) / [server](../../../index.md) / [protocol](../index.md) / GetApplicableRefactorsRequestArgs

# GetApplicableRefactorsRequestArgs

```ts
type GetApplicableRefactorsRequestArgs: FileLocationOrRangeRequestArgs & object;
```

## Type declaration

### includeInteractiveActions?

```ts
optional includeInteractiveActions: boolean;
```

Include refactor actions that require additional arguments to be passed when
calling 'GetEditsForRefactor'. When true, clients should inspect the
`isInteractive` property of each returned `RefactorActionInfo`
and ensure they are able to collect the appropriate arguments for any
interactive refactor before offering it.

### kind?

```ts
optional kind: string;
```

### triggerReason?

```ts
optional triggerReason: RefactorTriggerReason;
```

## Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:459
