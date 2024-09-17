[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / JSDocParsingMode

# JSDocParsingMode

## Enumeration Members

### ParseAll

```ts
ParseAll: 0;
```

Always parse JSDoc comments and include them in the AST.

This is the default if no mode is provided.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8178

***

### ParseForTypeErrors

```ts
ParseForTypeErrors: 2;
```

Parse only JSDoc comments which are needed to provide correct type errors.

This will always parse JSDoc in non-TS files, but only parse JSDoc comments
containing `@see` and `@link` in TS files.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8189

***

### ParseForTypeInfo

```ts
ParseForTypeInfo: 3;
```

Parse only JSDoc comments which are needed to provide correct type info.

This will always parse JSDoc in non-TS files, but never in TS files.

Note: Do not use this mode if you require accurate type errors; use [ParseForTypeErrors](JSDocParsingMode.md#parsefortypeerrors) instead.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8197

***

### ParseNone

```ts
ParseNone: 1;
```

Never parse JSDoc comments, mo matter the file type.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8182
