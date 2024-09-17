[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / CompletionInfo

# CompletionInfo

## Properties

### defaultCommitCharacters?

```ts
optional defaultCommitCharacters: string[];
```

Default commit characters for the completion entries.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10797

***

### entries

```ts
entries: CompletionEntry[];
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10793

***

### flags?

```ts
optional flags: CompletionInfoFlags;
```

For performance telemetry.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10775

***

### isGlobalCompletion

```ts
isGlobalCompletion: boolean;
```

Not true for all global completions. This will be true if the enclosing scope matches a few syntax kinds. See `isSnippetScope`.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10777

***

### isIncomplete?

```ts
optional isIncomplete: true;
```

Indicates to client to continue requesting completions on subsequent keystrokes.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10792

***

### isMemberCompletion

```ts
isMemberCompletion: boolean;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10778

***

### isNewIdentifierLocation

```ts
isNewIdentifierLocation: boolean;
```

true when the current location also allows for a new identifier

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10788

***

### optionalReplacementSpan?

```ts
optional optionalReplacementSpan: TextSpan;
```

In the absence of `CompletionEntry["replacementSpan"]`, the editor may choose whether to use
this span or its default one. If `CompletionEntry["replacementSpan"]` is defined, that span
must be used to commit that completion entry.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10784
