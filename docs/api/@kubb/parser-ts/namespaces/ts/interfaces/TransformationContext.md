[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / TransformationContext

# TransformationContext

## Extends

- [`CoreTransformationContext`](CoreTransformationContext.md)

## Properties

### factory

```ts
readonly factory: NodeFactory;
```

#### Inherited from

[`CoreTransformationContext`](CoreTransformationContext.md).[`factory`](CoreTransformationContext.md#factory)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7877

***

### onEmitNode()

```ts
onEmitNode: (hint, node, emitCallback) => void;
```

Hook used to allow transformers to capture state before or after
the printer emits a node.

NOTE: Transformation hooks should only be modified during `Transformer` initialization,
before returning the `NodeTransformer` callback.

#### Parameters

• **hint**: [`EmitHint`](../enumerations/EmitHint.md)

• **node**: [`Node`](Node.md)

• **emitCallback**

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7927

***

### onSubstituteNode()

```ts
onSubstituteNode: (hint, node) => Node;
```

Hook used by transformers to substitute expressions just before they
are emitted by the pretty printer.

NOTE: Transformation hooks should only be modified during `Transformer` initialization,
before returning the `NodeTransformer` callback.

#### Parameters

• **hint**: [`EmitHint`](../enumerations/EmitHint.md)

• **node**: [`Node`](Node.md)

#### Returns

[`Node`](Node.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7909

## Methods

### enableEmitNotification()

```ts
enableEmitNotification(kind): void
```

Enables before/after emit notifications in the pretty printer for the provided
SyntaxKind.

#### Parameters

• **kind**: [`SyntaxKind`](../enumerations/SyntaxKind.md)

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7914

***

### enableSubstitution()

```ts
enableSubstitution(kind): void
```

Enables expression substitutions in the pretty printer for the provided SyntaxKind.

#### Parameters

• **kind**: [`SyntaxKind`](../enumerations/SyntaxKind.md)

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7899

***

### endLexicalEnvironment()

```ts
endLexicalEnvironment(): undefined | Statement[]
```

Ends a lexical environment, returning any declarations.

#### Returns

`undefined` \| [`Statement`](Statement.md)[]

#### Inherited from

[`CoreTransformationContext`](CoreTransformationContext.md).[`endLexicalEnvironment`](CoreTransformationContext.md#endlexicalenvironment)

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

#### Inherited from

[`CoreTransformationContext`](CoreTransformationContext.md).[`getCompilerOptions`](CoreTransformationContext.md#getcompileroptions)

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

#### Inherited from

[`CoreTransformationContext`](CoreTransformationContext.md).[`hoistFunctionDeclaration`](CoreTransformationContext.md#hoistfunctiondeclaration)

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

#### Inherited from

[`CoreTransformationContext`](CoreTransformationContext.md).[`hoistVariableDeclaration`](CoreTransformationContext.md#hoistvariabledeclaration)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7891

***

### isEmitNotificationEnabled()

```ts
isEmitNotificationEnabled(node): boolean
```

Determines whether before/after emit notifications should be raised in the pretty
printer when it emits a node.

#### Parameters

• **node**: [`Node`](Node.md)

#### Returns

`boolean`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7919

***

### isSubstitutionEnabled()

```ts
isSubstitutionEnabled(node): boolean
```

Determines whether expression substitutions are enabled for the provided node.

#### Parameters

• **node**: [`Node`](Node.md)

#### Returns

`boolean`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7901

***

### readEmitHelpers()

```ts
readEmitHelpers(): undefined | EmitHelper[]
```

Gets and resets the requested non-scoped emit helpers.

#### Returns

`undefined` \| [`EmitHelper`](../type-aliases/EmitHelper.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7897

***

### requestEmitHelper()

```ts
requestEmitHelper(helper): void
```

Records a request for a non-scoped emit helper in the current context.

#### Parameters

• **helper**: [`EmitHelper`](../type-aliases/EmitHelper.md)

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7895

***

### resumeLexicalEnvironment()

```ts
resumeLexicalEnvironment(): void
```

Resumes a suspended lexical environment, usually before visiting a function body.

#### Returns

`void`

#### Inherited from

[`CoreTransformationContext`](CoreTransformationContext.md).[`resumeLexicalEnvironment`](CoreTransformationContext.md#resumelexicalenvironment)

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

#### Inherited from

[`CoreTransformationContext`](CoreTransformationContext.md).[`startLexicalEnvironment`](CoreTransformationContext.md#startlexicalenvironment)

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

#### Inherited from

[`CoreTransformationContext`](CoreTransformationContext.md).[`suspendLexicalEnvironment`](CoreTransformationContext.md#suspendlexicalenvironment)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7883
