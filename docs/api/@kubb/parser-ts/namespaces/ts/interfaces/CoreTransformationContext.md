[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / CoreTransformationContext

# CoreTransformationContext

## Extended by

- [`TransformationContext`](TransformationContext.md)

## Properties

### factory

```ts
readonly factory: NodeFactory;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7877

## Methods

### endLexicalEnvironment()

```ts
endLexicalEnvironment(): undefined | Statement[]
```

Ends a lexical environment, returning any declarations.

#### Returns

`undefined` \| [`Statement`](Statement.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7887

***

### getCompilerOptions()

```ts
getCompilerOptions(): CompilerOptions
```

Gets the compiler options supplied to the transformer.

#### Returns

[`CompilerOptions`](CompilerOptions.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7879

***

### hoistFunctionDeclaration()

```ts
hoistFunctionDeclaration(node): void
```

Hoists a function declaration to the containing scope.

#### Parameters

• **node**: [`FunctionDeclaration`](FunctionDeclaration.md)

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7889

***

### hoistVariableDeclaration()

```ts
hoistVariableDeclaration(node): void
```

Hoists a variable declaration to the containing scope.

#### Parameters

• **node**: [`Identifier`](Identifier.md)

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7891

***

### resumeLexicalEnvironment()

```ts
resumeLexicalEnvironment(): void
```

Resumes a suspended lexical environment, usually before visiting a function body.

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7885

***

### startLexicalEnvironment()

```ts
startLexicalEnvironment(): void
```

Starts a new lexical environment.

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7881

***

### suspendLexicalEnvironment()

```ts
suspendLexicalEnvironment(): void
```

Suspends the current lexical environment, usually after visiting a parameter list.

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7883
