[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / NodeFactory

# NodeFactory

## Methods

### createAdd()

```ts
createAdd(left, right): BinaryExpression
```

#### Parameters

• **left**: [`Expression`](Expression.md)

• **right**: [`Expression`](Expression.md)

#### Returns

[`BinaryExpression`](BinaryExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7841

***

### createArrayBindingPattern()

```ts
createArrayBindingPattern(elements): ArrayBindingPattern
```

#### Parameters

• **elements**: readonly [`ArrayBindingElement`](../type-aliases/ArrayBindingElement.md)[]

#### Returns

[`ArrayBindingPattern`](ArrayBindingPattern.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7516

***

### createArrayLiteralExpression()

```ts
createArrayLiteralExpression(elements?, multiLine?): ArrayLiteralExpression
```

#### Parameters

• **elements?**: readonly [`Expression`](Expression.md)[]

• **multiLine?**: `boolean`

#### Returns

[`ArrayLiteralExpression`](ArrayLiteralExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7520

***

### createArrayTypeNode()

```ts
createArrayTypeNode(elementType): ArrayTypeNode
```

#### Parameters

• **elementType**: [`TypeNode`](TypeNode.md)

#### Returns

[`ArrayTypeNode`](ArrayTypeNode.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7481

***

### createArrowFunction()

```ts
createArrowFunction(
   modifiers, 
   typeParameters, 
   parameters, 
   type, 
   equalsGreaterThanToken, 
   body): ArrowFunction
```

#### Parameters

• **modifiers**: `undefined` \| readonly [`Modifier`](../type-aliases/Modifier.md)[]

• **typeParameters**: `undefined` \| readonly [`TypeParameterDeclaration`](TypeParameterDeclaration.md)[]

• **parameters**: readonly [`ParameterDeclaration`](ParameterDeclaration.md)[]

• **type**: `undefined` \| [`TypeNode`](TypeNode.md)

• **equalsGreaterThanToken**: `undefined` \| [`EqualsGreaterThanToken`](../type-aliases/EqualsGreaterThanToken.md)

• **body**: [`ConciseBody`](../type-aliases/ConciseBody.md)

#### Returns

[`ArrowFunction`](ArrowFunction.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7546

***

### createAsExpression()

```ts
createAsExpression(expression, type): AsExpression
```

#### Parameters

• **expression**: [`Expression`](Expression.md)

• **type**: [`TypeNode`](TypeNode.md)

#### Returns

[`AsExpression`](AsExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7584

***

### ~~createAssertClause()~~

```ts
createAssertClause(elements, multiLine?): AssertClause
```

#### Parameters

• **elements**: [`NodeArray`](NodeArray.md)\<[`AssertEntry`](AssertEntry.md)\>

• **multiLine?**: `boolean`

#### Returns

[`AssertClause`](AssertClause.md)

#### Deprecated

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7661

***

### ~~createAssertEntry()~~

```ts
createAssertEntry(name, value): AssertEntry
```

#### Parameters

• **name**: [`ImportAttributeName`](../type-aliases/ImportAttributeName.md)

• **value**: [`Expression`](Expression.md)

#### Returns

[`AssertEntry`](AssertEntry.md)

#### Deprecated

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7663

***

### createAssignment()

#### createAssignment(left, right)

```ts
createAssignment(left, right): DestructuringAssignment
```

##### Parameters

• **left**: [`ObjectLiteralExpression`](ObjectLiteralExpression.md) \| [`ArrayLiteralExpression`](ArrayLiteralExpression.md)

• **right**: [`Expression`](Expression.md)

##### Returns

[`DestructuringAssignment`](../type-aliases/DestructuringAssignment.md)

##### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7823

#### createAssignment(left, right)

```ts
createAssignment(left, right): AssignmentExpression<EqualsToken>
```

##### Parameters

• **left**: [`Expression`](Expression.md)

• **right**: [`Expression`](Expression.md)

##### Returns

[`AssignmentExpression`](AssignmentExpression.md)\<[`EqualsToken`](../type-aliases/EqualsToken.md)\>

##### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7824

***

### createAwaitExpression()

```ts
createAwaitExpression(expression): AwaitExpression
```

#### Parameters

• **expression**: [`Expression`](Expression.md)

#### Returns

[`AwaitExpression`](AwaitExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7554

***

### createBigIntLiteral()

```ts
createBigIntLiteral(value): BigIntLiteral
```

#### Parameters

• **value**: `string` \| [`PseudoBigInt`](PseudoBigInt.md)

#### Returns

[`BigIntLiteral`](BigIntLiteral.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7387

***

### createBinaryExpression()

```ts
createBinaryExpression(
   left, 
   operator, 
   right): BinaryExpression
```

#### Parameters

• **left**: [`Expression`](Expression.md)

• **operator**: [`BinaryOperatorToken`](../type-aliases/BinaryOperatorToken.md) \| [`BinaryOperator`](../type-aliases/BinaryOperator.md)

• **right**: [`Expression`](Expression.md)

#### Returns

[`BinaryExpression`](BinaryExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7560

***

### createBindingElement()

```ts
createBindingElement(
   dotDotDotToken, 
   propertyName, 
   name, 
   initializer?): BindingElement
```

#### Parameters

• **dotDotDotToken**: `undefined` \| [`DotDotDotToken`](../type-aliases/DotDotDotToken.md)

• **propertyName**: `undefined` \| `string` \| [`PropertyName`](../type-aliases/PropertyName.md)

• **name**: `string` \| [`BindingName`](../type-aliases/BindingName.md)

• **initializer?**: [`Expression`](Expression.md)

#### Returns

[`BindingElement`](BindingElement.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7518

***

### createBitwiseAnd()

```ts
createBitwiseAnd(left, right): BinaryExpression
```

#### Parameters

• **left**: [`Expression`](Expression.md)

• **right**: [`Expression`](Expression.md)

#### Returns

[`BinaryExpression`](BinaryExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7829

***

### createBitwiseNot()

```ts
createBitwiseNot(operand): PrefixUnaryExpression
```

#### Parameters

• **operand**: [`Expression`](Expression.md)

#### Returns

[`PrefixUnaryExpression`](PrefixUnaryExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7851

***

### createBitwiseOr()

```ts
createBitwiseOr(left, right): BinaryExpression
```

#### Parameters

• **left**: [`Expression`](Expression.md)

• **right**: [`Expression`](Expression.md)

#### Returns

[`BinaryExpression`](BinaryExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7827

***

### createBitwiseXor()

```ts
createBitwiseXor(left, right): BinaryExpression
```

#### Parameters

• **left**: [`Expression`](Expression.md)

• **right**: [`Expression`](Expression.md)

#### Returns

[`BinaryExpression`](BinaryExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7828

***

### createBlock()

```ts
createBlock(statements, multiLine?): Block
```

#### Parameters

• **statements**: readonly [`Statement`](Statement.md)[]

• **multiLine?**: `boolean`

#### Returns

[`Block`](Block.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7597

***

### createBreakStatement()

```ts
createBreakStatement(label?): BreakStatement
```

#### Parameters

• **label?**: `string` \| [`Identifier`](Identifier.md)

#### Returns

[`BreakStatement`](BreakStatement.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7618

***

### createBundle()

```ts
createBundle(sourceFiles): Bundle
```

#### Parameters

• **sourceFiles**: readonly [`SourceFile`](SourceFile.md)[]

#### Returns

[`Bundle`](Bundle.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7820

***

### createCallChain()

```ts
createCallChain(
   expression, 
   questionDotToken, 
   typeArguments, 
   argumentsArray): CallChain
```

#### Parameters

• **expression**: [`Expression`](Expression.md)

• **questionDotToken**: `undefined` \| [`QuestionDotToken`](../type-aliases/QuestionDotToken.md)

• **typeArguments**: `undefined` \| readonly [`TypeNode`](TypeNode.md)[]

• **argumentsArray**: `undefined` \| readonly [`Expression`](Expression.md)[]

#### Returns

[`CallChain`](CallChain.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7534

***

### createCallExpression()

```ts
createCallExpression(
   expression, 
   typeArguments, 
   argumentsArray): CallExpression
```

#### Parameters

• **expression**: [`Expression`](Expression.md)

• **typeArguments**: `undefined` \| readonly [`TypeNode`](TypeNode.md)[]

• **argumentsArray**: `undefined` \| readonly [`Expression`](Expression.md)[]

#### Returns

[`CallExpression`](CallExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7532

***

### createCallSignature()

```ts
createCallSignature(
   typeParameters, 
   parameters, 
   type): CallSignatureDeclaration
```

#### Parameters

• **typeParameters**: `undefined` \| readonly [`TypeParameterDeclaration`](TypeParameterDeclaration.md)[]

• **parameters**: readonly [`ParameterDeclaration`](ParameterDeclaration.md)[]

• **type**: `undefined` \| [`TypeNode`](TypeNode.md)

#### Returns

[`CallSignatureDeclaration`](CallSignatureDeclaration.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7458

***

### createCaseBlock()

```ts
createCaseBlock(clauses): CaseBlock
```

#### Parameters

• **clauses**: readonly [`CaseOrDefaultClause`](../type-aliases/CaseOrDefaultClause.md)[]

#### Returns

[`CaseBlock`](CaseBlock.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7651

***

### createCaseClause()

```ts
createCaseClause(expression, statements): CaseClause
```

#### Parameters

• **expression**: [`Expression`](Expression.md)

• **statements**: readonly [`Statement`](Statement.md)[]

#### Returns

[`CaseClause`](CaseClause.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7797

***

### createCatchClause()

```ts
createCatchClause(variableDeclaration, block): CatchClause
```

#### Parameters

• **variableDeclaration**: `undefined` \| `string` \| [`BindingName`](../type-aliases/BindingName.md) \| [`VariableDeclaration`](VariableDeclaration.md)

• **block**: [`Block`](Block.md)

#### Returns

[`CatchClause`](CatchClause.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7803

***

### createClassDeclaration()

```ts
createClassDeclaration(
   modifiers, 
   name, 
   typeParameters, 
   heritageClauses, 
   members): ClassDeclaration
```

#### Parameters

• **modifiers**: `undefined` \| readonly [`ModifierLike`](../type-aliases/ModifierLike.md)[]

• **name**: `undefined` \| `string` \| [`Identifier`](Identifier.md)

• **typeParameters**: `undefined` \| readonly [`TypeParameterDeclaration`](TypeParameterDeclaration.md)[]

• **heritageClauses**: `undefined` \| readonly [`HeritageClause`](HeritageClause.md)[]

• **members**: readonly [`ClassElement`](ClassElement.md)[]

#### Returns

[`ClassDeclaration`](ClassDeclaration.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7639

***

### createClassExpression()

```ts
createClassExpression(
   modifiers, 
   name, 
   typeParameters, 
   heritageClauses, 
   members): ClassExpression
```

#### Parameters

• **modifiers**: `undefined` \| readonly [`ModifierLike`](../type-aliases/ModifierLike.md)[]

• **name**: `undefined` \| `string` \| [`Identifier`](Identifier.md)

• **typeParameters**: `undefined` \| readonly [`TypeParameterDeclaration`](TypeParameterDeclaration.md)[]

• **heritageClauses**: `undefined` \| readonly [`HeritageClause`](HeritageClause.md)[]

• **members**: readonly [`ClassElement`](ClassElement.md)[]

#### Returns

[`ClassExpression`](ClassExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7579

***

### createClassStaticBlockDeclaration()

```ts
createClassStaticBlockDeclaration(body): ClassStaticBlockDeclaration
```

#### Parameters

• **body**: [`Block`](Block.md)

#### Returns

[`ClassStaticBlockDeclaration`](ClassStaticBlockDeclaration.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7466

***

### createComma()

```ts
createComma(left, right): BinaryExpression
```

#### Parameters

• **left**: [`Expression`](Expression.md)

• **right**: [`Expression`](Expression.md)

#### Returns

[`BinaryExpression`](BinaryExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7822

***

### createCommaListExpression()

```ts
createCommaListExpression(elements): CommaListExpression
```

#### Parameters

• **elements**: readonly [`Expression`](Expression.md)[]

#### Returns

[`CommaListExpression`](CommaListExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7818

***

### createComputedPropertyName()

```ts
createComputedPropertyName(expression): ComputedPropertyName
```

#### Parameters

• **expression**: [`Expression`](Expression.md)

#### Returns

[`ComputedPropertyName`](ComputedPropertyName.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7436

***

### createConditionalExpression()

```ts
createConditionalExpression(
   condition, 
   questionToken, 
   whenTrue, 
   colonToken, 
   whenFalse): ConditionalExpression
```

#### Parameters

• **condition**: [`Expression`](Expression.md)

• **questionToken**: `undefined` \| [`QuestionToken`](../type-aliases/QuestionToken.md)

• **whenTrue**: [`Expression`](Expression.md)

• **colonToken**: `undefined` \| [`ColonToken`](../type-aliases/ColonToken.md)

• **whenFalse**: [`Expression`](Expression.md)

#### Returns

[`ConditionalExpression`](ConditionalExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7562

***

### createConditionalTypeNode()

```ts
createConditionalTypeNode(
   checkType, 
   extendsType, 
   trueType, 
   falseType): ConditionalTypeNode
```

#### Parameters

• **checkType**: [`TypeNode`](TypeNode.md)

• **extendsType**: [`TypeNode`](TypeNode.md)

• **trueType**: [`TypeNode`](TypeNode.md)

• **falseType**: [`TypeNode`](TypeNode.md)

#### Returns

[`ConditionalTypeNode`](ConditionalTypeNode.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7495

***

### createConstructorDeclaration()

```ts
createConstructorDeclaration(
   modifiers, 
   parameters, 
   body): ConstructorDeclaration
```

#### Parameters

• **modifiers**: `undefined` \| readonly [`ModifierLike`](../type-aliases/ModifierLike.md)[]

• **parameters**: readonly [`ParameterDeclaration`](ParameterDeclaration.md)[]

• **body**: `undefined` \| [`Block`](Block.md)

#### Returns

[`ConstructorDeclaration`](ConstructorDeclaration.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7452

***

### createConstructorTypeNode()

```ts
createConstructorTypeNode(
   modifiers, 
   typeParameters, 
   parameters, 
   type): ConstructorTypeNode
```

#### Parameters

• **modifiers**: `undefined` \| readonly [`Modifier`](../type-aliases/Modifier.md)[]

• **typeParameters**: `undefined` \| readonly [`TypeParameterDeclaration`](TypeParameterDeclaration.md)[]

• **parameters**: readonly [`ParameterDeclaration`](ParameterDeclaration.md)[]

• **type**: [`TypeNode`](TypeNode.md)

#### Returns

[`ConstructorTypeNode`](ConstructorTypeNode.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7475

***

### createConstructSignature()

```ts
createConstructSignature(
   typeParameters, 
   parameters, 
   type): ConstructSignatureDeclaration
```

#### Parameters

• **typeParameters**: `undefined` \| readonly [`TypeParameterDeclaration`](TypeParameterDeclaration.md)[]

• **parameters**: readonly [`ParameterDeclaration`](ParameterDeclaration.md)[]

• **type**: `undefined` \| [`TypeNode`](TypeNode.md)

#### Returns

[`ConstructSignatureDeclaration`](ConstructSignatureDeclaration.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7460

***

### createContinueStatement()

```ts
createContinueStatement(label?): ContinueStatement
```

#### Parameters

• **label?**: `string` \| [`Identifier`](Identifier.md)

#### Returns

[`ContinueStatement`](ContinueStatement.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7616

***

### createDebuggerStatement()

```ts
createDebuggerStatement(): DebuggerStatement
```

#### Returns

[`DebuggerStatement`](DebuggerStatement.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7632

***

### createDecorator()

```ts
createDecorator(expression): Decorator
```

#### Parameters

• **expression**: [`Expression`](Expression.md)

#### Returns

[`Decorator`](Decorator.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7442

***

### createDefaultClause()

```ts
createDefaultClause(statements): DefaultClause
```

#### Parameters

• **statements**: readonly [`Statement`](Statement.md)[]

#### Returns

[`DefaultClause`](DefaultClause.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7799

***

### createDeleteExpression()

```ts
createDeleteExpression(expression): DeleteExpression
```

#### Parameters

• **expression**: [`Expression`](Expression.md)

#### Returns

[`DeleteExpression`](DeleteExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7548

***

### createDivide()

```ts
createDivide(left, right): BinaryExpression
```

#### Parameters

• **left**: [`Expression`](Expression.md)

• **right**: [`Expression`](Expression.md)

#### Returns

[`BinaryExpression`](BinaryExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7844

***

### createDoStatement()

```ts
createDoStatement(statement, expression): DoStatement
```

#### Parameters

• **statement**: [`Statement`](Statement.md)

• **expression**: [`Expression`](Expression.md)

#### Returns

[`DoStatement`](DoStatement.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7606

***

### createElementAccessChain()

```ts
createElementAccessChain(
   expression, 
   questionDotToken, 
   index): ElementAccessChain
```

#### Parameters

• **expression**: [`Expression`](Expression.md)

• **questionDotToken**: `undefined` \| [`QuestionDotToken`](../type-aliases/QuestionDotToken.md)

• **index**: `number` \| [`Expression`](Expression.md)

#### Returns

[`ElementAccessChain`](ElementAccessChain.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7530

***

### createElementAccessExpression()

```ts
createElementAccessExpression(expression, index): ElementAccessExpression
```

#### Parameters

• **expression**: [`Expression`](Expression.md)

• **index**: `number` \| [`Expression`](Expression.md)

#### Returns

[`ElementAccessExpression`](ElementAccessExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7528

***

### createEmptyStatement()

```ts
createEmptyStatement(): EmptyStatement
```

#### Returns

[`EmptyStatement`](EmptyStatement.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7601

***

### createEnumDeclaration()

```ts
createEnumDeclaration(
   modifiers, 
   name, 
   members): EnumDeclaration
```

#### Parameters

• **modifiers**: `undefined` \| readonly [`ModifierLike`](../type-aliases/ModifierLike.md)[]

• **name**: `string` \| [`Identifier`](Identifier.md)

• **members**: readonly [`EnumMember`](EnumMember.md)[]

#### Returns

[`EnumDeclaration`](EnumDeclaration.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7645

***

### createEnumMember()

```ts
createEnumMember(name, initializer?): EnumMember
```

#### Parameters

• **name**: `string` \| [`PropertyName`](../type-aliases/PropertyName.md)

• **initializer?**: [`Expression`](Expression.md)

#### Returns

[`EnumMember`](EnumMember.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7811

***

### createEquality()

```ts
createEquality(left, right): BinaryExpression
```

#### Parameters

• **left**: [`Expression`](Expression.md)

• **right**: [`Expression`](Expression.md)

#### Returns

[`BinaryExpression`](BinaryExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7832

***

### createExponent()

```ts
createExponent(left, right): BinaryExpression
```

#### Parameters

• **left**: [`Expression`](Expression.md)

• **right**: [`Expression`](Expression.md)

#### Returns

[`BinaryExpression`](BinaryExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7846

***

### createExportAssignment()

```ts
createExportAssignment(
   modifiers, 
   isExportEquals, 
   expression): ExportAssignment
```

#### Parameters

• **modifiers**: `undefined` \| readonly [`ModifierLike`](../type-aliases/ModifierLike.md)[]

• **isExportEquals**: `undefined` \| `boolean`

• **expression**: [`Expression`](Expression.md)

#### Returns

[`ExportAssignment`](ExportAssignment.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7679

***

### createExportDeclaration()

```ts
createExportDeclaration(
   modifiers, 
   isTypeOnly, 
   exportClause, 
   moduleSpecifier?, 
   attributes?): ExportDeclaration
```

#### Parameters

• **modifiers**: `undefined` \| readonly [`ModifierLike`](../type-aliases/ModifierLike.md)[]

• **isTypeOnly**: `boolean`

• **exportClause**: `undefined` \| [`NamedExportBindings`](../type-aliases/NamedExportBindings.md)

• **moduleSpecifier?**: [`Expression`](Expression.md)

• **attributes?**: [`ImportAttributes`](ImportAttributes.md)

#### Returns

[`ExportDeclaration`](ExportDeclaration.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7681

***

### createExportDefault()

```ts
createExportDefault(expression): ExportAssignment
```

#### Parameters

• **expression**: [`Expression`](Expression.md)

#### Returns

[`ExportAssignment`](ExportAssignment.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7860

***

### createExportSpecifier()

```ts
createExportSpecifier(
   isTypeOnly, 
   propertyName, 
   name): ExportSpecifier
```

#### Parameters

• **isTypeOnly**: `boolean`

• **propertyName**: `undefined` \| `string` \| [`ModuleExportName`](../type-aliases/ModuleExportName.md)

• **name**: `string` \| [`ModuleExportName`](../type-aliases/ModuleExportName.md)

#### Returns

[`ExportSpecifier`](ExportSpecifier.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7685

***

### createExpressionStatement()

```ts
createExpressionStatement(expression): ExpressionStatement
```

#### Parameters

• **expression**: [`Expression`](Expression.md)

#### Returns

[`ExpressionStatement`](ExpressionStatement.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7602

***

### createExpressionWithTypeArguments()

```ts
createExpressionWithTypeArguments(expression, typeArguments): ExpressionWithTypeArguments
```

#### Parameters

• **expression**: [`Expression`](Expression.md)

• **typeArguments**: `undefined` \| readonly [`TypeNode`](TypeNode.md)[]

#### Returns

[`ExpressionWithTypeArguments`](ExpressionWithTypeArguments.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7582

***

### createExternalModuleExport()

```ts
createExternalModuleExport(exportName): ExportDeclaration
```

#### Parameters

• **exportName**: [`Identifier`](Identifier.md)

#### Returns

[`ExportDeclaration`](ExportDeclaration.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7861

***

### createExternalModuleReference()

```ts
createExternalModuleReference(expression): ExternalModuleReference
```

#### Parameters

• **expression**: [`Expression`](Expression.md)

#### Returns

[`ExternalModuleReference`](ExternalModuleReference.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7687

***

### createFalse()

```ts
createFalse(): FalseLiteral
```

#### Returns

[`FalseLiteral`](FalseLiteral.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7431

***

### createForInStatement()

```ts
createForInStatement(
   initializer, 
   expression, 
   statement): ForInStatement
```

#### Parameters

• **initializer**: [`ForInitializer`](../type-aliases/ForInitializer.md)

• **expression**: [`Expression`](Expression.md)

• **statement**: [`Statement`](Statement.md)

#### Returns

[`ForInStatement`](ForInStatement.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7612

***

### createForOfStatement()

```ts
createForOfStatement(
   awaitModifier, 
   initializer, 
   expression, 
   statement): ForOfStatement
```

#### Parameters

• **awaitModifier**: `undefined` \| [`AwaitKeyword`](../type-aliases/AwaitKeyword.md)

• **initializer**: [`ForInitializer`](../type-aliases/ForInitializer.md)

• **expression**: [`Expression`](Expression.md)

• **statement**: [`Statement`](Statement.md)

#### Returns

[`ForOfStatement`](ForOfStatement.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7614

***

### createForStatement()

```ts
createForStatement(
   initializer, 
   condition, 
   incrementor, 
   statement): ForStatement
```

#### Parameters

• **initializer**: `undefined` \| [`ForInitializer`](../type-aliases/ForInitializer.md)

• **condition**: `undefined` \| [`Expression`](Expression.md)

• **incrementor**: `undefined` \| [`Expression`](Expression.md)

• **statement**: [`Statement`](Statement.md)

#### Returns

[`ForStatement`](ForStatement.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7610

***

### createFunctionDeclaration()

```ts
createFunctionDeclaration(
   modifiers, 
   asteriskToken, 
   name, 
   typeParameters, 
   parameters, 
   type, 
   body): FunctionDeclaration
```

#### Parameters

• **modifiers**: `undefined` \| readonly [`ModifierLike`](../type-aliases/ModifierLike.md)[]

• **asteriskToken**: `undefined` \| [`AsteriskToken`](../type-aliases/AsteriskToken.md)

• **name**: `undefined` \| `string` \| [`Identifier`](Identifier.md)

• **typeParameters**: `undefined` \| readonly [`TypeParameterDeclaration`](TypeParameterDeclaration.md)[]

• **parameters**: readonly [`ParameterDeclaration`](ParameterDeclaration.md)[]

• **type**: `undefined` \| [`TypeNode`](TypeNode.md)

• **body**: `undefined` \| [`Block`](Block.md)

#### Returns

[`FunctionDeclaration`](FunctionDeclaration.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7637

***

### createFunctionExpression()

```ts
createFunctionExpression(
   modifiers, 
   asteriskToken, 
   name, 
   typeParameters, 
   parameters, 
   type, 
   body): FunctionExpression
```

#### Parameters

• **modifiers**: `undefined` \| readonly [`Modifier`](../type-aliases/Modifier.md)[]

• **asteriskToken**: `undefined` \| [`AsteriskToken`](../type-aliases/AsteriskToken.md)

• **name**: `undefined` \| `string` \| [`Identifier`](Identifier.md)

• **typeParameters**: `undefined` \| readonly [`TypeParameterDeclaration`](TypeParameterDeclaration.md)[]

• **parameters**: `undefined` \| readonly [`ParameterDeclaration`](ParameterDeclaration.md)[]

• **type**: `undefined` \| [`TypeNode`](TypeNode.md)

• **body**: [`Block`](Block.md)

#### Returns

[`FunctionExpression`](FunctionExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7544

***

### createFunctionTypeNode()

```ts
createFunctionTypeNode(
   typeParameters, 
   parameters, 
   type): FunctionTypeNode
```

#### Parameters

• **typeParameters**: `undefined` \| readonly [`TypeParameterDeclaration`](TypeParameterDeclaration.md)[]

• **parameters**: readonly [`ParameterDeclaration`](ParameterDeclaration.md)[]

• **type**: [`TypeNode`](TypeNode.md)

#### Returns

[`FunctionTypeNode`](FunctionTypeNode.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7473

***

### createGetAccessorDeclaration()

```ts
createGetAccessorDeclaration(
   modifiers, 
   name, 
   parameters, 
   type, 
   body): GetAccessorDeclaration
```

#### Parameters

• **modifiers**: `undefined` \| readonly [`ModifierLike`](../type-aliases/ModifierLike.md)[]

• **name**: `string` \| [`PropertyName`](../type-aliases/PropertyName.md)

• **parameters**: readonly [`ParameterDeclaration`](ParameterDeclaration.md)[]

• **type**: `undefined` \| [`TypeNode`](TypeNode.md)

• **body**: `undefined` \| [`Block`](Block.md)

#### Returns

[`GetAccessorDeclaration`](GetAccessorDeclaration.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7454

***

### createGreaterThan()

```ts
createGreaterThan(left, right): BinaryExpression
```

#### Parameters

• **left**: [`Expression`](Expression.md)

• **right**: [`Expression`](Expression.md)

#### Returns

[`BinaryExpression`](BinaryExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7836

***

### createGreaterThanEquals()

```ts
createGreaterThanEquals(left, right): BinaryExpression
```

#### Parameters

• **left**: [`Expression`](Expression.md)

• **right**: [`Expression`](Expression.md)

#### Returns

[`BinaryExpression`](BinaryExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7837

***

### createHeritageClause()

```ts
createHeritageClause(token, types): HeritageClause
```

#### Parameters

• **token**: [`ExtendsKeyword`](../enumerations/SyntaxKind.md#extendskeyword) \| [`ImplementsKeyword`](../enumerations/SyntaxKind.md#implementskeyword)

• **types**: readonly [`ExpressionWithTypeArguments`](ExpressionWithTypeArguments.md)[]

#### Returns

[`HeritageClause`](HeritageClause.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7801

***

### createIdentifier()

```ts
createIdentifier(text): Identifier
```

#### Parameters

• **text**: `string`

#### Returns

[`Identifier`](Identifier.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7391

***

### createIfStatement()

```ts
createIfStatement(
   expression, 
   thenStatement, 
   elseStatement?): IfStatement
```

#### Parameters

• **expression**: [`Expression`](Expression.md)

• **thenStatement**: [`Statement`](Statement.md)

• **elseStatement?**: [`Statement`](Statement.md)

#### Returns

[`IfStatement`](IfStatement.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7604

***

### createImmediatelyInvokedArrowFunction()

#### createImmediatelyInvokedArrowFunction(statements)

```ts
createImmediatelyInvokedArrowFunction(statements): ImmediatelyInvokedArrowFunction
```

##### Parameters

• **statements**: readonly [`Statement`](Statement.md)[]

##### Returns

[`ImmediatelyInvokedArrowFunction`](../type-aliases/ImmediatelyInvokedArrowFunction.md)

##### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7857

#### createImmediatelyInvokedArrowFunction(statements, param, paramValue)

```ts
createImmediatelyInvokedArrowFunction(
   statements, 
   param, 
   paramValue): ImmediatelyInvokedArrowFunction
```

##### Parameters

• **statements**: readonly [`Statement`](Statement.md)[]

• **param**: [`ParameterDeclaration`](ParameterDeclaration.md)

• **paramValue**: [`Expression`](Expression.md)

##### Returns

[`ImmediatelyInvokedArrowFunction`](../type-aliases/ImmediatelyInvokedArrowFunction.md)

##### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7858

***

### createImmediatelyInvokedFunctionExpression()

#### createImmediatelyInvokedFunctionExpression(statements)

```ts
createImmediatelyInvokedFunctionExpression(statements): CallExpression
```

##### Parameters

• **statements**: readonly [`Statement`](Statement.md)[]

##### Returns

[`CallExpression`](CallExpression.md)

##### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7855

#### createImmediatelyInvokedFunctionExpression(statements, param, paramValue)

```ts
createImmediatelyInvokedFunctionExpression(
   statements, 
   param, 
   paramValue): CallExpression
```

##### Parameters

• **statements**: readonly [`Statement`](Statement.md)[]

• **param**: [`ParameterDeclaration`](ParameterDeclaration.md)

• **paramValue**: [`Expression`](Expression.md)

##### Returns

[`CallExpression`](CallExpression.md)

##### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7856

***

### createImportAttribute()

```ts
createImportAttribute(name, value): ImportAttribute
```

#### Parameters

• **name**: [`ImportAttributeName`](../type-aliases/ImportAttributeName.md)

• **value**: [`Expression`](Expression.md)

#### Returns

[`ImportAttribute`](ImportAttribute.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7669

***

### createImportAttributes()

```ts
createImportAttributes(elements, multiLine?): ImportAttributes
```

#### Parameters

• **elements**: [`NodeArray`](NodeArray.md)\<[`ImportAttribute`](ImportAttribute.md)\>

• **multiLine?**: `boolean`

#### Returns

[`ImportAttributes`](ImportAttributes.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7667

***

### createImportClause()

```ts
createImportClause(
   isTypeOnly, 
   name, 
   namedBindings): ImportClause
```

#### Parameters

• **isTypeOnly**: `boolean`

• **name**: `undefined` \| [`Identifier`](Identifier.md)

• **namedBindings**: `undefined` \| [`NamedImportBindings`](../type-aliases/NamedImportBindings.md)

#### Returns

[`ImportClause`](ImportClause.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7659

***

### createImportDeclaration()

```ts
createImportDeclaration(
   modifiers, 
   importClause, 
   moduleSpecifier, 
   attributes?): ImportDeclaration
```

#### Parameters

• **modifiers**: `undefined` \| readonly [`ModifierLike`](../type-aliases/ModifierLike.md)[]

• **importClause**: `undefined` \| [`ImportClause`](ImportClause.md)

• **moduleSpecifier**: [`Expression`](Expression.md)

• **attributes?**: [`ImportAttributes`](ImportAttributes.md)

#### Returns

[`ImportDeclaration`](ImportDeclaration.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7657

***

### createImportEqualsDeclaration()

```ts
createImportEqualsDeclaration(
   modifiers, 
   isTypeOnly, 
   name, 
   moduleReference): ImportEqualsDeclaration
```

#### Parameters

• **modifiers**: `undefined` \| readonly [`ModifierLike`](../type-aliases/ModifierLike.md)[]

• **isTypeOnly**: `boolean`

• **name**: `string` \| [`Identifier`](Identifier.md)

• **moduleReference**: [`ModuleReference`](../type-aliases/ModuleReference.md)

#### Returns

[`ImportEqualsDeclaration`](ImportEqualsDeclaration.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7655

***

### createImportSpecifier()

```ts
createImportSpecifier(
   isTypeOnly, 
   propertyName, 
   name): ImportSpecifier
```

#### Parameters

• **isTypeOnly**: `boolean`

• **propertyName**: `undefined` \| [`ModuleExportName`](../type-aliases/ModuleExportName.md)

• **name**: [`Identifier`](Identifier.md)

#### Returns

[`ImportSpecifier`](ImportSpecifier.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7677

***

### ~~createImportTypeAssertionContainer()~~

```ts
createImportTypeAssertionContainer(clause, multiLine?): ImportTypeAssertionContainer
```

#### Parameters

• **clause**: [`AssertClause`](AssertClause.md)

• **multiLine?**: `boolean`

#### Returns

[`ImportTypeAssertionContainer`](ImportTypeAssertionContainer.md)

#### Deprecated

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7665

***

### createImportTypeNode()

```ts
createImportTypeNode(
   argument, 
   attributes?, 
   qualifier?, 
   typeArguments?, 
   isTypeOf?): ImportTypeNode
```

#### Parameters

• **argument**: [`TypeNode`](TypeNode.md)

• **attributes?**: [`ImportAttributes`](ImportAttributes.md)

• **qualifier?**: [`EntityName`](../type-aliases/EntityName.md)

• **typeArguments?**: readonly [`TypeNode`](TypeNode.md)[]

• **isTypeOf?**: `boolean`

#### Returns

[`ImportTypeNode`](ImportTypeNode.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7499

***

### createIndexedAccessTypeNode()

```ts
createIndexedAccessTypeNode(objectType, indexType): IndexedAccessTypeNode
```

#### Parameters

• **objectType**: [`TypeNode`](TypeNode.md)

• **indexType**: [`TypeNode`](TypeNode.md)

#### Returns

[`IndexedAccessTypeNode`](IndexedAccessTypeNode.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7506

***

### createIndexSignature()

```ts
createIndexSignature(
   modifiers, 
   parameters, 
   type): IndexSignatureDeclaration
```

#### Parameters

• **modifiers**: `undefined` \| readonly [`ModifierLike`](../type-aliases/ModifierLike.md)[]

• **parameters**: readonly [`ParameterDeclaration`](ParameterDeclaration.md)[]

• **type**: [`TypeNode`](TypeNode.md)

#### Returns

[`IndexSignatureDeclaration`](IndexSignatureDeclaration.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7462

***

### createInequality()

```ts
createInequality(left, right): BinaryExpression
```

#### Parameters

• **left**: [`Expression`](Expression.md)

• **right**: [`Expression`](Expression.md)

#### Returns

[`BinaryExpression`](BinaryExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7833

***

### createInferTypeNode()

```ts
createInferTypeNode(typeParameter): InferTypeNode
```

#### Parameters

• **typeParameter**: [`TypeParameterDeclaration`](TypeParameterDeclaration.md)

#### Returns

[`InferTypeNode`](InferTypeNode.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7497

***

### createInterfaceDeclaration()

```ts
createInterfaceDeclaration(
   modifiers, 
   name, 
   typeParameters, 
   heritageClauses, 
   members): InterfaceDeclaration
```

#### Parameters

• **modifiers**: `undefined` \| readonly [`ModifierLike`](../type-aliases/ModifierLike.md)[]

• **name**: `string` \| [`Identifier`](Identifier.md)

• **typeParameters**: `undefined` \| readonly [`TypeParameterDeclaration`](TypeParameterDeclaration.md)[]

• **heritageClauses**: `undefined` \| readonly [`HeritageClause`](HeritageClause.md)[]

• **members**: readonly [`TypeElement`](TypeElement.md)[]

#### Returns

[`InterfaceDeclaration`](InterfaceDeclaration.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7641

***

### createIntersectionTypeNode()

```ts
createIntersectionTypeNode(types): IntersectionTypeNode
```

#### Parameters

• **types**: readonly [`TypeNode`](TypeNode.md)[]

#### Returns

[`IntersectionTypeNode`](IntersectionTypeNode.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7493

***

### createJSDocAllType()

```ts
createJSDocAllType(): JSDocAllType
```

#### Returns

[`JSDocAllType`](JSDocAllType.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7689

***

### createJSDocAugmentsTag()

```ts
createJSDocAugmentsTag(
   tagName, 
   className, 
   comment?): JSDocAugmentsTag
```

#### Parameters

• **tagName**: `undefined` \| [`Identifier`](Identifier.md)

• **className**: [`ExpressionWithTypeArguments`](ExpressionWithTypeArguments.md) & `object`

• **comment?**: `string` \| [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocAugmentsTag`](JSDocAugmentsTag.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7741

***

### createJSDocAuthorTag()

```ts
createJSDocAuthorTag(tagName, comment?): JSDocAuthorTag
```

#### Parameters

• **tagName**: `undefined` \| [`Identifier`](Identifier.md)

• **comment?**: `string` \| [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocAuthorTag`](JSDocAuthorTag.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7745

***

### createJSDocCallbackTag()

```ts
createJSDocCallbackTag(
   tagName, 
   typeExpression, 
   fullName?, 
   comment?): JSDocCallbackTag
```

#### Parameters

• **tagName**: `undefined` \| [`Identifier`](Identifier.md)

• **typeExpression**: [`JSDocSignature`](JSDocSignature.md)

• **fullName?**: [`Identifier`](Identifier.md) \| [`JSDocNamespaceDeclaration`](JSDocNamespaceDeclaration.md)

• **comment?**: `string` \| [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocCallbackTag`](JSDocCallbackTag.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7737

***

### createJSDocClassTag()

```ts
createJSDocClassTag(tagName, comment?): JSDocClassTag
```

#### Parameters

• **tagName**: `undefined` \| [`Identifier`](Identifier.md)

• **comment?**: `string` \| [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocClassTag`](JSDocClassTag.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7747

***

### createJSDocComment()

```ts
createJSDocComment(comment?, tags?): JSDoc
```

#### Parameters

• **comment?**: `string` \| [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

• **tags?**: readonly [`JSDocTag`](JSDocTag.md)[]

#### Returns

[`JSDoc`](JSDoc.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7771

***

### createJSDocDeprecatedTag()

```ts
createJSDocDeprecatedTag(tagName, comment?): JSDocDeprecatedTag
```

#### Parameters

• **tagName**: `undefined` \| [`Identifier`](Identifier.md)

• **comment?**: `string` \| [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocDeprecatedTag`](JSDocDeprecatedTag.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7759

***

### createJSDocEnumTag()

```ts
createJSDocEnumTag(
   tagName, 
   typeExpression, 
   comment?): JSDocEnumTag
```

#### Parameters

• **tagName**: `undefined` \| [`Identifier`](Identifier.md)

• **typeExpression**: [`JSDocTypeExpression`](JSDocTypeExpression.md)

• **comment?**: `string` \| [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocEnumTag`](JSDocEnumTag.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7735

***

### createJSDocFunctionType()

```ts
createJSDocFunctionType(parameters, type): JSDocFunctionType
```

#### Parameters

• **parameters**: readonly [`ParameterDeclaration`](ParameterDeclaration.md)[]

• **type**: `undefined` \| [`TypeNode`](TypeNode.md)

#### Returns

[`JSDocFunctionType`](JSDocFunctionType.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7697

***

### createJSDocImplementsTag()

```ts
createJSDocImplementsTag(
   tagName, 
   className, 
   comment?): JSDocImplementsTag
```

#### Parameters

• **tagName**: `undefined` \| [`Identifier`](Identifier.md)

• **className**: [`ExpressionWithTypeArguments`](ExpressionWithTypeArguments.md) & `object`

• **comment?**: `string` \| [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocImplementsTag`](JSDocImplementsTag.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7743

***

### createJSDocImportTag()

```ts
createJSDocImportTag(
   tagName, 
   importClause, 
   moduleSpecifier, 
   attributes?, 
   comment?): JSDocImportTag
```

#### Parameters

• **tagName**: `undefined` \| [`Identifier`](Identifier.md)

• **importClause**: `undefined` \| [`ImportClause`](ImportClause.md)

• **moduleSpecifier**: [`Expression`](Expression.md)

• **attributes?**: [`ImportAttributes`](ImportAttributes.md)

• **comment?**: `string` \| [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocImportTag`](JSDocImportTag.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7767

***

### createJSDocLink()

```ts
createJSDocLink(name, text): JSDocLink
```

#### Parameters

• **name**: `undefined` \| [`EntityName`](../type-aliases/EntityName.md) \| [`JSDocMemberName`](JSDocMemberName.md)

• **text**: `string`

#### Returns

[`JSDocLink`](JSDocLink.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7709

***

### createJSDocLinkCode()

```ts
createJSDocLinkCode(name, text): JSDocLinkCode
```

#### Parameters

• **name**: `undefined` \| [`EntityName`](../type-aliases/EntityName.md) \| [`JSDocMemberName`](JSDocMemberName.md)

• **text**: `string`

#### Returns

[`JSDocLinkCode`](JSDocLinkCode.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7711

***

### createJSDocLinkPlain()

```ts
createJSDocLinkPlain(name, text): JSDocLinkPlain
```

#### Parameters

• **name**: `undefined` \| [`EntityName`](../type-aliases/EntityName.md) \| [`JSDocMemberName`](JSDocMemberName.md)

• **text**: `string`

#### Returns

[`JSDocLinkPlain`](JSDocLinkPlain.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7713

***

### createJSDocMemberName()

```ts
createJSDocMemberName(left, right): JSDocMemberName
```

#### Parameters

• **left**: [`EntityName`](../type-aliases/EntityName.md) \| [`JSDocMemberName`](JSDocMemberName.md)

• **right**: [`Identifier`](Identifier.md)

#### Returns

[`JSDocMemberName`](JSDocMemberName.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7707

***

### createJSDocNamepathType()

```ts
createJSDocNamepathType(type): JSDocNamepathType
```

#### Parameters

• **type**: [`TypeNode`](TypeNode.md)

#### Returns

[`JSDocNamepathType`](JSDocNamepathType.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7701

***

### createJSDocNameReference()

```ts
createJSDocNameReference(name): JSDocNameReference
```

#### Parameters

• **name**: [`EntityName`](../type-aliases/EntityName.md) \| [`JSDocMemberName`](JSDocMemberName.md)

#### Returns

[`JSDocNameReference`](JSDocNameReference.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7705

***

### createJSDocNonNullableType()

```ts
createJSDocNonNullableType(type, postfix?): JSDocNonNullableType
```

#### Parameters

• **type**: [`TypeNode`](TypeNode.md)

• **postfix?**: `boolean`

#### Returns

[`JSDocNonNullableType`](JSDocNonNullableType.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7691

***

### createJSDocNullableType()

```ts
createJSDocNullableType(type, postfix?): JSDocNullableType
```

#### Parameters

• **type**: [`TypeNode`](TypeNode.md)

• **postfix?**: `boolean`

#### Returns

[`JSDocNullableType`](JSDocNullableType.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7693

***

### createJSDocOptionalType()

```ts
createJSDocOptionalType(type): JSDocOptionalType
```

#### Parameters

• **type**: [`TypeNode`](TypeNode.md)

#### Returns

[`JSDocOptionalType`](JSDocOptionalType.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7695

***

### createJSDocOverloadTag()

```ts
createJSDocOverloadTag(
   tagName, 
   typeExpression, 
   comment?): JSDocOverloadTag
```

#### Parameters

• **tagName**: `undefined` \| [`Identifier`](Identifier.md)

• **typeExpression**: [`JSDocSignature`](JSDocSignature.md)

• **comment?**: `string` \| [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocOverloadTag`](JSDocOverloadTag.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7739

***

### createJSDocOverrideTag()

```ts
createJSDocOverrideTag(tagName, comment?): JSDocOverrideTag
```

#### Parameters

• **tagName**: `undefined` \| [`Identifier`](Identifier.md)

• **comment?**: `string` \| [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocOverrideTag`](JSDocOverrideTag.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7761

***

### createJSDocParameterTag()

```ts
createJSDocParameterTag(
   tagName, 
   name, 
   isBracketed, 
   typeExpression?, 
   isNameFirst?, 
   comment?): JSDocParameterTag
```

#### Parameters

• **tagName**: `undefined` \| [`Identifier`](Identifier.md)

• **name**: [`EntityName`](../type-aliases/EntityName.md)

• **isBracketed**: `boolean`

• **typeExpression?**: [`JSDocTypeExpression`](JSDocTypeExpression.md)

• **isNameFirst?**: `boolean`

• **comment?**: `string` \| [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocParameterTag`](JSDocParameterTag.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7723

***

### createJSDocPrivateTag()

```ts
createJSDocPrivateTag(tagName, comment?): JSDocPrivateTag
```

#### Parameters

• **tagName**: `undefined` \| [`Identifier`](Identifier.md)

• **comment?**: `string` \| [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocPrivateTag`](JSDocPrivateTag.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7751

***

### createJSDocPropertyTag()

```ts
createJSDocPropertyTag(
   tagName, 
   name, 
   isBracketed, 
   typeExpression?, 
   isNameFirst?, 
   comment?): JSDocPropertyTag
```

#### Parameters

• **tagName**: `undefined` \| [`Identifier`](Identifier.md)

• **name**: [`EntityName`](../type-aliases/EntityName.md)

• **isBracketed**: `boolean`

• **typeExpression?**: [`JSDocTypeExpression`](JSDocTypeExpression.md)

• **isNameFirst?**: `boolean`

• **comment?**: `string` \| [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocPropertyTag`](JSDocPropertyTag.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7725

***

### createJSDocProtectedTag()

```ts
createJSDocProtectedTag(tagName, comment?): JSDocProtectedTag
```

#### Parameters

• **tagName**: `undefined` \| [`Identifier`](Identifier.md)

• **comment?**: `string` \| [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocProtectedTag`](JSDocProtectedTag.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7753

***

### createJSDocPublicTag()

```ts
createJSDocPublicTag(tagName, comment?): JSDocPublicTag
```

#### Parameters

• **tagName**: `undefined` \| [`Identifier`](Identifier.md)

• **comment?**: `string` \| [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocPublicTag`](JSDocPublicTag.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7749

***

### createJSDocReadonlyTag()

```ts
createJSDocReadonlyTag(tagName, comment?): JSDocReadonlyTag
```

#### Parameters

• **tagName**: `undefined` \| [`Identifier`](Identifier.md)

• **comment?**: `string` \| [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocReadonlyTag`](JSDocReadonlyTag.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7755

***

### createJSDocReturnTag()

```ts
createJSDocReturnTag(
   tagName, 
   typeExpression?, 
   comment?): JSDocReturnTag
```

#### Parameters

• **tagName**: `undefined` \| [`Identifier`](Identifier.md)

• **typeExpression?**: [`JSDocTypeExpression`](JSDocTypeExpression.md)

• **comment?**: `string` \| [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocReturnTag`](JSDocReturnTag.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7731

***

### createJSDocSatisfiesTag()

```ts
createJSDocSatisfiesTag(
   tagName, 
   typeExpression, 
   comment?): JSDocSatisfiesTag
```

#### Parameters

• **tagName**: `undefined` \| [`Identifier`](Identifier.md)

• **typeExpression**: [`JSDocTypeExpression`](JSDocTypeExpression.md)

• **comment?**: `string` \| [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocSatisfiesTag`](JSDocSatisfiesTag.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7765

***

### createJSDocSeeTag()

```ts
createJSDocSeeTag(
   tagName, 
   nameExpression, 
   comment?): JSDocSeeTag
```

#### Parameters

• **tagName**: `undefined` \| [`Identifier`](Identifier.md)

• **nameExpression**: `undefined` \| [`JSDocNameReference`](JSDocNameReference.md)

• **comment?**: `string` \| [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocSeeTag`](JSDocSeeTag.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7729

***

### createJSDocSignature()

```ts
createJSDocSignature(
   typeParameters, 
   parameters, 
   type?): JSDocSignature
```

#### Parameters

• **typeParameters**: `undefined` \| readonly [`JSDocTemplateTag`](JSDocTemplateTag.md)[]

• **parameters**: readonly [`JSDocParameterTag`](JSDocParameterTag.md)[]

• **type?**: [`JSDocReturnTag`](JSDocReturnTag.md)

#### Returns

[`JSDocSignature`](JSDocSignature.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7717

***

### createJSDocTemplateTag()

```ts
createJSDocTemplateTag(
   tagName, 
   constraint, 
   typeParameters, 
   comment?): JSDocTemplateTag
```

#### Parameters

• **tagName**: `undefined` \| [`Identifier`](Identifier.md)

• **constraint**: `undefined` \| [`JSDocTypeExpression`](JSDocTypeExpression.md)

• **typeParameters**: readonly [`TypeParameterDeclaration`](TypeParameterDeclaration.md)[]

• **comment?**: `string` \| [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocTemplateTag`](JSDocTemplateTag.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7719

***

### createJSDocText()

```ts
createJSDocText(text): JSDocText
```

#### Parameters

• **text**: `string`

#### Returns

[`JSDocText`](JSDocText.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7769

***

### createJSDocThisTag()

```ts
createJSDocThisTag(
   tagName, 
   typeExpression, 
   comment?): JSDocThisTag
```

#### Parameters

• **tagName**: `undefined` \| [`Identifier`](Identifier.md)

• **typeExpression**: [`JSDocTypeExpression`](JSDocTypeExpression.md)

• **comment?**: `string` \| [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocThisTag`](JSDocThisTag.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7733

***

### createJSDocThrowsTag()

```ts
createJSDocThrowsTag(
   tagName, 
   typeExpression, 
   comment?): JSDocThrowsTag
```

#### Parameters

• **tagName**: [`Identifier`](Identifier.md)

• **typeExpression**: `undefined` \| [`JSDocTypeExpression`](JSDocTypeExpression.md)

• **comment?**: `string` \| [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocThrowsTag`](JSDocThrowsTag.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7763

***

### createJSDocTypedefTag()

```ts
createJSDocTypedefTag(
   tagName, 
   typeExpression?, 
   fullName?, 
   comment?): JSDocTypedefTag
```

#### Parameters

• **tagName**: `undefined` \| [`Identifier`](Identifier.md)

• **typeExpression?**: [`JSDocTypeLiteral`](JSDocTypeLiteral.md) \| [`JSDocTypeExpression`](JSDocTypeExpression.md)

• **fullName?**: [`Identifier`](Identifier.md) \| [`JSDocNamespaceDeclaration`](JSDocNamespaceDeclaration.md)

• **comment?**: `string` \| [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocTypedefTag`](JSDocTypedefTag.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7721

***

### createJSDocTypeExpression()

```ts
createJSDocTypeExpression(type): JSDocTypeExpression
```

#### Parameters

• **type**: [`TypeNode`](TypeNode.md)

#### Returns

[`JSDocTypeExpression`](JSDocTypeExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7703

***

### createJSDocTypeLiteral()

```ts
createJSDocTypeLiteral(jsDocPropertyTags?, isArrayType?): JSDocTypeLiteral
```

#### Parameters

• **jsDocPropertyTags?**: readonly [`JSDocPropertyLikeTag`](JSDocPropertyLikeTag.md)[]

• **isArrayType?**: `boolean`

#### Returns

[`JSDocTypeLiteral`](JSDocTypeLiteral.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7715

***

### createJSDocTypeTag()

```ts
createJSDocTypeTag(
   tagName, 
   typeExpression, 
   comment?): JSDocTypeTag
```

#### Parameters

• **tagName**: `undefined` \| [`Identifier`](Identifier.md)

• **typeExpression**: [`JSDocTypeExpression`](JSDocTypeExpression.md)

• **comment?**: `string` \| [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocTypeTag`](JSDocTypeTag.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7727

***

### createJSDocUnknownTag()

```ts
createJSDocUnknownTag(tagName, comment?): JSDocUnknownTag
```

#### Parameters

• **tagName**: [`Identifier`](Identifier.md)

• **comment?**: `string` \| [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocUnknownTag`](JSDocUnknownTag.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7757

***

### createJSDocUnknownType()

```ts
createJSDocUnknownType(): JSDocUnknownType
```

#### Returns

[`JSDocUnknownType`](JSDocUnknownType.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7690

***

### createJSDocVariadicType()

```ts
createJSDocVariadicType(type): JSDocVariadicType
```

#### Parameters

• **type**: [`TypeNode`](TypeNode.md)

#### Returns

[`JSDocVariadicType`](JSDocVariadicType.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7699

***

### createJsxAttribute()

```ts
createJsxAttribute(name, initializer): JsxAttribute
```

#### Parameters

• **name**: [`JsxAttributeName`](../type-aliases/JsxAttributeName.md)

• **initializer**: `undefined` \| [`JsxAttributeValue`](../type-aliases/JsxAttributeValue.md)

#### Returns

[`JsxAttribute`](JsxAttribute.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7787

***

### createJsxAttributes()

```ts
createJsxAttributes(properties): JsxAttributes
```

#### Parameters

• **properties**: readonly [`JsxAttributeLike`](../type-aliases/JsxAttributeLike.md)[]

#### Returns

[`JsxAttributes`](JsxAttributes.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7789

***

### createJsxClosingElement()

```ts
createJsxClosingElement(tagName): JsxClosingElement
```

#### Parameters

• **tagName**: [`JsxTagNameExpression`](../type-aliases/JsxTagNameExpression.md)

#### Returns

[`JsxClosingElement`](JsxClosingElement.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7779

***

### createJsxElement()

```ts
createJsxElement(
   openingElement, 
   children, 
   closingElement): JsxElement
```

#### Parameters

• **openingElement**: [`JsxOpeningElement`](JsxOpeningElement.md)

• **children**: readonly [`JsxChild`](../type-aliases/JsxChild.md)[]

• **closingElement**: [`JsxClosingElement`](JsxClosingElement.md)

#### Returns

[`JsxElement`](JsxElement.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7773

***

### createJsxExpression()

```ts
createJsxExpression(dotDotDotToken, expression): JsxExpression
```

#### Parameters

• **dotDotDotToken**: `undefined` \| [`DotDotDotToken`](../type-aliases/DotDotDotToken.md)

• **expression**: `undefined` \| [`Expression`](Expression.md)

#### Returns

[`JsxExpression`](JsxExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7793

***

### createJsxFragment()

```ts
createJsxFragment(
   openingFragment, 
   children, 
   closingFragment): JsxFragment
```

#### Parameters

• **openingFragment**: [`JsxOpeningFragment`](JsxOpeningFragment.md)

• **children**: readonly [`JsxChild`](../type-aliases/JsxChild.md)[]

• **closingFragment**: [`JsxClosingFragment`](JsxClosingFragment.md)

#### Returns

[`JsxFragment`](JsxFragment.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7781

***

### createJsxJsxClosingFragment()

```ts
createJsxJsxClosingFragment(): JsxClosingFragment
```

#### Returns

[`JsxClosingFragment`](JsxClosingFragment.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7785

***

### createJsxNamespacedName()

```ts
createJsxNamespacedName(namespace, name): JsxNamespacedName
```

#### Parameters

• **namespace**: [`Identifier`](Identifier.md)

• **name**: [`Identifier`](Identifier.md)

#### Returns

[`JsxNamespacedName`](JsxNamespacedName.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7795

***

### createJsxOpeningElement()

```ts
createJsxOpeningElement(
   tagName, 
   typeArguments, 
   attributes): JsxOpeningElement
```

#### Parameters

• **tagName**: [`JsxTagNameExpression`](../type-aliases/JsxTagNameExpression.md)

• **typeArguments**: `undefined` \| readonly [`TypeNode`](TypeNode.md)[]

• **attributes**: [`JsxAttributes`](JsxAttributes.md)

#### Returns

[`JsxOpeningElement`](JsxOpeningElement.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7777

***

### createJsxOpeningFragment()

```ts
createJsxOpeningFragment(): JsxOpeningFragment
```

#### Returns

[`JsxOpeningFragment`](JsxOpeningFragment.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7784

***

### createJsxSelfClosingElement()

```ts
createJsxSelfClosingElement(
   tagName, 
   typeArguments, 
   attributes): JsxSelfClosingElement
```

#### Parameters

• **tagName**: [`JsxTagNameExpression`](../type-aliases/JsxTagNameExpression.md)

• **typeArguments**: `undefined` \| readonly [`TypeNode`](TypeNode.md)[]

• **attributes**: [`JsxAttributes`](JsxAttributes.md)

#### Returns

[`JsxSelfClosingElement`](JsxSelfClosingElement.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7775

***

### createJsxSpreadAttribute()

```ts
createJsxSpreadAttribute(expression): JsxSpreadAttribute
```

#### Parameters

• **expression**: [`Expression`](Expression.md)

#### Returns

[`JsxSpreadAttribute`](JsxSpreadAttribute.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7791

***

### createJsxText()

```ts
createJsxText(text, containsOnlyTriviaWhiteSpaces?): JsxText
```

#### Parameters

• **text**: `string`

• **containsOnlyTriviaWhiteSpaces?**: `boolean`

#### Returns

[`JsxText`](JsxText.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7782

***

### createKeywordTypeNode()

```ts
createKeywordTypeNode<TKind>(kind): KeywordTypeNode<TKind>
```

#### Type Parameters

• **TKind** *extends* [`KeywordTypeSyntaxKind`](../type-aliases/KeywordTypeSyntaxKind.md)

#### Parameters

• **kind**: `TKind`

#### Returns

[`KeywordTypeNode`](KeywordTypeNode.md)\<`TKind`\>

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7468

***

### createLabeledStatement()

```ts
createLabeledStatement(label, statement): LabeledStatement
```

#### Parameters

• **label**: `string` \| [`Identifier`](Identifier.md)

• **statement**: [`Statement`](Statement.md)

#### Returns

[`LabeledStatement`](LabeledStatement.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7626

***

### createLeftShift()

```ts
createLeftShift(left, right): BinaryExpression
```

#### Parameters

• **left**: [`Expression`](Expression.md)

• **right**: [`Expression`](Expression.md)

#### Returns

[`BinaryExpression`](BinaryExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7838

***

### createLessThan()

```ts
createLessThan(left, right): BinaryExpression
```

#### Parameters

• **left**: [`Expression`](Expression.md)

• **right**: [`Expression`](Expression.md)

#### Returns

[`BinaryExpression`](BinaryExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7834

***

### createLessThanEquals()

```ts
createLessThanEquals(left, right): BinaryExpression
```

#### Parameters

• **left**: [`Expression`](Expression.md)

• **right**: [`Expression`](Expression.md)

#### Returns

[`BinaryExpression`](BinaryExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7835

***

### createLiteralTypeNode()

```ts
createLiteralTypeNode(literal): LiteralTypeNode
```

#### Parameters

• **literal**: [`LiteralExpression`](LiteralExpression.md) \| [`NullLiteral`](NullLiteral.md) \| [`BooleanLiteral`](../type-aliases/BooleanLiteral.md) \| [`PrefixUnaryExpression`](PrefixUnaryExpression.md)

#### Returns

[`LiteralTypeNode`](LiteralTypeNode.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7510

***

### createLogicalAnd()

```ts
createLogicalAnd(left, right): BinaryExpression
```

#### Parameters

• **left**: [`Expression`](Expression.md)

• **right**: [`Expression`](Expression.md)

#### Returns

[`BinaryExpression`](BinaryExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7826

***

### createLogicalNot()

```ts
createLogicalNot(operand): PrefixUnaryExpression
```

#### Parameters

• **operand**: [`Expression`](Expression.md)

#### Returns

[`PrefixUnaryExpression`](PrefixUnaryExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7852

***

### createLogicalOr()

```ts
createLogicalOr(left, right): BinaryExpression
```

#### Parameters

• **left**: [`Expression`](Expression.md)

• **right**: [`Expression`](Expression.md)

#### Returns

[`BinaryExpression`](BinaryExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7825

***

### createLoopVariable()

```ts
createLoopVariable(reservedInNestedScopes?): Identifier
```

Create a unique temporary variable for use in a loop.

#### Parameters

• **reservedInNestedScopes?**: `boolean`

When `true`, reserves the temporary variable name in all nested scopes
during emit so that the variable can be referenced in a nested function body. This is an alternative to
setting `EmitFlags.ReuseTempVariableScope` on the nested function itself.

#### Returns

[`Identifier`](Identifier.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7408

***

### createMappedTypeNode()

```ts
createMappedTypeNode(
   readonlyToken, 
   typeParameter, 
   nameType, 
   questionToken, 
   type, 
   members): MappedTypeNode
```

#### Parameters

• **readonlyToken**: `undefined` \| [`ReadonlyKeyword`](../type-aliases/ReadonlyKeyword.md) \| [`PlusToken`](../type-aliases/PlusToken.md) \| [`MinusToken`](../type-aliases/MinusToken.md)

• **typeParameter**: [`TypeParameterDeclaration`](TypeParameterDeclaration.md)

• **nameType**: `undefined` \| [`TypeNode`](TypeNode.md)

• **questionToken**: `undefined` \| [`QuestionToken`](../type-aliases/QuestionToken.md) \| [`PlusToken`](../type-aliases/PlusToken.md) \| [`MinusToken`](../type-aliases/MinusToken.md)

• **type**: `undefined` \| [`TypeNode`](TypeNode.md)

• **members**: `undefined` \| [`NodeArray`](NodeArray.md)\<[`TypeElement`](TypeElement.md)\>

#### Returns

[`MappedTypeNode`](MappedTypeNode.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7508

***

### createMetaProperty()

```ts
createMetaProperty(keywordToken, name): MetaProperty
```

#### Parameters

• **keywordToken**: [`ImportKeyword`](../enumerations/SyntaxKind.md#importkeyword) \| [`NewKeyword`](../enumerations/SyntaxKind.md#newkeyword)

• **name**: [`Identifier`](Identifier.md)

#### Returns

[`MetaProperty`](MetaProperty.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7590

***

### createMethodDeclaration()

```ts
createMethodDeclaration(
   modifiers, 
   asteriskToken, 
   name, 
   questionToken, 
   typeParameters, 
   parameters, 
   type, 
   body): MethodDeclaration
```

#### Parameters

• **modifiers**: `undefined` \| readonly [`ModifierLike`](../type-aliases/ModifierLike.md)[]

• **asteriskToken**: `undefined` \| [`AsteriskToken`](../type-aliases/AsteriskToken.md)

• **name**: `string` \| [`PropertyName`](../type-aliases/PropertyName.md)

• **questionToken**: `undefined` \| [`QuestionToken`](../type-aliases/QuestionToken.md)

• **typeParameters**: `undefined` \| readonly [`TypeParameterDeclaration`](TypeParameterDeclaration.md)[]

• **parameters**: readonly [`ParameterDeclaration`](ParameterDeclaration.md)[]

• **type**: `undefined` \| [`TypeNode`](TypeNode.md)

• **body**: `undefined` \| [`Block`](Block.md)

#### Returns

[`MethodDeclaration`](MethodDeclaration.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7450

***

### createMethodSignature()

```ts
createMethodSignature(
   modifiers, 
   name, 
   questionToken, 
   typeParameters, 
   parameters, 
   type): MethodSignature
```

#### Parameters

• **modifiers**: `undefined` \| readonly [`Modifier`](../type-aliases/Modifier.md)[]

• **name**: `string` \| [`PropertyName`](../type-aliases/PropertyName.md)

• **questionToken**: `undefined` \| [`QuestionToken`](../type-aliases/QuestionToken.md)

• **typeParameters**: `undefined` \| readonly [`TypeParameterDeclaration`](TypeParameterDeclaration.md)[]

• **parameters**: readonly [`ParameterDeclaration`](ParameterDeclaration.md)[]

• **type**: `undefined` \| [`TypeNode`](TypeNode.md)

#### Returns

[`MethodSignature`](MethodSignature.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7448

***

### createModifier()

```ts
createModifier<T>(kind): ModifierToken<T>
```

#### Type Parameters

• **T** *extends* [`ModifierSyntaxKind`](../type-aliases/ModifierSyntaxKind.md)

#### Parameters

• **kind**: `T`

#### Returns

[`ModifierToken`](ModifierToken.md)\<`T`\>

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7432

***

### createModifiersFromModifierFlags()

```ts
createModifiersFromModifierFlags(flags): undefined | Modifier[]
```

#### Parameters

• **flags**: [`ModifierFlags`](../enumerations/ModifierFlags.md)

#### Returns

`undefined` \| [`Modifier`](../type-aliases/Modifier.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7433

***

### createModuleBlock()

```ts
createModuleBlock(statements): ModuleBlock
```

#### Parameters

• **statements**: readonly [`Statement`](Statement.md)[]

#### Returns

[`ModuleBlock`](ModuleBlock.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7649

***

### createModuleDeclaration()

```ts
createModuleDeclaration(
   modifiers, 
   name, 
   body, 
   flags?): ModuleDeclaration
```

#### Parameters

• **modifiers**: `undefined` \| readonly [`ModifierLike`](../type-aliases/ModifierLike.md)[]

• **name**: [`ModuleName`](../type-aliases/ModuleName.md)

• **body**: `undefined` \| [`ModuleBody`](../type-aliases/ModuleBody.md)

• **flags?**: [`NodeFlags`](../enumerations/NodeFlags.md)

#### Returns

[`ModuleDeclaration`](ModuleDeclaration.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7647

***

### createModulo()

```ts
createModulo(left, right): BinaryExpression
```

#### Parameters

• **left**: [`Expression`](Expression.md)

• **right**: [`Expression`](Expression.md)

#### Returns

[`BinaryExpression`](BinaryExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7845

***

### createMultiply()

```ts
createMultiply(left, right): BinaryExpression
```

#### Parameters

• **left**: [`Expression`](Expression.md)

• **right**: [`Expression`](Expression.md)

#### Returns

[`BinaryExpression`](BinaryExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7843

***

### createNamedExports()

```ts
createNamedExports(elements): NamedExports
```

#### Parameters

• **elements**: readonly [`ExportSpecifier`](ExportSpecifier.md)[]

#### Returns

[`NamedExports`](NamedExports.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7683

***

### createNamedImports()

```ts
createNamedImports(elements): NamedImports
```

#### Parameters

• **elements**: readonly [`ImportSpecifier`](ImportSpecifier.md)[]

#### Returns

[`NamedImports`](NamedImports.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7675

***

### createNamedTupleMember()

```ts
createNamedTupleMember(
   dotDotDotToken, 
   name, 
   questionToken, 
   type): NamedTupleMember
```

#### Parameters

• **dotDotDotToken**: `undefined` \| [`DotDotDotToken`](../type-aliases/DotDotDotToken.md)

• **name**: [`Identifier`](Identifier.md)

• **questionToken**: `undefined` \| [`QuestionToken`](../type-aliases/QuestionToken.md)

• **type**: [`TypeNode`](TypeNode.md)

#### Returns

[`NamedTupleMember`](NamedTupleMember.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7485

***

### createNamespaceExport()

```ts
createNamespaceExport(name): NamespaceExport
```

#### Parameters

• **name**: [`ModuleExportName`](../type-aliases/ModuleExportName.md)

#### Returns

[`NamespaceExport`](NamespaceExport.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7673

***

### createNamespaceExportDeclaration()

```ts
createNamespaceExportDeclaration(name): NamespaceExportDeclaration
```

#### Parameters

• **name**: `string` \| [`Identifier`](Identifier.md)

#### Returns

[`NamespaceExportDeclaration`](NamespaceExportDeclaration.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7653

***

### createNamespaceImport()

```ts
createNamespaceImport(name): NamespaceImport
```

#### Parameters

• **name**: [`Identifier`](Identifier.md)

#### Returns

[`NamespaceImport`](NamespaceImport.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7671

***

### createNewExpression()

```ts
createNewExpression(
   expression, 
   typeArguments, 
   argumentsArray): NewExpression
```

#### Parameters

• **expression**: [`Expression`](Expression.md)

• **typeArguments**: `undefined` \| readonly [`TypeNode`](TypeNode.md)[]

• **argumentsArray**: `undefined` \| readonly [`Expression`](Expression.md)[]

#### Returns

[`NewExpression`](NewExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7536

***

### createNodeArray()

```ts
createNodeArray<T>(elements?, hasTrailingComma?): NodeArray<T>
```

#### Type Parameters

• **T** *extends* [`Node`](Node.md)

#### Parameters

• **elements?**: readonly `T`[]

• **hasTrailingComma?**: `boolean`

#### Returns

[`NodeArray`](NodeArray.md)\<`T`\>

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7385

***

### createNonNullChain()

```ts
createNonNullChain(expression): NonNullChain
```

#### Parameters

• **expression**: [`Expression`](Expression.md)

#### Returns

[`NonNullChain`](NonNullChain.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7588

***

### createNonNullExpression()

```ts
createNonNullExpression(expression): NonNullExpression
```

#### Parameters

• **expression**: [`Expression`](Expression.md)

#### Returns

[`NonNullExpression`](NonNullExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7586

***

### createNoSubstitutionTemplateLiteral()

#### createNoSubstitutionTemplateLiteral(text, rawText)

```ts
createNoSubstitutionTemplateLiteral(text, rawText?): NoSubstitutionTemplateLiteral
```

##### Parameters

• **text**: `string`

• **rawText?**: `string`

##### Returns

[`NoSubstitutionTemplateLiteral`](NoSubstitutionTemplateLiteral.md)

##### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7572

#### createNoSubstitutionTemplateLiteral(text, rawText)

```ts
createNoSubstitutionTemplateLiteral(text, rawText): NoSubstitutionTemplateLiteral
```

##### Parameters

• **text**: `undefined` \| `string`

• **rawText**: `string`

##### Returns

[`NoSubstitutionTemplateLiteral`](NoSubstitutionTemplateLiteral.md)

##### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7573

***

### createNotEmittedStatement()

```ts
createNotEmittedStatement(original): NotEmittedStatement
```

#### Parameters

• **original**: [`Node`](Node.md)

#### Returns

[`NotEmittedStatement`](NotEmittedStatement.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7815

***

### createNull()

```ts
createNull(): NullLiteral
```

#### Returns

[`NullLiteral`](NullLiteral.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7429

***

### createNumericLiteral()

```ts
createNumericLiteral(value, numericLiteralFlags?): NumericLiteral
```

#### Parameters

• **value**: `string` \| `number`

• **numericLiteralFlags?**: [`TokenFlags`](../enumerations/TokenFlags.md)

#### Returns

[`NumericLiteral`](NumericLiteral.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7386

***

### createObjectBindingPattern()

```ts
createObjectBindingPattern(elements): ObjectBindingPattern
```

#### Parameters

• **elements**: readonly [`BindingElement`](BindingElement.md)[]

#### Returns

[`ObjectBindingPattern`](ObjectBindingPattern.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7514

***

### createObjectLiteralExpression()

```ts
createObjectLiteralExpression(properties?, multiLine?): ObjectLiteralExpression
```

#### Parameters

• **properties?**: readonly [`ObjectLiteralElementLike`](../type-aliases/ObjectLiteralElementLike.md)[]

• **multiLine?**: `boolean`

#### Returns

[`ObjectLiteralExpression`](ObjectLiteralExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7522

***

### createOmittedExpression()

```ts
createOmittedExpression(): OmittedExpression
```

#### Returns

[`OmittedExpression`](OmittedExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7581

***

### createOptionalTypeNode()

```ts
createOptionalTypeNode(type): OptionalTypeNode
```

#### Parameters

• **type**: [`TypeNode`](TypeNode.md)

#### Returns

[`OptionalTypeNode`](OptionalTypeNode.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7487

***

### createParameterDeclaration()

```ts
createParameterDeclaration(
   modifiers, 
   dotDotDotToken, 
   name, 
   questionToken?, 
   type?, 
   initializer?): ParameterDeclaration
```

#### Parameters

• **modifiers**: `undefined` \| readonly [`ModifierLike`](../type-aliases/ModifierLike.md)[]

• **dotDotDotToken**: `undefined` \| [`DotDotDotToken`](../type-aliases/DotDotDotToken.md)

• **name**: `string` \| [`BindingName`](../type-aliases/BindingName.md)

• **questionToken?**: [`QuestionToken`](../type-aliases/QuestionToken.md)

• **type?**: [`TypeNode`](TypeNode.md)

• **initializer?**: [`Expression`](Expression.md)

#### Returns

[`ParameterDeclaration`](ParameterDeclaration.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7440

***

### createParenthesizedExpression()

```ts
createParenthesizedExpression(expression): ParenthesizedExpression
```

#### Parameters

• **expression**: [`Expression`](Expression.md)

#### Returns

[`ParenthesizedExpression`](ParenthesizedExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7542

***

### createParenthesizedType()

```ts
createParenthesizedType(type): ParenthesizedTypeNode
```

#### Parameters

• **type**: [`TypeNode`](TypeNode.md)

#### Returns

[`ParenthesizedTypeNode`](ParenthesizedTypeNode.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7501

***

### createPartiallyEmittedExpression()

```ts
createPartiallyEmittedExpression(expression, original?): PartiallyEmittedExpression
```

#### Parameters

• **expression**: [`Expression`](Expression.md)

• **original?**: [`Node`](Node.md)

#### Returns

[`PartiallyEmittedExpression`](PartiallyEmittedExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7816

***

### createPostfixDecrement()

```ts
createPostfixDecrement(operand): PostfixUnaryExpression
```

#### Parameters

• **operand**: [`Expression`](Expression.md)

#### Returns

[`PostfixUnaryExpression`](PostfixUnaryExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7854

***

### createPostfixIncrement()

```ts
createPostfixIncrement(operand): PostfixUnaryExpression
```

#### Parameters

• **operand**: [`Expression`](Expression.md)

#### Returns

[`PostfixUnaryExpression`](PostfixUnaryExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7853

***

### createPostfixUnaryExpression()

```ts
createPostfixUnaryExpression(operand, operator): PostfixUnaryExpression
```

#### Parameters

• **operand**: [`Expression`](Expression.md)

• **operator**: [`PostfixUnaryOperator`](../type-aliases/PostfixUnaryOperator.md)

#### Returns

[`PostfixUnaryExpression`](PostfixUnaryExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7558

***

### createPrefixDecrement()

```ts
createPrefixDecrement(operand): PrefixUnaryExpression
```

#### Parameters

• **operand**: [`Expression`](Expression.md)

#### Returns

[`PrefixUnaryExpression`](PrefixUnaryExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7850

***

### createPrefixIncrement()

```ts
createPrefixIncrement(operand): PrefixUnaryExpression
```

#### Parameters

• **operand**: [`Expression`](Expression.md)

#### Returns

[`PrefixUnaryExpression`](PrefixUnaryExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7849

***

### createPrefixMinus()

```ts
createPrefixMinus(operand): PrefixUnaryExpression
```

#### Parameters

• **operand**: [`Expression`](Expression.md)

#### Returns

[`PrefixUnaryExpression`](PrefixUnaryExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7848

***

### createPrefixPlus()

```ts
createPrefixPlus(operand): PrefixUnaryExpression
```

#### Parameters

• **operand**: [`Expression`](Expression.md)

#### Returns

[`PrefixUnaryExpression`](PrefixUnaryExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7847

***

### createPrefixUnaryExpression()

```ts
createPrefixUnaryExpression(operator, operand): PrefixUnaryExpression
```

#### Parameters

• **operator**: [`PrefixUnaryOperator`](../type-aliases/PrefixUnaryOperator.md)

• **operand**: [`Expression`](Expression.md)

#### Returns

[`PrefixUnaryExpression`](PrefixUnaryExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7556

***

### createPrivateIdentifier()

```ts
createPrivateIdentifier(text): PrivateIdentifier
```

#### Parameters

• **text**: `string`

#### Returns

[`PrivateIdentifier`](PrivateIdentifier.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7413

***

### createPropertyAccessChain()

```ts
createPropertyAccessChain(
   expression, 
   questionDotToken, 
   name): PropertyAccessChain
```

#### Parameters

• **expression**: [`Expression`](Expression.md)

• **questionDotToken**: `undefined` \| [`QuestionDotToken`](../type-aliases/QuestionDotToken.md)

• **name**: `string` \| [`MemberName`](../type-aliases/MemberName.md)

#### Returns

[`PropertyAccessChain`](PropertyAccessChain.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7526

***

### createPropertyAccessExpression()

```ts
createPropertyAccessExpression(expression, name): PropertyAccessExpression
```

#### Parameters

• **expression**: [`Expression`](Expression.md)

• **name**: `string` \| [`MemberName`](../type-aliases/MemberName.md)

#### Returns

[`PropertyAccessExpression`](PropertyAccessExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7524

***

### createPropertyAssignment()

```ts
createPropertyAssignment(name, initializer): PropertyAssignment
```

#### Parameters

• **name**: `string` \| [`PropertyName`](../type-aliases/PropertyName.md)

• **initializer**: [`Expression`](Expression.md)

#### Returns

[`PropertyAssignment`](PropertyAssignment.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7805

***

### createPropertyDeclaration()

```ts
createPropertyDeclaration(
   modifiers, 
   name, 
   questionOrExclamationToken, 
   type, 
   initializer): PropertyDeclaration
```

#### Parameters

• **modifiers**: `undefined` \| readonly [`ModifierLike`](../type-aliases/ModifierLike.md)[]

• **name**: `string` \| [`PropertyName`](../type-aliases/PropertyName.md)

• **questionOrExclamationToken**: `undefined` \| [`QuestionToken`](../type-aliases/QuestionToken.md) \| [`ExclamationToken`](../type-aliases/ExclamationToken.md)

• **type**: `undefined` \| [`TypeNode`](TypeNode.md)

• **initializer**: `undefined` \| [`Expression`](Expression.md)

#### Returns

[`PropertyDeclaration`](PropertyDeclaration.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7446

***

### createPropertySignature()

```ts
createPropertySignature(
   modifiers, 
   name, 
   questionToken, 
   type): PropertySignature
```

#### Parameters

• **modifiers**: `undefined` \| readonly [`Modifier`](../type-aliases/Modifier.md)[]

• **name**: `string` \| [`PropertyName`](../type-aliases/PropertyName.md)

• **questionToken**: `undefined` \| [`QuestionToken`](../type-aliases/QuestionToken.md)

• **type**: `undefined` \| [`TypeNode`](TypeNode.md)

#### Returns

[`PropertySignature`](PropertySignature.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7444

***

### createQualifiedName()

```ts
createQualifiedName(left, right): QualifiedName
```

#### Parameters

• **left**: [`EntityName`](../type-aliases/EntityName.md)

• **right**: `string` \| [`Identifier`](Identifier.md)

#### Returns

[`QualifiedName`](QualifiedName.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7434

***

### createRegularExpressionLiteral()

```ts
createRegularExpressionLiteral(text): RegularExpressionLiteral
```

#### Parameters

• **text**: `string`

#### Returns

[`RegularExpressionLiteral`](RegularExpressionLiteral.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7390

***

### createRestTypeNode()

```ts
createRestTypeNode(type): RestTypeNode
```

#### Parameters

• **type**: [`TypeNode`](TypeNode.md)

#### Returns

[`RestTypeNode`](RestTypeNode.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7489

***

### createReturnStatement()

```ts
createReturnStatement(expression?): ReturnStatement
```

#### Parameters

• **expression?**: [`Expression`](Expression.md)

#### Returns

[`ReturnStatement`](ReturnStatement.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7620

***

### createRightShift()

```ts
createRightShift(left, right): BinaryExpression
```

#### Parameters

• **left**: [`Expression`](Expression.md)

• **right**: [`Expression`](Expression.md)

#### Returns

[`BinaryExpression`](BinaryExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7839

***

### createSatisfiesExpression()

```ts
createSatisfiesExpression(expression, type): SatisfiesExpression
```

#### Parameters

• **expression**: [`Expression`](Expression.md)

• **type**: [`TypeNode`](TypeNode.md)

#### Returns

[`SatisfiesExpression`](SatisfiesExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7592

***

### createSemicolonClassElement()

```ts
createSemicolonClassElement(): SemicolonClassElement
```

#### Returns

[`SemicolonClassElement`](SemicolonClassElement.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7596

***

### createSetAccessorDeclaration()

```ts
createSetAccessorDeclaration(
   modifiers, 
   name, 
   parameters, 
   body): SetAccessorDeclaration
```

#### Parameters

• **modifiers**: `undefined` \| readonly [`ModifierLike`](../type-aliases/ModifierLike.md)[]

• **name**: `string` \| [`PropertyName`](../type-aliases/PropertyName.md)

• **parameters**: readonly [`ParameterDeclaration`](ParameterDeclaration.md)[]

• **body**: `undefined` \| [`Block`](Block.md)

#### Returns

[`SetAccessorDeclaration`](SetAccessorDeclaration.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7456

***

### createShorthandPropertyAssignment()

```ts
createShorthandPropertyAssignment(name, objectAssignmentInitializer?): ShorthandPropertyAssignment
```

#### Parameters

• **name**: `string` \| [`Identifier`](Identifier.md)

• **objectAssignmentInitializer?**: [`Expression`](Expression.md)

#### Returns

[`ShorthandPropertyAssignment`](ShorthandPropertyAssignment.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7807

***

### createSourceFile()

```ts
createSourceFile(
   statements, 
   endOfFileToken, 
   flags): SourceFile
```

#### Parameters

• **statements**: readonly [`Statement`](Statement.md)[]

• **endOfFileToken**: [`EndOfFileToken`](../type-aliases/EndOfFileToken.md)

• **flags**: [`NodeFlags`](../enumerations/NodeFlags.md)

#### Returns

[`SourceFile`](SourceFile.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7813

***

### createSpreadAssignment()

```ts
createSpreadAssignment(expression): SpreadAssignment
```

#### Parameters

• **expression**: [`Expression`](Expression.md)

#### Returns

[`SpreadAssignment`](SpreadAssignment.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7809

***

### createSpreadElement()

```ts
createSpreadElement(expression): SpreadElement
```

#### Parameters

• **expression**: [`Expression`](Expression.md)

#### Returns

[`SpreadElement`](SpreadElement.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7577

***

### createStrictEquality()

```ts
createStrictEquality(left, right): BinaryExpression
```

#### Parameters

• **left**: [`Expression`](Expression.md)

• **right**: [`Expression`](Expression.md)

#### Returns

[`BinaryExpression`](BinaryExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7830

***

### createStrictInequality()

```ts
createStrictInequality(left, right): BinaryExpression
```

#### Parameters

• **left**: [`Expression`](Expression.md)

• **right**: [`Expression`](Expression.md)

#### Returns

[`BinaryExpression`](BinaryExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7831

***

### createStringLiteral()

```ts
createStringLiteral(text, isSingleQuote?): StringLiteral
```

#### Parameters

• **text**: `string`

• **isSingleQuote?**: `boolean`

#### Returns

[`StringLiteral`](StringLiteral.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7388

***

### createStringLiteralFromNode()

```ts
createStringLiteralFromNode(sourceNode, isSingleQuote?): StringLiteral
```

#### Parameters

• **sourceNode**: [`PrivateIdentifier`](PrivateIdentifier.md) \| [`PropertyNameLiteral`](../type-aliases/PropertyNameLiteral.md)

• **isSingleQuote?**: `boolean`

#### Returns

[`StringLiteral`](StringLiteral.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7389

***

### createSubtract()

```ts
createSubtract(left, right): BinaryExpression
```

#### Parameters

• **left**: [`Expression`](Expression.md)

• **right**: [`Expression`](Expression.md)

#### Returns

[`BinaryExpression`](BinaryExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7842

***

### createSuper()

```ts
createSuper(): SuperExpression
```

#### Returns

[`SuperExpression`](SuperExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7427

***

### createSwitchStatement()

```ts
createSwitchStatement(expression, caseBlock): SwitchStatement
```

#### Parameters

• **expression**: [`Expression`](Expression.md)

• **caseBlock**: [`CaseBlock`](CaseBlock.md)

#### Returns

[`SwitchStatement`](SwitchStatement.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7624

***

### createTaggedTemplateExpression()

```ts
createTaggedTemplateExpression(
   tag, 
   typeArguments, 
   template): TaggedTemplateExpression
```

#### Parameters

• **tag**: [`Expression`](Expression.md)

• **typeArguments**: `undefined` \| readonly [`TypeNode`](TypeNode.md)[]

• **template**: [`TemplateLiteral`](../type-aliases/TemplateLiteral.md)

#### Returns

[`TaggedTemplateExpression`](TaggedTemplateExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7538

***

### createTemplateExpression()

```ts
createTemplateExpression(head, templateSpans): TemplateExpression
```

#### Parameters

• **head**: [`TemplateHead`](TemplateHead.md)

• **templateSpans**: readonly [`TemplateSpan`](TemplateSpan.md)[]

#### Returns

[`TemplateExpression`](TemplateExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7564

***

### createTemplateHead()

#### createTemplateHead(text, rawText, templateFlags)

```ts
createTemplateHead(
   text, 
   rawText?, 
   templateFlags?): TemplateHead
```

##### Parameters

• **text**: `string`

• **rawText?**: `string`

• **templateFlags?**: [`TokenFlags`](../enumerations/TokenFlags.md)

##### Returns

[`TemplateHead`](TemplateHead.md)

##### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7566

#### createTemplateHead(text, rawText, templateFlags)

```ts
createTemplateHead(
   text, 
   rawText, 
   templateFlags?): TemplateHead
```

##### Parameters

• **text**: `undefined` \| `string`

• **rawText**: `string`

• **templateFlags?**: [`TokenFlags`](../enumerations/TokenFlags.md)

##### Returns

[`TemplateHead`](TemplateHead.md)

##### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7567

***

### createTemplateLiteralType()

```ts
createTemplateLiteralType(head, templateSpans): TemplateLiteralTypeNode
```

#### Parameters

• **head**: [`TemplateHead`](TemplateHead.md)

• **templateSpans**: readonly [`TemplateLiteralTypeSpan`](TemplateLiteralTypeSpan.md)[]

#### Returns

[`TemplateLiteralTypeNode`](TemplateLiteralTypeNode.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7512

***

### createTemplateLiteralTypeSpan()

```ts
createTemplateLiteralTypeSpan(type, literal): TemplateLiteralTypeSpan
```

#### Parameters

• **type**: [`TypeNode`](TypeNode.md)

• **literal**: [`TemplateMiddle`](TemplateMiddle.md) \| [`TemplateTail`](TemplateTail.md)

#### Returns

[`TemplateLiteralTypeSpan`](TemplateLiteralTypeSpan.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7464

***

### createTemplateMiddle()

#### createTemplateMiddle(text, rawText, templateFlags)

```ts
createTemplateMiddle(
   text, 
   rawText?, 
   templateFlags?): TemplateMiddle
```

##### Parameters

• **text**: `string`

• **rawText?**: `string`

• **templateFlags?**: [`TokenFlags`](../enumerations/TokenFlags.md)

##### Returns

[`TemplateMiddle`](TemplateMiddle.md)

##### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7568

#### createTemplateMiddle(text, rawText, templateFlags)

```ts
createTemplateMiddle(
   text, 
   rawText, 
   templateFlags?): TemplateMiddle
```

##### Parameters

• **text**: `undefined` \| `string`

• **rawText**: `string`

• **templateFlags?**: [`TokenFlags`](../enumerations/TokenFlags.md)

##### Returns

[`TemplateMiddle`](TemplateMiddle.md)

##### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7569

***

### createTemplateSpan()

```ts
createTemplateSpan(expression, literal): TemplateSpan
```

#### Parameters

• **expression**: [`Expression`](Expression.md)

• **literal**: [`TemplateMiddle`](TemplateMiddle.md) \| [`TemplateTail`](TemplateTail.md)

#### Returns

[`TemplateSpan`](TemplateSpan.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7594

***

### createTemplateTail()

#### createTemplateTail(text, rawText, templateFlags)

```ts
createTemplateTail(
   text, 
   rawText?, 
   templateFlags?): TemplateTail
```

##### Parameters

• **text**: `string`

• **rawText?**: `string`

• **templateFlags?**: [`TokenFlags`](../enumerations/TokenFlags.md)

##### Returns

[`TemplateTail`](TemplateTail.md)

##### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7570

#### createTemplateTail(text, rawText, templateFlags)

```ts
createTemplateTail(
   text, 
   rawText, 
   templateFlags?): TemplateTail
```

##### Parameters

• **text**: `undefined` \| `string`

• **rawText**: `string`

• **templateFlags?**: [`TokenFlags`](../enumerations/TokenFlags.md)

##### Returns

[`TemplateTail`](TemplateTail.md)

##### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7571

***

### createTempVariable()

```ts
createTempVariable(recordTempVariable, reservedInNestedScopes?): Identifier
```

Create a unique temporary variable.

#### Parameters

• **recordTempVariable**: `undefined` \| (`node`) => `void`

An optional callback used to record the temporary variable name. This
should usually be a reference to `hoistVariableDeclaration` from a `TransformationContext`, but
can be `undefined` if you plan to record the temporary variable manually.

• **reservedInNestedScopes?**: `boolean`

When `true`, reserves the temporary variable name in all nested scopes
during emit so that the variable can be referenced in a nested function body. This is an alternative to
setting `EmitFlags.ReuseTempVariableScope` on the nested function itself.

#### Returns

[`Identifier`](Identifier.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7401

***

### createThis()

```ts
createThis(): ThisExpression
```

#### Returns

[`ThisExpression`](ThisExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7428

***

### createThisTypeNode()

```ts
createThisTypeNode(): ThisTypeNode
```

#### Returns

[`ThisTypeNode`](ThisTypeNode.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7503

***

### createThrowStatement()

```ts
createThrowStatement(expression): ThrowStatement
```

#### Parameters

• **expression**: [`Expression`](Expression.md)

#### Returns

[`ThrowStatement`](ThrowStatement.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7628

***

### createToken()

#### createToken(token)

```ts
createToken(token): SuperExpression
```

##### Parameters

• **token**: [`SuperKeyword`](../enumerations/SyntaxKind.md#superkeyword)

##### Returns

[`SuperExpression`](SuperExpression.md)

##### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7416

#### createToken(token)

```ts
createToken(token): ThisExpression
```

##### Parameters

• **token**: [`ThisKeyword`](../enumerations/SyntaxKind.md#thiskeyword)

##### Returns

[`ThisExpression`](ThisExpression.md)

##### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7417

#### createToken(token)

```ts
createToken(token): NullLiteral
```

##### Parameters

• **token**: [`NullKeyword`](../enumerations/SyntaxKind.md#nullkeyword)

##### Returns

[`NullLiteral`](NullLiteral.md)

##### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7418

#### createToken(token)

```ts
createToken(token): TrueLiteral
```

##### Parameters

• **token**: [`TrueKeyword`](../enumerations/SyntaxKind.md#truekeyword)

##### Returns

[`TrueLiteral`](TrueLiteral.md)

##### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7419

#### createToken(token)

```ts
createToken(token): FalseLiteral
```

##### Parameters

• **token**: [`FalseKeyword`](../enumerations/SyntaxKind.md#falsekeyword)

##### Returns

[`FalseLiteral`](FalseLiteral.md)

##### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7420

#### createToken(token)

```ts
createToken(token): EndOfFileToken
```

##### Parameters

• **token**: [`EndOfFileToken`](../enumerations/SyntaxKind.md#endoffiletoken)

##### Returns

[`EndOfFileToken`](../type-aliases/EndOfFileToken.md)

##### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7421

#### createToken(token)

```ts
createToken(token): Token<Unknown>
```

##### Parameters

• **token**: [`Unknown`](../enumerations/SyntaxKind.md#unknown)

##### Returns

[`Token`](Token.md)\<[`Unknown`](../enumerations/SyntaxKind.md#unknown)\>

##### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7422

#### createToken(token)

```ts
createToken<TKind>(token): PunctuationToken<TKind>
```

##### Type Parameters

• **TKind** *extends* [`PunctuationSyntaxKind`](../type-aliases/PunctuationSyntaxKind.md)

##### Parameters

• **token**: `TKind`

##### Returns

[`PunctuationToken`](PunctuationToken.md)\<`TKind`\>

##### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7423

#### createToken(token)

```ts
createToken<TKind>(token): KeywordTypeNode<TKind>
```

##### Type Parameters

• **TKind** *extends* [`KeywordTypeSyntaxKind`](../type-aliases/KeywordTypeSyntaxKind.md)

##### Parameters

• **token**: `TKind`

##### Returns

[`KeywordTypeNode`](KeywordTypeNode.md)\<`TKind`\>

##### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7424

#### createToken(token)

```ts
createToken<TKind>(token): ModifierToken<TKind>
```

##### Type Parameters

• **TKind** *extends* [`ModifierSyntaxKind`](../type-aliases/ModifierSyntaxKind.md)

##### Parameters

• **token**: `TKind`

##### Returns

[`ModifierToken`](ModifierToken.md)\<`TKind`\>

##### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7425

#### createToken(token)

```ts
createToken<TKind>(token): KeywordToken<TKind>
```

##### Type Parameters

• **TKind** *extends* [`KeywordSyntaxKind`](../type-aliases/KeywordSyntaxKind.md)

##### Parameters

• **token**: `TKind`

##### Returns

[`KeywordToken`](KeywordToken.md)\<`TKind`\>

##### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7426

***

### createTrue()

```ts
createTrue(): TrueLiteral
```

#### Returns

[`TrueLiteral`](TrueLiteral.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7430

***

### createTryStatement()

```ts
createTryStatement(
   tryBlock, 
   catchClause, 
   finallyBlock): TryStatement
```

#### Parameters

• **tryBlock**: [`Block`](Block.md)

• **catchClause**: `undefined` \| [`CatchClause`](CatchClause.md)

• **finallyBlock**: `undefined` \| [`Block`](Block.md)

#### Returns

[`TryStatement`](TryStatement.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7630

***

### createTupleTypeNode()

```ts
createTupleTypeNode(elements): TupleTypeNode
```

#### Parameters

• **elements**: readonly ([`TypeNode`](TypeNode.md) \| [`NamedTupleMember`](NamedTupleMember.md))[]

#### Returns

[`TupleTypeNode`](TupleTypeNode.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7483

***

### createTypeAliasDeclaration()

```ts
createTypeAliasDeclaration(
   modifiers, 
   name, 
   typeParameters, 
   type): TypeAliasDeclaration
```

#### Parameters

• **modifiers**: `undefined` \| readonly [`ModifierLike`](../type-aliases/ModifierLike.md)[]

• **name**: `string` \| [`Identifier`](Identifier.md)

• **typeParameters**: `undefined` \| readonly [`TypeParameterDeclaration`](TypeParameterDeclaration.md)[]

• **type**: [`TypeNode`](TypeNode.md)

#### Returns

[`TypeAliasDeclaration`](TypeAliasDeclaration.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7643

***

### createTypeAssertion()

```ts
createTypeAssertion(type, expression): TypeAssertion
```

#### Parameters

• **type**: [`TypeNode`](TypeNode.md)

• **expression**: [`Expression`](Expression.md)

#### Returns

[`TypeAssertion`](TypeAssertion.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7540

***

### createTypeLiteralNode()

```ts
createTypeLiteralNode(members): TypeLiteralNode
```

#### Parameters

• **members**: `undefined` \| readonly [`TypeElement`](TypeElement.md)[]

#### Returns

[`TypeLiteralNode`](TypeLiteralNode.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7479

***

### createTypeOfExpression()

```ts
createTypeOfExpression(expression): TypeOfExpression
```

#### Parameters

• **expression**: [`Expression`](Expression.md)

#### Returns

[`TypeOfExpression`](TypeOfExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7550

***

### createTypeOperatorNode()

```ts
createTypeOperatorNode(operator, type): TypeOperatorNode
```

#### Parameters

• **operator**: [`KeyOfKeyword`](../enumerations/SyntaxKind.md#keyofkeyword) \| [`ReadonlyKeyword`](../enumerations/SyntaxKind.md#readonlykeyword) \| [`UniqueKeyword`](../enumerations/SyntaxKind.md#uniquekeyword)

• **type**: [`TypeNode`](TypeNode.md)

#### Returns

[`TypeOperatorNode`](TypeOperatorNode.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7504

***

### createTypeParameterDeclaration()

```ts
createTypeParameterDeclaration(
   modifiers, 
   name, 
   constraint?, 
   defaultType?): TypeParameterDeclaration
```

#### Parameters

• **modifiers**: `undefined` \| readonly [`Modifier`](../type-aliases/Modifier.md)[]

• **name**: `string` \| [`Identifier`](Identifier.md)

• **constraint?**: [`TypeNode`](TypeNode.md)

• **defaultType?**: [`TypeNode`](TypeNode.md)

#### Returns

[`TypeParameterDeclaration`](TypeParameterDeclaration.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7438

***

### createTypePredicateNode()

```ts
createTypePredicateNode(
   assertsModifier, 
   parameterName, 
   type): TypePredicateNode
```

#### Parameters

• **assertsModifier**: `undefined` \| [`AssertsKeyword`](../type-aliases/AssertsKeyword.md)

• **parameterName**: `string` \| [`Identifier`](Identifier.md) \| [`ThisTypeNode`](ThisTypeNode.md)

• **type**: `undefined` \| [`TypeNode`](TypeNode.md)

#### Returns

[`TypePredicateNode`](TypePredicateNode.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7469

***

### createTypeQueryNode()

```ts
createTypeQueryNode(exprName, typeArguments?): TypeQueryNode
```

#### Parameters

• **exprName**: [`EntityName`](../type-aliases/EntityName.md)

• **typeArguments?**: readonly [`TypeNode`](TypeNode.md)[]

#### Returns

[`TypeQueryNode`](TypeQueryNode.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7477

***

### createTypeReferenceNode()

```ts
createTypeReferenceNode(typeName, typeArguments?): TypeReferenceNode
```

#### Parameters

• **typeName**: `string` \| [`EntityName`](../type-aliases/EntityName.md)

• **typeArguments?**: readonly [`TypeNode`](TypeNode.md)[]

#### Returns

[`TypeReferenceNode`](TypeReferenceNode.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7471

***

### createUnionTypeNode()

```ts
createUnionTypeNode(types): UnionTypeNode
```

#### Parameters

• **types**: readonly [`TypeNode`](TypeNode.md)[]

#### Returns

[`UnionTypeNode`](UnionTypeNode.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7491

***

### createUniqueName()

```ts
createUniqueName(text, flags?): Identifier
```

Create a unique name based on the supplied text.

#### Parameters

• **text**: `string`

• **flags?**: [`GeneratedIdentifierFlags`](../enumerations/GeneratedIdentifierFlags.md)

#### Returns

[`Identifier`](Identifier.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7410

***

### createUniquePrivateName()

```ts
createUniquePrivateName(text?): PrivateIdentifier
```

#### Parameters

• **text?**: `string`

#### Returns

[`PrivateIdentifier`](PrivateIdentifier.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7414

***

### createUnsignedRightShift()

```ts
createUnsignedRightShift(left, right): BinaryExpression
```

#### Parameters

• **left**: [`Expression`](Expression.md)

• **right**: [`Expression`](Expression.md)

#### Returns

[`BinaryExpression`](BinaryExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7840

***

### createVariableDeclaration()

```ts
createVariableDeclaration(
   name, 
   exclamationToken?, 
   type?, 
   initializer?): VariableDeclaration
```

#### Parameters

• **name**: `string` \| [`BindingName`](../type-aliases/BindingName.md)

• **exclamationToken?**: [`ExclamationToken`](../type-aliases/ExclamationToken.md)

• **type?**: [`TypeNode`](TypeNode.md)

• **initializer?**: [`Expression`](Expression.md)

#### Returns

[`VariableDeclaration`](VariableDeclaration.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7633

***

### createVariableDeclarationList()

```ts
createVariableDeclarationList(declarations, flags?): VariableDeclarationList
```

#### Parameters

• **declarations**: readonly [`VariableDeclaration`](VariableDeclaration.md)[]

• **flags?**: [`NodeFlags`](../enumerations/NodeFlags.md)

#### Returns

[`VariableDeclarationList`](VariableDeclarationList.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7635

***

### createVariableStatement()

```ts
createVariableStatement(modifiers, declarationList): VariableStatement
```

#### Parameters

• **modifiers**: `undefined` \| readonly [`ModifierLike`](../type-aliases/ModifierLike.md)[]

• **declarationList**: [`VariableDeclarationList`](VariableDeclarationList.md) \| readonly [`VariableDeclaration`](VariableDeclaration.md)[]

#### Returns

[`VariableStatement`](VariableStatement.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7599

***

### createVoidExpression()

```ts
createVoidExpression(expression): VoidExpression
```

#### Parameters

• **expression**: [`Expression`](Expression.md)

#### Returns

[`VoidExpression`](VoidExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7552

***

### createVoidZero()

```ts
createVoidZero(): VoidExpression
```

#### Returns

[`VoidExpression`](VoidExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7859

***

### createWhileStatement()

```ts
createWhileStatement(expression, statement): WhileStatement
```

#### Parameters

• **expression**: [`Expression`](Expression.md)

• **statement**: [`Statement`](Statement.md)

#### Returns

[`WhileStatement`](WhileStatement.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7608

***

### createWithStatement()

```ts
createWithStatement(expression, statement): WithStatement
```

#### Parameters

• **expression**: [`Expression`](Expression.md)

• **statement**: [`Statement`](Statement.md)

#### Returns

[`WithStatement`](WithStatement.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7622

***

### createYieldExpression()

#### createYieldExpression(asteriskToken, expression)

```ts
createYieldExpression(asteriskToken, expression): YieldExpression
```

##### Parameters

• **asteriskToken**: [`AsteriskToken`](../type-aliases/AsteriskToken.md)

• **expression**: [`Expression`](Expression.md)

##### Returns

[`YieldExpression`](YieldExpression.md)

##### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7574

#### createYieldExpression(asteriskToken, expression)

```ts
createYieldExpression(asteriskToken, expression): YieldExpression
```

##### Parameters

• **asteriskToken**: `undefined`

• **expression**: `undefined` \| [`Expression`](Expression.md)

##### Returns

[`YieldExpression`](YieldExpression.md)

##### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7575

***

### getGeneratedNameForNode()

```ts
getGeneratedNameForNode(node, flags?): Identifier
```

Create a unique name generated for a node.

#### Parameters

• **node**: `undefined` \| [`Node`](Node.md)

• **flags?**: [`GeneratedIdentifierFlags`](../enumerations/GeneratedIdentifierFlags.md)

#### Returns

[`Identifier`](Identifier.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7412

***

### getGeneratedPrivateNameForNode()

```ts
getGeneratedPrivateNameForNode(node): PrivateIdentifier
```

#### Parameters

• **node**: [`Node`](Node.md)

#### Returns

[`PrivateIdentifier`](PrivateIdentifier.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7415

***

### replaceDecoratorsAndModifiers()

```ts
replaceDecoratorsAndModifiers<T>(node, modifiers): T
```

Updates a node that may contain decorators or modifiers, replacing only the decorators and modifiers of the node.

#### Type Parameters

• **T** *extends* [`HasModifiers`](../type-aliases/HasModifiers.md) & [`HasDecorators`](../type-aliases/HasDecorators.md)

#### Parameters

• **node**: `T`

• **modifiers**: `undefined` \| readonly [`ModifierLike`](../type-aliases/ModifierLike.md)[]

#### Returns

`T`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7870

***

### replaceModifiers()

```ts
replaceModifiers<T>(node, modifiers): T
```

Updates a node that may contain modifiers, replacing only the modifiers of the node.

#### Type Parameters

• **T** *extends* [`HasModifiers`](../type-aliases/HasModifiers.md)

#### Parameters

• **node**: `T`

• **modifiers**: `undefined` \| readonly [`Modifier`](../type-aliases/Modifier.md)[] \| [`ModifierFlags`](../enumerations/ModifierFlags.md)

#### Returns

`T`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7866

***

### replacePropertyName()

```ts
replacePropertyName<T>(node, name): T
```

Updates a node that contains a property name, replacing only the name of the node.

#### Type Parameters

• **T** *extends* 
  \| [`PropertySignature`](PropertySignature.md)
  \| [`PropertyAssignment`](PropertyAssignment.md)
  \| [`MethodDeclaration`](MethodDeclaration.md)
  \| [`AccessorDeclaration`](../type-aliases/AccessorDeclaration.md)
  \| [`MethodSignature`](MethodSignature.md)
  \| [`PropertyDeclaration`](PropertyDeclaration.md)

#### Parameters

• **node**: `T`

• **name**: `T`\[`"name"`\]

#### Returns

`T`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7874

***

### restoreOuterExpressions()

```ts
restoreOuterExpressions(
   outerExpression, 
   innerExpression, 
   kinds?): Expression
```

#### Parameters

• **outerExpression**: `undefined` \| [`Expression`](Expression.md)

• **innerExpression**: [`Expression`](Expression.md)

• **kinds?**: [`OuterExpressionKinds`](../enumerations/OuterExpressionKinds.md)

#### Returns

[`Expression`](Expression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7862

***

### updateArrayBindingPattern()

```ts
updateArrayBindingPattern(node, elements): ArrayBindingPattern
```

#### Parameters

• **node**: [`ArrayBindingPattern`](ArrayBindingPattern.md)

• **elements**: readonly [`ArrayBindingElement`](../type-aliases/ArrayBindingElement.md)[]

#### Returns

[`ArrayBindingPattern`](ArrayBindingPattern.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7517

***

### updateArrayLiteralExpression()

```ts
updateArrayLiteralExpression(node, elements): ArrayLiteralExpression
```

#### Parameters

• **node**: [`ArrayLiteralExpression`](ArrayLiteralExpression.md)

• **elements**: readonly [`Expression`](Expression.md)[]

#### Returns

[`ArrayLiteralExpression`](ArrayLiteralExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7521

***

### updateArrayTypeNode()

```ts
updateArrayTypeNode(node, elementType): ArrayTypeNode
```

#### Parameters

• **node**: [`ArrayTypeNode`](ArrayTypeNode.md)

• **elementType**: [`TypeNode`](TypeNode.md)

#### Returns

[`ArrayTypeNode`](ArrayTypeNode.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7482

***

### updateArrowFunction()

```ts
updateArrowFunction(
   node, 
   modifiers, 
   typeParameters, 
   parameters, 
   type, 
   equalsGreaterThanToken, 
   body): ArrowFunction
```

#### Parameters

• **node**: [`ArrowFunction`](ArrowFunction.md)

• **modifiers**: `undefined` \| readonly [`Modifier`](../type-aliases/Modifier.md)[]

• **typeParameters**: `undefined` \| readonly [`TypeParameterDeclaration`](TypeParameterDeclaration.md)[]

• **parameters**: readonly [`ParameterDeclaration`](ParameterDeclaration.md)[]

• **type**: `undefined` \| [`TypeNode`](TypeNode.md)

• **equalsGreaterThanToken**: [`EqualsGreaterThanToken`](../type-aliases/EqualsGreaterThanToken.md)

• **body**: [`ConciseBody`](../type-aliases/ConciseBody.md)

#### Returns

[`ArrowFunction`](ArrowFunction.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7547

***

### updateAsExpression()

```ts
updateAsExpression(
   node, 
   expression, 
   type): AsExpression
```

#### Parameters

• **node**: [`AsExpression`](AsExpression.md)

• **expression**: [`Expression`](Expression.md)

• **type**: [`TypeNode`](TypeNode.md)

#### Returns

[`AsExpression`](AsExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7585

***

### ~~updateAssertClause()~~

```ts
updateAssertClause(
   node, 
   elements, 
   multiLine?): AssertClause
```

#### Parameters

• **node**: [`AssertClause`](AssertClause.md)

• **elements**: [`NodeArray`](NodeArray.md)\<[`AssertEntry`](AssertEntry.md)\>

• **multiLine?**: `boolean`

#### Returns

[`AssertClause`](AssertClause.md)

#### Deprecated

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7662

***

### ~~updateAssertEntry()~~

```ts
updateAssertEntry(
   node, 
   name, 
   value): AssertEntry
```

#### Parameters

• **node**: [`AssertEntry`](AssertEntry.md)

• **name**: [`ImportAttributeName`](../type-aliases/ImportAttributeName.md)

• **value**: [`Expression`](Expression.md)

#### Returns

[`AssertEntry`](AssertEntry.md)

#### Deprecated

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7664

***

### updateAwaitExpression()

```ts
updateAwaitExpression(node, expression): AwaitExpression
```

#### Parameters

• **node**: [`AwaitExpression`](AwaitExpression.md)

• **expression**: [`Expression`](Expression.md)

#### Returns

[`AwaitExpression`](AwaitExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7555

***

### updateBinaryExpression()

```ts
updateBinaryExpression(
   node, 
   left, 
   operator, 
   right): BinaryExpression
```

#### Parameters

• **node**: [`BinaryExpression`](BinaryExpression.md)

• **left**: [`Expression`](Expression.md)

• **operator**: [`BinaryOperatorToken`](../type-aliases/BinaryOperatorToken.md) \| [`BinaryOperator`](../type-aliases/BinaryOperator.md)

• **right**: [`Expression`](Expression.md)

#### Returns

[`BinaryExpression`](BinaryExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7561

***

### updateBindingElement()

```ts
updateBindingElement(
   node, 
   dotDotDotToken, 
   propertyName, 
   name, 
   initializer): BindingElement
```

#### Parameters

• **node**: [`BindingElement`](BindingElement.md)

• **dotDotDotToken**: `undefined` \| [`DotDotDotToken`](../type-aliases/DotDotDotToken.md)

• **propertyName**: `undefined` \| [`PropertyName`](../type-aliases/PropertyName.md)

• **name**: [`BindingName`](../type-aliases/BindingName.md)

• **initializer**: `undefined` \| [`Expression`](Expression.md)

#### Returns

[`BindingElement`](BindingElement.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7519

***

### updateBlock()

```ts
updateBlock(node, statements): Block
```

#### Parameters

• **node**: [`Block`](Block.md)

• **statements**: readonly [`Statement`](Statement.md)[]

#### Returns

[`Block`](Block.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7598

***

### updateBreakStatement()

```ts
updateBreakStatement(node, label): BreakStatement
```

#### Parameters

• **node**: [`BreakStatement`](BreakStatement.md)

• **label**: `undefined` \| [`Identifier`](Identifier.md)

#### Returns

[`BreakStatement`](BreakStatement.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7619

***

### updateBundle()

```ts
updateBundle(node, sourceFiles): Bundle
```

#### Parameters

• **node**: [`Bundle`](Bundle.md)

• **sourceFiles**: readonly [`SourceFile`](SourceFile.md)[]

#### Returns

[`Bundle`](Bundle.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7821

***

### updateCallChain()

```ts
updateCallChain(
   node, 
   expression, 
   questionDotToken, 
   typeArguments, 
   argumentsArray): CallChain
```

#### Parameters

• **node**: [`CallChain`](CallChain.md)

• **expression**: [`Expression`](Expression.md)

• **questionDotToken**: `undefined` \| [`QuestionDotToken`](../type-aliases/QuestionDotToken.md)

• **typeArguments**: `undefined` \| readonly [`TypeNode`](TypeNode.md)[]

• **argumentsArray**: readonly [`Expression`](Expression.md)[]

#### Returns

[`CallChain`](CallChain.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7535

***

### updateCallExpression()

```ts
updateCallExpression(
   node, 
   expression, 
   typeArguments, 
   argumentsArray): CallExpression
```

#### Parameters

• **node**: [`CallExpression`](CallExpression.md)

• **expression**: [`Expression`](Expression.md)

• **typeArguments**: `undefined` \| readonly [`TypeNode`](TypeNode.md)[]

• **argumentsArray**: readonly [`Expression`](Expression.md)[]

#### Returns

[`CallExpression`](CallExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7533

***

### updateCallSignature()

```ts
updateCallSignature(
   node, 
   typeParameters, 
   parameters, 
   type): CallSignatureDeclaration
```

#### Parameters

• **node**: [`CallSignatureDeclaration`](CallSignatureDeclaration.md)

• **typeParameters**: `undefined` \| [`NodeArray`](NodeArray.md)\<[`TypeParameterDeclaration`](TypeParameterDeclaration.md)\>

• **parameters**: [`NodeArray`](NodeArray.md)\<[`ParameterDeclaration`](ParameterDeclaration.md)\>

• **type**: `undefined` \| [`TypeNode`](TypeNode.md)

#### Returns

[`CallSignatureDeclaration`](CallSignatureDeclaration.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7459

***

### updateCaseBlock()

```ts
updateCaseBlock(node, clauses): CaseBlock
```

#### Parameters

• **node**: [`CaseBlock`](CaseBlock.md)

• **clauses**: readonly [`CaseOrDefaultClause`](../type-aliases/CaseOrDefaultClause.md)[]

#### Returns

[`CaseBlock`](CaseBlock.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7652

***

### updateCaseClause()

```ts
updateCaseClause(
   node, 
   expression, 
   statements): CaseClause
```

#### Parameters

• **node**: [`CaseClause`](CaseClause.md)

• **expression**: [`Expression`](Expression.md)

• **statements**: readonly [`Statement`](Statement.md)[]

#### Returns

[`CaseClause`](CaseClause.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7798

***

### updateCatchClause()

```ts
updateCatchClause(
   node, 
   variableDeclaration, 
   block): CatchClause
```

#### Parameters

• **node**: [`CatchClause`](CatchClause.md)

• **variableDeclaration**: `undefined` \| [`VariableDeclaration`](VariableDeclaration.md)

• **block**: [`Block`](Block.md)

#### Returns

[`CatchClause`](CatchClause.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7804

***

### updateClassDeclaration()

```ts
updateClassDeclaration(
   node, 
   modifiers, 
   name, 
   typeParameters, 
   heritageClauses, 
   members): ClassDeclaration
```

#### Parameters

• **node**: [`ClassDeclaration`](ClassDeclaration.md)

• **modifiers**: `undefined` \| readonly [`ModifierLike`](../type-aliases/ModifierLike.md)[]

• **name**: `undefined` \| [`Identifier`](Identifier.md)

• **typeParameters**: `undefined` \| readonly [`TypeParameterDeclaration`](TypeParameterDeclaration.md)[]

• **heritageClauses**: `undefined` \| readonly [`HeritageClause`](HeritageClause.md)[]

• **members**: readonly [`ClassElement`](ClassElement.md)[]

#### Returns

[`ClassDeclaration`](ClassDeclaration.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7640

***

### updateClassExpression()

```ts
updateClassExpression(
   node, 
   modifiers, 
   name, 
   typeParameters, 
   heritageClauses, 
   members): ClassExpression
```

#### Parameters

• **node**: [`ClassExpression`](ClassExpression.md)

• **modifiers**: `undefined` \| readonly [`ModifierLike`](../type-aliases/ModifierLike.md)[]

• **name**: `undefined` \| [`Identifier`](Identifier.md)

• **typeParameters**: `undefined` \| readonly [`TypeParameterDeclaration`](TypeParameterDeclaration.md)[]

• **heritageClauses**: `undefined` \| readonly [`HeritageClause`](HeritageClause.md)[]

• **members**: readonly [`ClassElement`](ClassElement.md)[]

#### Returns

[`ClassExpression`](ClassExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7580

***

### updateClassStaticBlockDeclaration()

```ts
updateClassStaticBlockDeclaration(node, body): ClassStaticBlockDeclaration
```

#### Parameters

• **node**: [`ClassStaticBlockDeclaration`](ClassStaticBlockDeclaration.md)

• **body**: [`Block`](Block.md)

#### Returns

[`ClassStaticBlockDeclaration`](ClassStaticBlockDeclaration.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7467

***

### updateCommaListExpression()

```ts
updateCommaListExpression(node, elements): CommaListExpression
```

#### Parameters

• **node**: [`CommaListExpression`](CommaListExpression.md)

• **elements**: readonly [`Expression`](Expression.md)[]

#### Returns

[`CommaListExpression`](CommaListExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7819

***

### updateComputedPropertyName()

```ts
updateComputedPropertyName(node, expression): ComputedPropertyName
```

#### Parameters

• **node**: [`ComputedPropertyName`](ComputedPropertyName.md)

• **expression**: [`Expression`](Expression.md)

#### Returns

[`ComputedPropertyName`](ComputedPropertyName.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7437

***

### updateConditionalExpression()

```ts
updateConditionalExpression(
   node, 
   condition, 
   questionToken, 
   whenTrue, 
   colonToken, 
   whenFalse): ConditionalExpression
```

#### Parameters

• **node**: [`ConditionalExpression`](ConditionalExpression.md)

• **condition**: [`Expression`](Expression.md)

• **questionToken**: [`QuestionToken`](../type-aliases/QuestionToken.md)

• **whenTrue**: [`Expression`](Expression.md)

• **colonToken**: [`ColonToken`](../type-aliases/ColonToken.md)

• **whenFalse**: [`Expression`](Expression.md)

#### Returns

[`ConditionalExpression`](ConditionalExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7563

***

### updateConditionalTypeNode()

```ts
updateConditionalTypeNode(
   node, 
   checkType, 
   extendsType, 
   trueType, 
   falseType): ConditionalTypeNode
```

#### Parameters

• **node**: [`ConditionalTypeNode`](ConditionalTypeNode.md)

• **checkType**: [`TypeNode`](TypeNode.md)

• **extendsType**: [`TypeNode`](TypeNode.md)

• **trueType**: [`TypeNode`](TypeNode.md)

• **falseType**: [`TypeNode`](TypeNode.md)

#### Returns

[`ConditionalTypeNode`](ConditionalTypeNode.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7496

***

### updateConstructorDeclaration()

```ts
updateConstructorDeclaration(
   node, 
   modifiers, 
   parameters, 
   body): ConstructorDeclaration
```

#### Parameters

• **node**: [`ConstructorDeclaration`](ConstructorDeclaration.md)

• **modifiers**: `undefined` \| readonly [`ModifierLike`](../type-aliases/ModifierLike.md)[]

• **parameters**: readonly [`ParameterDeclaration`](ParameterDeclaration.md)[]

• **body**: `undefined` \| [`Block`](Block.md)

#### Returns

[`ConstructorDeclaration`](ConstructorDeclaration.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7453

***

### updateConstructorTypeNode()

```ts
updateConstructorTypeNode(
   node, 
   modifiers, 
   typeParameters, 
   parameters, 
   type): ConstructorTypeNode
```

#### Parameters

• **node**: [`ConstructorTypeNode`](ConstructorTypeNode.md)

• **modifiers**: `undefined` \| readonly [`Modifier`](../type-aliases/Modifier.md)[]

• **typeParameters**: `undefined` \| [`NodeArray`](NodeArray.md)\<[`TypeParameterDeclaration`](TypeParameterDeclaration.md)\>

• **parameters**: [`NodeArray`](NodeArray.md)\<[`ParameterDeclaration`](ParameterDeclaration.md)\>

• **type**: [`TypeNode`](TypeNode.md)

#### Returns

[`ConstructorTypeNode`](ConstructorTypeNode.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7476

***

### updateConstructSignature()

```ts
updateConstructSignature(
   node, 
   typeParameters, 
   parameters, 
   type): ConstructSignatureDeclaration
```

#### Parameters

• **node**: [`ConstructSignatureDeclaration`](ConstructSignatureDeclaration.md)

• **typeParameters**: `undefined` \| [`NodeArray`](NodeArray.md)\<[`TypeParameterDeclaration`](TypeParameterDeclaration.md)\>

• **parameters**: [`NodeArray`](NodeArray.md)\<[`ParameterDeclaration`](ParameterDeclaration.md)\>

• **type**: `undefined` \| [`TypeNode`](TypeNode.md)

#### Returns

[`ConstructSignatureDeclaration`](ConstructSignatureDeclaration.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7461

***

### updateContinueStatement()

```ts
updateContinueStatement(node, label): ContinueStatement
```

#### Parameters

• **node**: [`ContinueStatement`](ContinueStatement.md)

• **label**: `undefined` \| [`Identifier`](Identifier.md)

#### Returns

[`ContinueStatement`](ContinueStatement.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7617

***

### updateDecorator()

```ts
updateDecorator(node, expression): Decorator
```

#### Parameters

• **node**: [`Decorator`](Decorator.md)

• **expression**: [`Expression`](Expression.md)

#### Returns

[`Decorator`](Decorator.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7443

***

### updateDefaultClause()

```ts
updateDefaultClause(node, statements): DefaultClause
```

#### Parameters

• **node**: [`DefaultClause`](DefaultClause.md)

• **statements**: readonly [`Statement`](Statement.md)[]

#### Returns

[`DefaultClause`](DefaultClause.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7800

***

### updateDeleteExpression()

```ts
updateDeleteExpression(node, expression): DeleteExpression
```

#### Parameters

• **node**: [`DeleteExpression`](DeleteExpression.md)

• **expression**: [`Expression`](Expression.md)

#### Returns

[`DeleteExpression`](DeleteExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7549

***

### updateDoStatement()

```ts
updateDoStatement(
   node, 
   statement, 
   expression): DoStatement
```

#### Parameters

• **node**: [`DoStatement`](DoStatement.md)

• **statement**: [`Statement`](Statement.md)

• **expression**: [`Expression`](Expression.md)

#### Returns

[`DoStatement`](DoStatement.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7607

***

### updateElementAccessChain()

```ts
updateElementAccessChain(
   node, 
   expression, 
   questionDotToken, 
   argumentExpression): ElementAccessChain
```

#### Parameters

• **node**: [`ElementAccessChain`](ElementAccessChain.md)

• **expression**: [`Expression`](Expression.md)

• **questionDotToken**: `undefined` \| [`QuestionDotToken`](../type-aliases/QuestionDotToken.md)

• **argumentExpression**: [`Expression`](Expression.md)

#### Returns

[`ElementAccessChain`](ElementAccessChain.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7531

***

### updateElementAccessExpression()

```ts
updateElementAccessExpression(
   node, 
   expression, 
   argumentExpression): ElementAccessExpression
```

#### Parameters

• **node**: [`ElementAccessExpression`](ElementAccessExpression.md)

• **expression**: [`Expression`](Expression.md)

• **argumentExpression**: [`Expression`](Expression.md)

#### Returns

[`ElementAccessExpression`](ElementAccessExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7529

***

### updateEnumDeclaration()

```ts
updateEnumDeclaration(
   node, 
   modifiers, 
   name, 
   members): EnumDeclaration
```

#### Parameters

• **node**: [`EnumDeclaration`](EnumDeclaration.md)

• **modifiers**: `undefined` \| readonly [`ModifierLike`](../type-aliases/ModifierLike.md)[]

• **name**: [`Identifier`](Identifier.md)

• **members**: readonly [`EnumMember`](EnumMember.md)[]

#### Returns

[`EnumDeclaration`](EnumDeclaration.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7646

***

### updateEnumMember()

```ts
updateEnumMember(
   node, 
   name, 
   initializer): EnumMember
```

#### Parameters

• **node**: [`EnumMember`](EnumMember.md)

• **name**: [`PropertyName`](../type-aliases/PropertyName.md)

• **initializer**: `undefined` \| [`Expression`](Expression.md)

#### Returns

[`EnumMember`](EnumMember.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7812

***

### updateExportAssignment()

```ts
updateExportAssignment(
   node, 
   modifiers, 
   expression): ExportAssignment
```

#### Parameters

• **node**: [`ExportAssignment`](ExportAssignment.md)

• **modifiers**: `undefined` \| readonly [`ModifierLike`](../type-aliases/ModifierLike.md)[]

• **expression**: [`Expression`](Expression.md)

#### Returns

[`ExportAssignment`](ExportAssignment.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7680

***

### updateExportDeclaration()

```ts
updateExportDeclaration(
   node, 
   modifiers, 
   isTypeOnly, 
   exportClause, 
   moduleSpecifier, 
   attributes): ExportDeclaration
```

#### Parameters

• **node**: [`ExportDeclaration`](ExportDeclaration.md)

• **modifiers**: `undefined` \| readonly [`ModifierLike`](../type-aliases/ModifierLike.md)[]

• **isTypeOnly**: `boolean`

• **exportClause**: `undefined` \| [`NamedExportBindings`](../type-aliases/NamedExportBindings.md)

• **moduleSpecifier**: `undefined` \| [`Expression`](Expression.md)

• **attributes**: `undefined` \| [`ImportAttributes`](ImportAttributes.md)

#### Returns

[`ExportDeclaration`](ExportDeclaration.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7682

***

### updateExportSpecifier()

```ts
updateExportSpecifier(
   node, 
   isTypeOnly, 
   propertyName, 
   name): ExportSpecifier
```

#### Parameters

• **node**: [`ExportSpecifier`](ExportSpecifier.md)

• **isTypeOnly**: `boolean`

• **propertyName**: `undefined` \| [`ModuleExportName`](../type-aliases/ModuleExportName.md)

• **name**: [`ModuleExportName`](../type-aliases/ModuleExportName.md)

#### Returns

[`ExportSpecifier`](ExportSpecifier.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7686

***

### updateExpressionStatement()

```ts
updateExpressionStatement(node, expression): ExpressionStatement
```

#### Parameters

• **node**: [`ExpressionStatement`](ExpressionStatement.md)

• **expression**: [`Expression`](Expression.md)

#### Returns

[`ExpressionStatement`](ExpressionStatement.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7603

***

### updateExpressionWithTypeArguments()

```ts
updateExpressionWithTypeArguments(
   node, 
   expression, 
   typeArguments): ExpressionWithTypeArguments
```

#### Parameters

• **node**: [`ExpressionWithTypeArguments`](ExpressionWithTypeArguments.md)

• **expression**: [`Expression`](Expression.md)

• **typeArguments**: `undefined` \| readonly [`TypeNode`](TypeNode.md)[]

#### Returns

[`ExpressionWithTypeArguments`](ExpressionWithTypeArguments.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7583

***

### updateExternalModuleReference()

```ts
updateExternalModuleReference(node, expression): ExternalModuleReference
```

#### Parameters

• **node**: [`ExternalModuleReference`](ExternalModuleReference.md)

• **expression**: [`Expression`](Expression.md)

#### Returns

[`ExternalModuleReference`](ExternalModuleReference.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7688

***

### updateForInStatement()

```ts
updateForInStatement(
   node, 
   initializer, 
   expression, 
   statement): ForInStatement
```

#### Parameters

• **node**: [`ForInStatement`](ForInStatement.md)

• **initializer**: [`ForInitializer`](../type-aliases/ForInitializer.md)

• **expression**: [`Expression`](Expression.md)

• **statement**: [`Statement`](Statement.md)

#### Returns

[`ForInStatement`](ForInStatement.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7613

***

### updateForOfStatement()

```ts
updateForOfStatement(
   node, 
   awaitModifier, 
   initializer, 
   expression, 
   statement): ForOfStatement
```

#### Parameters

• **node**: [`ForOfStatement`](ForOfStatement.md)

• **awaitModifier**: `undefined` \| [`AwaitKeyword`](../type-aliases/AwaitKeyword.md)

• **initializer**: [`ForInitializer`](../type-aliases/ForInitializer.md)

• **expression**: [`Expression`](Expression.md)

• **statement**: [`Statement`](Statement.md)

#### Returns

[`ForOfStatement`](ForOfStatement.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7615

***

### updateForStatement()

```ts
updateForStatement(
   node, 
   initializer, 
   condition, 
   incrementor, 
   statement): ForStatement
```

#### Parameters

• **node**: [`ForStatement`](ForStatement.md)

• **initializer**: `undefined` \| [`ForInitializer`](../type-aliases/ForInitializer.md)

• **condition**: `undefined` \| [`Expression`](Expression.md)

• **incrementor**: `undefined` \| [`Expression`](Expression.md)

• **statement**: [`Statement`](Statement.md)

#### Returns

[`ForStatement`](ForStatement.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7611

***

### updateFunctionDeclaration()

```ts
updateFunctionDeclaration(
   node, 
   modifiers, 
   asteriskToken, 
   name, 
   typeParameters, 
   parameters, 
   type, 
   body): FunctionDeclaration
```

#### Parameters

• **node**: [`FunctionDeclaration`](FunctionDeclaration.md)

• **modifiers**: `undefined` \| readonly [`ModifierLike`](../type-aliases/ModifierLike.md)[]

• **asteriskToken**: `undefined` \| [`AsteriskToken`](../type-aliases/AsteriskToken.md)

• **name**: `undefined` \| [`Identifier`](Identifier.md)

• **typeParameters**: `undefined` \| readonly [`TypeParameterDeclaration`](TypeParameterDeclaration.md)[]

• **parameters**: readonly [`ParameterDeclaration`](ParameterDeclaration.md)[]

• **type**: `undefined` \| [`TypeNode`](TypeNode.md)

• **body**: `undefined` \| [`Block`](Block.md)

#### Returns

[`FunctionDeclaration`](FunctionDeclaration.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7638

***

### updateFunctionExpression()

```ts
updateFunctionExpression(
   node, 
   modifiers, 
   asteriskToken, 
   name, 
   typeParameters, 
   parameters, 
   type, 
   body): FunctionExpression
```

#### Parameters

• **node**: [`FunctionExpression`](FunctionExpression.md)

• **modifiers**: `undefined` \| readonly [`Modifier`](../type-aliases/Modifier.md)[]

• **asteriskToken**: `undefined` \| [`AsteriskToken`](../type-aliases/AsteriskToken.md)

• **name**: `undefined` \| [`Identifier`](Identifier.md)

• **typeParameters**: `undefined` \| readonly [`TypeParameterDeclaration`](TypeParameterDeclaration.md)[]

• **parameters**: readonly [`ParameterDeclaration`](ParameterDeclaration.md)[]

• **type**: `undefined` \| [`TypeNode`](TypeNode.md)

• **body**: [`Block`](Block.md)

#### Returns

[`FunctionExpression`](FunctionExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7545

***

### updateFunctionTypeNode()

```ts
updateFunctionTypeNode(
   node, 
   typeParameters, 
   parameters, 
   type): FunctionTypeNode
```

#### Parameters

• **node**: [`FunctionTypeNode`](FunctionTypeNode.md)

• **typeParameters**: `undefined` \| [`NodeArray`](NodeArray.md)\<[`TypeParameterDeclaration`](TypeParameterDeclaration.md)\>

• **parameters**: [`NodeArray`](NodeArray.md)\<[`ParameterDeclaration`](ParameterDeclaration.md)\>

• **type**: [`TypeNode`](TypeNode.md)

#### Returns

[`FunctionTypeNode`](FunctionTypeNode.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7474

***

### updateGetAccessorDeclaration()

```ts
updateGetAccessorDeclaration(
   node, 
   modifiers, 
   name, 
   parameters, 
   type, 
   body): GetAccessorDeclaration
```

#### Parameters

• **node**: [`GetAccessorDeclaration`](GetAccessorDeclaration.md)

• **modifiers**: `undefined` \| readonly [`ModifierLike`](../type-aliases/ModifierLike.md)[]

• **name**: [`PropertyName`](../type-aliases/PropertyName.md)

• **parameters**: readonly [`ParameterDeclaration`](ParameterDeclaration.md)[]

• **type**: `undefined` \| [`TypeNode`](TypeNode.md)

• **body**: `undefined` \| [`Block`](Block.md)

#### Returns

[`GetAccessorDeclaration`](GetAccessorDeclaration.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7455

***

### updateHeritageClause()

```ts
updateHeritageClause(node, types): HeritageClause
```

#### Parameters

• **node**: [`HeritageClause`](HeritageClause.md)

• **types**: readonly [`ExpressionWithTypeArguments`](ExpressionWithTypeArguments.md)[]

#### Returns

[`HeritageClause`](HeritageClause.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7802

***

### updateIfStatement()

```ts
updateIfStatement(
   node, 
   expression, 
   thenStatement, 
   elseStatement): IfStatement
```

#### Parameters

• **node**: [`IfStatement`](IfStatement.md)

• **expression**: [`Expression`](Expression.md)

• **thenStatement**: [`Statement`](Statement.md)

• **elseStatement**: `undefined` \| [`Statement`](Statement.md)

#### Returns

[`IfStatement`](IfStatement.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7605

***

### updateImportAttribute()

```ts
updateImportAttribute(
   node, 
   name, 
   value): ImportAttribute
```

#### Parameters

• **node**: [`ImportAttribute`](ImportAttribute.md)

• **name**: [`ImportAttributeName`](../type-aliases/ImportAttributeName.md)

• **value**: [`Expression`](Expression.md)

#### Returns

[`ImportAttribute`](ImportAttribute.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7670

***

### updateImportAttributes()

```ts
updateImportAttributes(
   node, 
   elements, 
   multiLine?): ImportAttributes
```

#### Parameters

• **node**: [`ImportAttributes`](ImportAttributes.md)

• **elements**: [`NodeArray`](NodeArray.md)\<[`ImportAttribute`](ImportAttribute.md)\>

• **multiLine?**: `boolean`

#### Returns

[`ImportAttributes`](ImportAttributes.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7668

***

### updateImportClause()

```ts
updateImportClause(
   node, 
   isTypeOnly, 
   name, 
   namedBindings): ImportClause
```

#### Parameters

• **node**: [`ImportClause`](ImportClause.md)

• **isTypeOnly**: `boolean`

• **name**: `undefined` \| [`Identifier`](Identifier.md)

• **namedBindings**: `undefined` \| [`NamedImportBindings`](../type-aliases/NamedImportBindings.md)

#### Returns

[`ImportClause`](ImportClause.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7660

***

### updateImportDeclaration()

```ts
updateImportDeclaration(
   node, 
   modifiers, 
   importClause, 
   moduleSpecifier, 
   attributes): ImportDeclaration
```

#### Parameters

• **node**: [`ImportDeclaration`](ImportDeclaration.md)

• **modifiers**: `undefined` \| readonly [`ModifierLike`](../type-aliases/ModifierLike.md)[]

• **importClause**: `undefined` \| [`ImportClause`](ImportClause.md)

• **moduleSpecifier**: [`Expression`](Expression.md)

• **attributes**: `undefined` \| [`ImportAttributes`](ImportAttributes.md)

#### Returns

[`ImportDeclaration`](ImportDeclaration.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7658

***

### updateImportEqualsDeclaration()

```ts
updateImportEqualsDeclaration(
   node, 
   modifiers, 
   isTypeOnly, 
   name, 
   moduleReference): ImportEqualsDeclaration
```

#### Parameters

• **node**: [`ImportEqualsDeclaration`](ImportEqualsDeclaration.md)

• **modifiers**: `undefined` \| readonly [`ModifierLike`](../type-aliases/ModifierLike.md)[]

• **isTypeOnly**: `boolean`

• **name**: [`Identifier`](Identifier.md)

• **moduleReference**: [`ModuleReference`](../type-aliases/ModuleReference.md)

#### Returns

[`ImportEqualsDeclaration`](ImportEqualsDeclaration.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7656

***

### updateImportSpecifier()

```ts
updateImportSpecifier(
   node, 
   isTypeOnly, 
   propertyName, 
   name): ImportSpecifier
```

#### Parameters

• **node**: [`ImportSpecifier`](ImportSpecifier.md)

• **isTypeOnly**: `boolean`

• **propertyName**: `undefined` \| [`ModuleExportName`](../type-aliases/ModuleExportName.md)

• **name**: [`Identifier`](Identifier.md)

#### Returns

[`ImportSpecifier`](ImportSpecifier.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7678

***

### ~~updateImportTypeAssertionContainer()~~

```ts
updateImportTypeAssertionContainer(
   node, 
   clause, 
   multiLine?): ImportTypeAssertionContainer
```

#### Parameters

• **node**: [`ImportTypeAssertionContainer`](ImportTypeAssertionContainer.md)

• **clause**: [`AssertClause`](AssertClause.md)

• **multiLine?**: `boolean`

#### Returns

[`ImportTypeAssertionContainer`](ImportTypeAssertionContainer.md)

#### Deprecated

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7666

***

### updateImportTypeNode()

```ts
updateImportTypeNode(
   node, 
   argument, 
   attributes, 
   qualifier, 
   typeArguments, 
   isTypeOf?): ImportTypeNode
```

#### Parameters

• **node**: [`ImportTypeNode`](ImportTypeNode.md)

• **argument**: [`TypeNode`](TypeNode.md)

• **attributes**: `undefined` \| [`ImportAttributes`](ImportAttributes.md)

• **qualifier**: `undefined` \| [`EntityName`](../type-aliases/EntityName.md)

• **typeArguments**: `undefined` \| readonly [`TypeNode`](TypeNode.md)[]

• **isTypeOf?**: `boolean`

#### Returns

[`ImportTypeNode`](ImportTypeNode.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7500

***

### updateIndexedAccessTypeNode()

```ts
updateIndexedAccessTypeNode(
   node, 
   objectType, 
   indexType): IndexedAccessTypeNode
```

#### Parameters

• **node**: [`IndexedAccessTypeNode`](IndexedAccessTypeNode.md)

• **objectType**: [`TypeNode`](TypeNode.md)

• **indexType**: [`TypeNode`](TypeNode.md)

#### Returns

[`IndexedAccessTypeNode`](IndexedAccessTypeNode.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7507

***

### updateIndexSignature()

```ts
updateIndexSignature(
   node, 
   modifiers, 
   parameters, 
   type): IndexSignatureDeclaration
```

#### Parameters

• **node**: [`IndexSignatureDeclaration`](IndexSignatureDeclaration.md)

• **modifiers**: `undefined` \| readonly [`ModifierLike`](../type-aliases/ModifierLike.md)[]

• **parameters**: readonly [`ParameterDeclaration`](ParameterDeclaration.md)[]

• **type**: [`TypeNode`](TypeNode.md)

#### Returns

[`IndexSignatureDeclaration`](IndexSignatureDeclaration.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7463

***

### updateInferTypeNode()

```ts
updateInferTypeNode(node, typeParameter): InferTypeNode
```

#### Parameters

• **node**: [`InferTypeNode`](InferTypeNode.md)

• **typeParameter**: [`TypeParameterDeclaration`](TypeParameterDeclaration.md)

#### Returns

[`InferTypeNode`](InferTypeNode.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7498

***

### updateInterfaceDeclaration()

```ts
updateInterfaceDeclaration(
   node, 
   modifiers, 
   name, 
   typeParameters, 
   heritageClauses, 
   members): InterfaceDeclaration
```

#### Parameters

• **node**: [`InterfaceDeclaration`](InterfaceDeclaration.md)

• **modifiers**: `undefined` \| readonly [`ModifierLike`](../type-aliases/ModifierLike.md)[]

• **name**: [`Identifier`](Identifier.md)

• **typeParameters**: `undefined` \| readonly [`TypeParameterDeclaration`](TypeParameterDeclaration.md)[]

• **heritageClauses**: `undefined` \| readonly [`HeritageClause`](HeritageClause.md)[]

• **members**: readonly [`TypeElement`](TypeElement.md)[]

#### Returns

[`InterfaceDeclaration`](InterfaceDeclaration.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7642

***

### updateIntersectionTypeNode()

```ts
updateIntersectionTypeNode(node, types): IntersectionTypeNode
```

#### Parameters

• **node**: [`IntersectionTypeNode`](IntersectionTypeNode.md)

• **types**: [`NodeArray`](NodeArray.md)\<[`TypeNode`](TypeNode.md)\>

#### Returns

[`IntersectionTypeNode`](IntersectionTypeNode.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7494

***

### updateJSDocAugmentsTag()

```ts
updateJSDocAugmentsTag(
   node, 
   tagName, 
   className, 
   comment): JSDocAugmentsTag
```

#### Parameters

• **node**: [`JSDocAugmentsTag`](JSDocAugmentsTag.md)

• **tagName**: `undefined` \| [`Identifier`](Identifier.md)

• **className**: [`ExpressionWithTypeArguments`](ExpressionWithTypeArguments.md) & `object`

• **comment**: `undefined` \| `string` \| [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocAugmentsTag`](JSDocAugmentsTag.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7742

***

### updateJSDocAuthorTag()

```ts
updateJSDocAuthorTag(
   node, 
   tagName, 
   comment): JSDocAuthorTag
```

#### Parameters

• **node**: [`JSDocAuthorTag`](JSDocAuthorTag.md)

• **tagName**: `undefined` \| [`Identifier`](Identifier.md)

• **comment**: `undefined` \| `string` \| [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocAuthorTag`](JSDocAuthorTag.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7746

***

### updateJSDocCallbackTag()

```ts
updateJSDocCallbackTag(
   node, 
   tagName, 
   typeExpression, 
   fullName, 
   comment): JSDocCallbackTag
```

#### Parameters

• **node**: [`JSDocCallbackTag`](JSDocCallbackTag.md)

• **tagName**: `undefined` \| [`Identifier`](Identifier.md)

• **typeExpression**: [`JSDocSignature`](JSDocSignature.md)

• **fullName**: `undefined` \| [`Identifier`](Identifier.md) \| [`JSDocNamespaceDeclaration`](JSDocNamespaceDeclaration.md)

• **comment**: `undefined` \| `string` \| [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocCallbackTag`](JSDocCallbackTag.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7738

***

### updateJSDocClassTag()

```ts
updateJSDocClassTag(
   node, 
   tagName, 
   comment): JSDocClassTag
```

#### Parameters

• **node**: [`JSDocClassTag`](JSDocClassTag.md)

• **tagName**: `undefined` \| [`Identifier`](Identifier.md)

• **comment**: `undefined` \| `string` \| [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocClassTag`](JSDocClassTag.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7748

***

### updateJSDocComment()

```ts
updateJSDocComment(
   node, 
   comment, 
   tags): JSDoc
```

#### Parameters

• **node**: [`JSDoc`](JSDoc.md)

• **comment**: `undefined` \| `string` \| [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

• **tags**: `undefined` \| readonly [`JSDocTag`](JSDocTag.md)[]

#### Returns

[`JSDoc`](JSDoc.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7772

***

### updateJSDocDeprecatedTag()

```ts
updateJSDocDeprecatedTag(
   node, 
   tagName, 
   comment?): JSDocDeprecatedTag
```

#### Parameters

• **node**: [`JSDocDeprecatedTag`](JSDocDeprecatedTag.md)

• **tagName**: `undefined` \| [`Identifier`](Identifier.md)

• **comment?**: `string` \| [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocDeprecatedTag`](JSDocDeprecatedTag.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7760

***

### updateJSDocEnumTag()

```ts
updateJSDocEnumTag(
   node, 
   tagName, 
   typeExpression, 
   comment): JSDocEnumTag
```

#### Parameters

• **node**: [`JSDocEnumTag`](JSDocEnumTag.md)

• **tagName**: `undefined` \| [`Identifier`](Identifier.md)

• **typeExpression**: [`JSDocTypeExpression`](JSDocTypeExpression.md)

• **comment**: `undefined` \| `string` \| [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocEnumTag`](JSDocEnumTag.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7736

***

### updateJSDocFunctionType()

```ts
updateJSDocFunctionType(
   node, 
   parameters, 
   type): JSDocFunctionType
```

#### Parameters

• **node**: [`JSDocFunctionType`](JSDocFunctionType.md)

• **parameters**: readonly [`ParameterDeclaration`](ParameterDeclaration.md)[]

• **type**: `undefined` \| [`TypeNode`](TypeNode.md)

#### Returns

[`JSDocFunctionType`](JSDocFunctionType.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7698

***

### updateJSDocImplementsTag()

```ts
updateJSDocImplementsTag(
   node, 
   tagName, 
   className, 
   comment): JSDocImplementsTag
```

#### Parameters

• **node**: [`JSDocImplementsTag`](JSDocImplementsTag.md)

• **tagName**: `undefined` \| [`Identifier`](Identifier.md)

• **className**: [`ExpressionWithTypeArguments`](ExpressionWithTypeArguments.md) & `object`

• **comment**: `undefined` \| `string` \| [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocImplementsTag`](JSDocImplementsTag.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7744

***

### updateJSDocImportTag()

```ts
updateJSDocImportTag(
   node, 
   tagName, 
   importClause, 
   moduleSpecifier, 
   attributes, 
   comment): JSDocImportTag
```

#### Parameters

• **node**: [`JSDocImportTag`](JSDocImportTag.md)

• **tagName**: `undefined` \| [`Identifier`](Identifier.md)

• **importClause**: `undefined` \| [`ImportClause`](ImportClause.md)

• **moduleSpecifier**: [`Expression`](Expression.md)

• **attributes**: `undefined` \| [`ImportAttributes`](ImportAttributes.md)

• **comment**: `undefined` \| `string` \| [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocImportTag`](JSDocImportTag.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7768

***

### updateJSDocLink()

```ts
updateJSDocLink(
   node, 
   name, 
   text): JSDocLink
```

#### Parameters

• **node**: [`JSDocLink`](JSDocLink.md)

• **name**: `undefined` \| [`EntityName`](../type-aliases/EntityName.md) \| [`JSDocMemberName`](JSDocMemberName.md)

• **text**: `string`

#### Returns

[`JSDocLink`](JSDocLink.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7710

***

### updateJSDocLinkCode()

```ts
updateJSDocLinkCode(
   node, 
   name, 
   text): JSDocLinkCode
```

#### Parameters

• **node**: [`JSDocLinkCode`](JSDocLinkCode.md)

• **name**: `undefined` \| [`EntityName`](../type-aliases/EntityName.md) \| [`JSDocMemberName`](JSDocMemberName.md)

• **text**: `string`

#### Returns

[`JSDocLinkCode`](JSDocLinkCode.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7712

***

### updateJSDocLinkPlain()

```ts
updateJSDocLinkPlain(
   node, 
   name, 
   text): JSDocLinkPlain
```

#### Parameters

• **node**: [`JSDocLinkPlain`](JSDocLinkPlain.md)

• **name**: `undefined` \| [`EntityName`](../type-aliases/EntityName.md) \| [`JSDocMemberName`](JSDocMemberName.md)

• **text**: `string`

#### Returns

[`JSDocLinkPlain`](JSDocLinkPlain.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7714

***

### updateJSDocMemberName()

```ts
updateJSDocMemberName(
   node, 
   left, 
   right): JSDocMemberName
```

#### Parameters

• **node**: [`JSDocMemberName`](JSDocMemberName.md)

• **left**: [`EntityName`](../type-aliases/EntityName.md) \| [`JSDocMemberName`](JSDocMemberName.md)

• **right**: [`Identifier`](Identifier.md)

#### Returns

[`JSDocMemberName`](JSDocMemberName.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7708

***

### updateJSDocNamepathType()

```ts
updateJSDocNamepathType(node, type): JSDocNamepathType
```

#### Parameters

• **node**: [`JSDocNamepathType`](JSDocNamepathType.md)

• **type**: [`TypeNode`](TypeNode.md)

#### Returns

[`JSDocNamepathType`](JSDocNamepathType.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7702

***

### updateJSDocNameReference()

```ts
updateJSDocNameReference(node, name): JSDocNameReference
```

#### Parameters

• **node**: [`JSDocNameReference`](JSDocNameReference.md)

• **name**: [`EntityName`](../type-aliases/EntityName.md) \| [`JSDocMemberName`](JSDocMemberName.md)

#### Returns

[`JSDocNameReference`](JSDocNameReference.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7706

***

### updateJSDocNonNullableType()

```ts
updateJSDocNonNullableType(node, type): JSDocNonNullableType
```

#### Parameters

• **node**: [`JSDocNonNullableType`](JSDocNonNullableType.md)

• **type**: [`TypeNode`](TypeNode.md)

#### Returns

[`JSDocNonNullableType`](JSDocNonNullableType.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7692

***

### updateJSDocNullableType()

```ts
updateJSDocNullableType(node, type): JSDocNullableType
```

#### Parameters

• **node**: [`JSDocNullableType`](JSDocNullableType.md)

• **type**: [`TypeNode`](TypeNode.md)

#### Returns

[`JSDocNullableType`](JSDocNullableType.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7694

***

### updateJSDocOptionalType()

```ts
updateJSDocOptionalType(node, type): JSDocOptionalType
```

#### Parameters

• **node**: [`JSDocOptionalType`](JSDocOptionalType.md)

• **type**: [`TypeNode`](TypeNode.md)

#### Returns

[`JSDocOptionalType`](JSDocOptionalType.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7696

***

### updateJSDocOverloadTag()

```ts
updateJSDocOverloadTag(
   node, 
   tagName, 
   typeExpression, 
   comment): JSDocOverloadTag
```

#### Parameters

• **node**: [`JSDocOverloadTag`](JSDocOverloadTag.md)

• **tagName**: `undefined` \| [`Identifier`](Identifier.md)

• **typeExpression**: [`JSDocSignature`](JSDocSignature.md)

• **comment**: `undefined` \| `string` \| [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocOverloadTag`](JSDocOverloadTag.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7740

***

### updateJSDocOverrideTag()

```ts
updateJSDocOverrideTag(
   node, 
   tagName, 
   comment?): JSDocOverrideTag
```

#### Parameters

• **node**: [`JSDocOverrideTag`](JSDocOverrideTag.md)

• **tagName**: `undefined` \| [`Identifier`](Identifier.md)

• **comment?**: `string` \| [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocOverrideTag`](JSDocOverrideTag.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7762

***

### updateJSDocParameterTag()

```ts
updateJSDocParameterTag(
   node, 
   tagName, 
   name, 
   isBracketed, 
   typeExpression, 
   isNameFirst, 
   comment): JSDocParameterTag
```

#### Parameters

• **node**: [`JSDocParameterTag`](JSDocParameterTag.md)

• **tagName**: `undefined` \| [`Identifier`](Identifier.md)

• **name**: [`EntityName`](../type-aliases/EntityName.md)

• **isBracketed**: `boolean`

• **typeExpression**: `undefined` \| [`JSDocTypeExpression`](JSDocTypeExpression.md)

• **isNameFirst**: `boolean`

• **comment**: `undefined` \| `string` \| [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocParameterTag`](JSDocParameterTag.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7724

***

### updateJSDocPrivateTag()

```ts
updateJSDocPrivateTag(
   node, 
   tagName, 
   comment): JSDocPrivateTag
```

#### Parameters

• **node**: [`JSDocPrivateTag`](JSDocPrivateTag.md)

• **tagName**: `undefined` \| [`Identifier`](Identifier.md)

• **comment**: `undefined` \| `string` \| [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocPrivateTag`](JSDocPrivateTag.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7752

***

### updateJSDocPropertyTag()

```ts
updateJSDocPropertyTag(
   node, 
   tagName, 
   name, 
   isBracketed, 
   typeExpression, 
   isNameFirst, 
   comment): JSDocPropertyTag
```

#### Parameters

• **node**: [`JSDocPropertyTag`](JSDocPropertyTag.md)

• **tagName**: `undefined` \| [`Identifier`](Identifier.md)

• **name**: [`EntityName`](../type-aliases/EntityName.md)

• **isBracketed**: `boolean`

• **typeExpression**: `undefined` \| [`JSDocTypeExpression`](JSDocTypeExpression.md)

• **isNameFirst**: `boolean`

• **comment**: `undefined` \| `string` \| [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocPropertyTag`](JSDocPropertyTag.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7726

***

### updateJSDocProtectedTag()

```ts
updateJSDocProtectedTag(
   node, 
   tagName, 
   comment): JSDocProtectedTag
```

#### Parameters

• **node**: [`JSDocProtectedTag`](JSDocProtectedTag.md)

• **tagName**: `undefined` \| [`Identifier`](Identifier.md)

• **comment**: `undefined` \| `string` \| [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocProtectedTag`](JSDocProtectedTag.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7754

***

### updateJSDocPublicTag()

```ts
updateJSDocPublicTag(
   node, 
   tagName, 
   comment): JSDocPublicTag
```

#### Parameters

• **node**: [`JSDocPublicTag`](JSDocPublicTag.md)

• **tagName**: `undefined` \| [`Identifier`](Identifier.md)

• **comment**: `undefined` \| `string` \| [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocPublicTag`](JSDocPublicTag.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7750

***

### updateJSDocReadonlyTag()

```ts
updateJSDocReadonlyTag(
   node, 
   tagName, 
   comment): JSDocReadonlyTag
```

#### Parameters

• **node**: [`JSDocReadonlyTag`](JSDocReadonlyTag.md)

• **tagName**: `undefined` \| [`Identifier`](Identifier.md)

• **comment**: `undefined` \| `string` \| [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocReadonlyTag`](JSDocReadonlyTag.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7756

***

### updateJSDocReturnTag()

```ts
updateJSDocReturnTag(
   node, 
   tagName, 
   typeExpression, 
   comment): JSDocReturnTag
```

#### Parameters

• **node**: [`JSDocReturnTag`](JSDocReturnTag.md)

• **tagName**: `undefined` \| [`Identifier`](Identifier.md)

• **typeExpression**: `undefined` \| [`JSDocTypeExpression`](JSDocTypeExpression.md)

• **comment**: `undefined` \| `string` \| [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocReturnTag`](JSDocReturnTag.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7732

***

### updateJSDocSatisfiesTag()

```ts
updateJSDocSatisfiesTag(
   node, 
   tagName, 
   typeExpression, 
   comment): JSDocSatisfiesTag
```

#### Parameters

• **node**: [`JSDocSatisfiesTag`](JSDocSatisfiesTag.md)

• **tagName**: `undefined` \| [`Identifier`](Identifier.md)

• **typeExpression**: [`JSDocTypeExpression`](JSDocTypeExpression.md)

• **comment**: `undefined` \| `string` \| [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocSatisfiesTag`](JSDocSatisfiesTag.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7766

***

### updateJSDocSeeTag()

```ts
updateJSDocSeeTag(
   node, 
   tagName, 
   nameExpression, 
   comment?): JSDocSeeTag
```

#### Parameters

• **node**: [`JSDocSeeTag`](JSDocSeeTag.md)

• **tagName**: `undefined` \| [`Identifier`](Identifier.md)

• **nameExpression**: `undefined` \| [`JSDocNameReference`](JSDocNameReference.md)

• **comment?**: `string` \| [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocSeeTag`](JSDocSeeTag.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7730

***

### updateJSDocSignature()

```ts
updateJSDocSignature(
   node, 
   typeParameters, 
   parameters, 
   type): JSDocSignature
```

#### Parameters

• **node**: [`JSDocSignature`](JSDocSignature.md)

• **typeParameters**: `undefined` \| readonly [`JSDocTemplateTag`](JSDocTemplateTag.md)[]

• **parameters**: readonly [`JSDocParameterTag`](JSDocParameterTag.md)[]

• **type**: `undefined` \| [`JSDocReturnTag`](JSDocReturnTag.md)

#### Returns

[`JSDocSignature`](JSDocSignature.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7718

***

### updateJSDocTemplateTag()

```ts
updateJSDocTemplateTag(
   node, 
   tagName, 
   constraint, 
   typeParameters, 
   comment): JSDocTemplateTag
```

#### Parameters

• **node**: [`JSDocTemplateTag`](JSDocTemplateTag.md)

• **tagName**: `undefined` \| [`Identifier`](Identifier.md)

• **constraint**: `undefined` \| [`JSDocTypeExpression`](JSDocTypeExpression.md)

• **typeParameters**: readonly [`TypeParameterDeclaration`](TypeParameterDeclaration.md)[]

• **comment**: `undefined` \| `string` \| [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocTemplateTag`](JSDocTemplateTag.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7720

***

### updateJSDocText()

```ts
updateJSDocText(node, text): JSDocText
```

#### Parameters

• **node**: [`JSDocText`](JSDocText.md)

• **text**: `string`

#### Returns

[`JSDocText`](JSDocText.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7770

***

### updateJSDocThisTag()

```ts
updateJSDocThisTag(
   node, 
   tagName, 
   typeExpression, 
   comment): JSDocThisTag
```

#### Parameters

• **node**: [`JSDocThisTag`](JSDocThisTag.md)

• **tagName**: `undefined` \| [`Identifier`](Identifier.md)

• **typeExpression**: `undefined` \| [`JSDocTypeExpression`](JSDocTypeExpression.md)

• **comment**: `undefined` \| `string` \| [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocThisTag`](JSDocThisTag.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7734

***

### updateJSDocThrowsTag()

```ts
updateJSDocThrowsTag(
   node, 
   tagName, 
   typeExpression, 
   comment?): JSDocThrowsTag
```

#### Parameters

• **node**: [`JSDocThrowsTag`](JSDocThrowsTag.md)

• **tagName**: `undefined` \| [`Identifier`](Identifier.md)

• **typeExpression**: `undefined` \| [`JSDocTypeExpression`](JSDocTypeExpression.md)

• **comment?**: `string` \| [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocThrowsTag`](JSDocThrowsTag.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7764

***

### updateJSDocTypedefTag()

```ts
updateJSDocTypedefTag(
   node, 
   tagName, 
   typeExpression, 
   fullName, 
   comment): JSDocTypedefTag
```

#### Parameters

• **node**: [`JSDocTypedefTag`](JSDocTypedefTag.md)

• **tagName**: `undefined` \| [`Identifier`](Identifier.md)

• **typeExpression**: `undefined` \| [`JSDocTypeLiteral`](JSDocTypeLiteral.md) \| [`JSDocTypeExpression`](JSDocTypeExpression.md)

• **fullName**: `undefined` \| [`Identifier`](Identifier.md) \| [`JSDocNamespaceDeclaration`](JSDocNamespaceDeclaration.md)

• **comment**: `undefined` \| `string` \| [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocTypedefTag`](JSDocTypedefTag.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7722

***

### updateJSDocTypeExpression()

```ts
updateJSDocTypeExpression(node, type): JSDocTypeExpression
```

#### Parameters

• **node**: [`JSDocTypeExpression`](JSDocTypeExpression.md)

• **type**: [`TypeNode`](TypeNode.md)

#### Returns

[`JSDocTypeExpression`](JSDocTypeExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7704

***

### updateJSDocTypeLiteral()

```ts
updateJSDocTypeLiteral(
   node, 
   jsDocPropertyTags, 
   isArrayType): JSDocTypeLiteral
```

#### Parameters

• **node**: [`JSDocTypeLiteral`](JSDocTypeLiteral.md)

• **jsDocPropertyTags**: `undefined` \| readonly [`JSDocPropertyLikeTag`](JSDocPropertyLikeTag.md)[]

• **isArrayType**: `undefined` \| `boolean`

#### Returns

[`JSDocTypeLiteral`](JSDocTypeLiteral.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7716

***

### updateJSDocTypeTag()

```ts
updateJSDocTypeTag(
   node, 
   tagName, 
   typeExpression, 
   comment): JSDocTypeTag
```

#### Parameters

• **node**: [`JSDocTypeTag`](JSDocTypeTag.md)

• **tagName**: `undefined` \| [`Identifier`](Identifier.md)

• **typeExpression**: [`JSDocTypeExpression`](JSDocTypeExpression.md)

• **comment**: `undefined` \| `string` \| [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocTypeTag`](JSDocTypeTag.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7728

***

### updateJSDocUnknownTag()

```ts
updateJSDocUnknownTag(
   node, 
   tagName, 
   comment): JSDocUnknownTag
```

#### Parameters

• **node**: [`JSDocUnknownTag`](JSDocUnknownTag.md)

• **tagName**: [`Identifier`](Identifier.md)

• **comment**: `undefined` \| `string` \| [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocUnknownTag`](JSDocUnknownTag.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7758

***

### updateJSDocVariadicType()

```ts
updateJSDocVariadicType(node, type): JSDocVariadicType
```

#### Parameters

• **node**: [`JSDocVariadicType`](JSDocVariadicType.md)

• **type**: [`TypeNode`](TypeNode.md)

#### Returns

[`JSDocVariadicType`](JSDocVariadicType.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7700

***

### updateJsxAttribute()

```ts
updateJsxAttribute(
   node, 
   name, 
   initializer): JsxAttribute
```

#### Parameters

• **node**: [`JsxAttribute`](JsxAttribute.md)

• **name**: [`JsxAttributeName`](../type-aliases/JsxAttributeName.md)

• **initializer**: `undefined` \| [`JsxAttributeValue`](../type-aliases/JsxAttributeValue.md)

#### Returns

[`JsxAttribute`](JsxAttribute.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7788

***

### updateJsxAttributes()

```ts
updateJsxAttributes(node, properties): JsxAttributes
```

#### Parameters

• **node**: [`JsxAttributes`](JsxAttributes.md)

• **properties**: readonly [`JsxAttributeLike`](../type-aliases/JsxAttributeLike.md)[]

#### Returns

[`JsxAttributes`](JsxAttributes.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7790

***

### updateJsxClosingElement()

```ts
updateJsxClosingElement(node, tagName): JsxClosingElement
```

#### Parameters

• **node**: [`JsxClosingElement`](JsxClosingElement.md)

• **tagName**: [`JsxTagNameExpression`](../type-aliases/JsxTagNameExpression.md)

#### Returns

[`JsxClosingElement`](JsxClosingElement.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7780

***

### updateJsxElement()

```ts
updateJsxElement(
   node, 
   openingElement, 
   children, 
   closingElement): JsxElement
```

#### Parameters

• **node**: [`JsxElement`](JsxElement.md)

• **openingElement**: [`JsxOpeningElement`](JsxOpeningElement.md)

• **children**: readonly [`JsxChild`](../type-aliases/JsxChild.md)[]

• **closingElement**: [`JsxClosingElement`](JsxClosingElement.md)

#### Returns

[`JsxElement`](JsxElement.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7774

***

### updateJsxExpression()

```ts
updateJsxExpression(node, expression): JsxExpression
```

#### Parameters

• **node**: [`JsxExpression`](JsxExpression.md)

• **expression**: `undefined` \| [`Expression`](Expression.md)

#### Returns

[`JsxExpression`](JsxExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7794

***

### updateJsxFragment()

```ts
updateJsxFragment(
   node, 
   openingFragment, 
   children, 
   closingFragment): JsxFragment
```

#### Parameters

• **node**: [`JsxFragment`](JsxFragment.md)

• **openingFragment**: [`JsxOpeningFragment`](JsxOpeningFragment.md)

• **children**: readonly [`JsxChild`](../type-aliases/JsxChild.md)[]

• **closingFragment**: [`JsxClosingFragment`](JsxClosingFragment.md)

#### Returns

[`JsxFragment`](JsxFragment.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7786

***

### updateJsxNamespacedName()

```ts
updateJsxNamespacedName(
   node, 
   namespace, 
   name): JsxNamespacedName
```

#### Parameters

• **node**: [`JsxNamespacedName`](JsxNamespacedName.md)

• **namespace**: [`Identifier`](Identifier.md)

• **name**: [`Identifier`](Identifier.md)

#### Returns

[`JsxNamespacedName`](JsxNamespacedName.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7796

***

### updateJsxOpeningElement()

```ts
updateJsxOpeningElement(
   node, 
   tagName, 
   typeArguments, 
   attributes): JsxOpeningElement
```

#### Parameters

• **node**: [`JsxOpeningElement`](JsxOpeningElement.md)

• **tagName**: [`JsxTagNameExpression`](../type-aliases/JsxTagNameExpression.md)

• **typeArguments**: `undefined` \| readonly [`TypeNode`](TypeNode.md)[]

• **attributes**: [`JsxAttributes`](JsxAttributes.md)

#### Returns

[`JsxOpeningElement`](JsxOpeningElement.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7778

***

### updateJsxSelfClosingElement()

```ts
updateJsxSelfClosingElement(
   node, 
   tagName, 
   typeArguments, 
   attributes): JsxSelfClosingElement
```

#### Parameters

• **node**: [`JsxSelfClosingElement`](JsxSelfClosingElement.md)

• **tagName**: [`JsxTagNameExpression`](../type-aliases/JsxTagNameExpression.md)

• **typeArguments**: `undefined` \| readonly [`TypeNode`](TypeNode.md)[]

• **attributes**: [`JsxAttributes`](JsxAttributes.md)

#### Returns

[`JsxSelfClosingElement`](JsxSelfClosingElement.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7776

***

### updateJsxSpreadAttribute()

```ts
updateJsxSpreadAttribute(node, expression): JsxSpreadAttribute
```

#### Parameters

• **node**: [`JsxSpreadAttribute`](JsxSpreadAttribute.md)

• **expression**: [`Expression`](Expression.md)

#### Returns

[`JsxSpreadAttribute`](JsxSpreadAttribute.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7792

***

### updateJsxText()

```ts
updateJsxText(
   node, 
   text, 
   containsOnlyTriviaWhiteSpaces?): JsxText
```

#### Parameters

• **node**: [`JsxText`](JsxText.md)

• **text**: `string`

• **containsOnlyTriviaWhiteSpaces?**: `boolean`

#### Returns

[`JsxText`](JsxText.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7783

***

### updateLabeledStatement()

```ts
updateLabeledStatement(
   node, 
   label, 
   statement): LabeledStatement
```

#### Parameters

• **node**: [`LabeledStatement`](LabeledStatement.md)

• **label**: [`Identifier`](Identifier.md)

• **statement**: [`Statement`](Statement.md)

#### Returns

[`LabeledStatement`](LabeledStatement.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7627

***

### updateLiteralTypeNode()

```ts
updateLiteralTypeNode(node, literal): LiteralTypeNode
```

#### Parameters

• **node**: [`LiteralTypeNode`](LiteralTypeNode.md)

• **literal**: [`LiteralExpression`](LiteralExpression.md) \| [`NullLiteral`](NullLiteral.md) \| [`BooleanLiteral`](../type-aliases/BooleanLiteral.md) \| [`PrefixUnaryExpression`](PrefixUnaryExpression.md)

#### Returns

[`LiteralTypeNode`](LiteralTypeNode.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7511

***

### updateMappedTypeNode()

```ts
updateMappedTypeNode(
   node, 
   readonlyToken, 
   typeParameter, 
   nameType, 
   questionToken, 
   type, 
   members): MappedTypeNode
```

#### Parameters

• **node**: [`MappedTypeNode`](MappedTypeNode.md)

• **readonlyToken**: `undefined` \| [`ReadonlyKeyword`](../type-aliases/ReadonlyKeyword.md) \| [`PlusToken`](../type-aliases/PlusToken.md) \| [`MinusToken`](../type-aliases/MinusToken.md)

• **typeParameter**: [`TypeParameterDeclaration`](TypeParameterDeclaration.md)

• **nameType**: `undefined` \| [`TypeNode`](TypeNode.md)

• **questionToken**: `undefined` \| [`QuestionToken`](../type-aliases/QuestionToken.md) \| [`PlusToken`](../type-aliases/PlusToken.md) \| [`MinusToken`](../type-aliases/MinusToken.md)

• **type**: `undefined` \| [`TypeNode`](TypeNode.md)

• **members**: `undefined` \| [`NodeArray`](NodeArray.md)\<[`TypeElement`](TypeElement.md)\>

#### Returns

[`MappedTypeNode`](MappedTypeNode.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7509

***

### updateMetaProperty()

```ts
updateMetaProperty(node, name): MetaProperty
```

#### Parameters

• **node**: [`MetaProperty`](MetaProperty.md)

• **name**: [`Identifier`](Identifier.md)

#### Returns

[`MetaProperty`](MetaProperty.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7591

***

### updateMethodDeclaration()

```ts
updateMethodDeclaration(
   node, 
   modifiers, 
   asteriskToken, 
   name, 
   questionToken, 
   typeParameters, 
   parameters, 
   type, 
   body): MethodDeclaration
```

#### Parameters

• **node**: [`MethodDeclaration`](MethodDeclaration.md)

• **modifiers**: `undefined` \| readonly [`ModifierLike`](../type-aliases/ModifierLike.md)[]

• **asteriskToken**: `undefined` \| [`AsteriskToken`](../type-aliases/AsteriskToken.md)

• **name**: [`PropertyName`](../type-aliases/PropertyName.md)

• **questionToken**: `undefined` \| [`QuestionToken`](../type-aliases/QuestionToken.md)

• **typeParameters**: `undefined` \| readonly [`TypeParameterDeclaration`](TypeParameterDeclaration.md)[]

• **parameters**: readonly [`ParameterDeclaration`](ParameterDeclaration.md)[]

• **type**: `undefined` \| [`TypeNode`](TypeNode.md)

• **body**: `undefined` \| [`Block`](Block.md)

#### Returns

[`MethodDeclaration`](MethodDeclaration.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7451

***

### updateMethodSignature()

```ts
updateMethodSignature(
   node, 
   modifiers, 
   name, 
   questionToken, 
   typeParameters, 
   parameters, 
   type): MethodSignature
```

#### Parameters

• **node**: [`MethodSignature`](MethodSignature.md)

• **modifiers**: `undefined` \| readonly [`Modifier`](../type-aliases/Modifier.md)[]

• **name**: [`PropertyName`](../type-aliases/PropertyName.md)

• **questionToken**: `undefined` \| [`QuestionToken`](../type-aliases/QuestionToken.md)

• **typeParameters**: `undefined` \| [`NodeArray`](NodeArray.md)\<[`TypeParameterDeclaration`](TypeParameterDeclaration.md)\>

• **parameters**: [`NodeArray`](NodeArray.md)\<[`ParameterDeclaration`](ParameterDeclaration.md)\>

• **type**: `undefined` \| [`TypeNode`](TypeNode.md)

#### Returns

[`MethodSignature`](MethodSignature.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7449

***

### updateModuleBlock()

```ts
updateModuleBlock(node, statements): ModuleBlock
```

#### Parameters

• **node**: [`ModuleBlock`](ModuleBlock.md)

• **statements**: readonly [`Statement`](Statement.md)[]

#### Returns

[`ModuleBlock`](ModuleBlock.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7650

***

### updateModuleDeclaration()

```ts
updateModuleDeclaration(
   node, 
   modifiers, 
   name, 
   body): ModuleDeclaration
```

#### Parameters

• **node**: [`ModuleDeclaration`](ModuleDeclaration.md)

• **modifiers**: `undefined` \| readonly [`ModifierLike`](../type-aliases/ModifierLike.md)[]

• **name**: [`ModuleName`](../type-aliases/ModuleName.md)

• **body**: `undefined` \| [`ModuleBody`](../type-aliases/ModuleBody.md)

#### Returns

[`ModuleDeclaration`](ModuleDeclaration.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7648

***

### updateNamedExports()

```ts
updateNamedExports(node, elements): NamedExports
```

#### Parameters

• **node**: [`NamedExports`](NamedExports.md)

• **elements**: readonly [`ExportSpecifier`](ExportSpecifier.md)[]

#### Returns

[`NamedExports`](NamedExports.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7684

***

### updateNamedImports()

```ts
updateNamedImports(node, elements): NamedImports
```

#### Parameters

• **node**: [`NamedImports`](NamedImports.md)

• **elements**: readonly [`ImportSpecifier`](ImportSpecifier.md)[]

#### Returns

[`NamedImports`](NamedImports.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7676

***

### updateNamedTupleMember()

```ts
updateNamedTupleMember(
   node, 
   dotDotDotToken, 
   name, 
   questionToken, 
   type): NamedTupleMember
```

#### Parameters

• **node**: [`NamedTupleMember`](NamedTupleMember.md)

• **dotDotDotToken**: `undefined` \| [`DotDotDotToken`](../type-aliases/DotDotDotToken.md)

• **name**: [`Identifier`](Identifier.md)

• **questionToken**: `undefined` \| [`QuestionToken`](../type-aliases/QuestionToken.md)

• **type**: [`TypeNode`](TypeNode.md)

#### Returns

[`NamedTupleMember`](NamedTupleMember.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7486

***

### updateNamespaceExport()

```ts
updateNamespaceExport(node, name): NamespaceExport
```

#### Parameters

• **node**: [`NamespaceExport`](NamespaceExport.md)

• **name**: [`ModuleExportName`](../type-aliases/ModuleExportName.md)

#### Returns

[`NamespaceExport`](NamespaceExport.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7674

***

### updateNamespaceExportDeclaration()

```ts
updateNamespaceExportDeclaration(node, name): NamespaceExportDeclaration
```

#### Parameters

• **node**: [`NamespaceExportDeclaration`](NamespaceExportDeclaration.md)

• **name**: [`Identifier`](Identifier.md)

#### Returns

[`NamespaceExportDeclaration`](NamespaceExportDeclaration.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7654

***

### updateNamespaceImport()

```ts
updateNamespaceImport(node, name): NamespaceImport
```

#### Parameters

• **node**: [`NamespaceImport`](NamespaceImport.md)

• **name**: [`Identifier`](Identifier.md)

#### Returns

[`NamespaceImport`](NamespaceImport.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7672

***

### updateNewExpression()

```ts
updateNewExpression(
   node, 
   expression, 
   typeArguments, 
   argumentsArray): NewExpression
```

#### Parameters

• **node**: [`NewExpression`](NewExpression.md)

• **expression**: [`Expression`](Expression.md)

• **typeArguments**: `undefined` \| readonly [`TypeNode`](TypeNode.md)[]

• **argumentsArray**: `undefined` \| readonly [`Expression`](Expression.md)[]

#### Returns

[`NewExpression`](NewExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7537

***

### updateNonNullChain()

```ts
updateNonNullChain(node, expression): NonNullChain
```

#### Parameters

• **node**: [`NonNullChain`](NonNullChain.md)

• **expression**: [`Expression`](Expression.md)

#### Returns

[`NonNullChain`](NonNullChain.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7589

***

### updateNonNullExpression()

```ts
updateNonNullExpression(node, expression): NonNullExpression
```

#### Parameters

• **node**: [`NonNullExpression`](NonNullExpression.md)

• **expression**: [`Expression`](Expression.md)

#### Returns

[`NonNullExpression`](NonNullExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7587

***

### updateObjectBindingPattern()

```ts
updateObjectBindingPattern(node, elements): ObjectBindingPattern
```

#### Parameters

• **node**: [`ObjectBindingPattern`](ObjectBindingPattern.md)

• **elements**: readonly [`BindingElement`](BindingElement.md)[]

#### Returns

[`ObjectBindingPattern`](ObjectBindingPattern.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7515

***

### updateObjectLiteralExpression()

```ts
updateObjectLiteralExpression(node, properties): ObjectLiteralExpression
```

#### Parameters

• **node**: [`ObjectLiteralExpression`](ObjectLiteralExpression.md)

• **properties**: readonly [`ObjectLiteralElementLike`](../type-aliases/ObjectLiteralElementLike.md)[]

#### Returns

[`ObjectLiteralExpression`](ObjectLiteralExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7523

***

### updateOptionalTypeNode()

```ts
updateOptionalTypeNode(node, type): OptionalTypeNode
```

#### Parameters

• **node**: [`OptionalTypeNode`](OptionalTypeNode.md)

• **type**: [`TypeNode`](TypeNode.md)

#### Returns

[`OptionalTypeNode`](OptionalTypeNode.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7488

***

### updateParameterDeclaration()

```ts
updateParameterDeclaration(
   node, 
   modifiers, 
   dotDotDotToken, 
   name, 
   questionToken, 
   type, 
   initializer): ParameterDeclaration
```

#### Parameters

• **node**: [`ParameterDeclaration`](ParameterDeclaration.md)

• **modifiers**: `undefined` \| readonly [`ModifierLike`](../type-aliases/ModifierLike.md)[]

• **dotDotDotToken**: `undefined` \| [`DotDotDotToken`](../type-aliases/DotDotDotToken.md)

• **name**: `string` \| [`BindingName`](../type-aliases/BindingName.md)

• **questionToken**: `undefined` \| [`QuestionToken`](../type-aliases/QuestionToken.md)

• **type**: `undefined` \| [`TypeNode`](TypeNode.md)

• **initializer**: `undefined` \| [`Expression`](Expression.md)

#### Returns

[`ParameterDeclaration`](ParameterDeclaration.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7441

***

### updateParenthesizedExpression()

```ts
updateParenthesizedExpression(node, expression): ParenthesizedExpression
```

#### Parameters

• **node**: [`ParenthesizedExpression`](ParenthesizedExpression.md)

• **expression**: [`Expression`](Expression.md)

#### Returns

[`ParenthesizedExpression`](ParenthesizedExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7543

***

### updateParenthesizedType()

```ts
updateParenthesizedType(node, type): ParenthesizedTypeNode
```

#### Parameters

• **node**: [`ParenthesizedTypeNode`](ParenthesizedTypeNode.md)

• **type**: [`TypeNode`](TypeNode.md)

#### Returns

[`ParenthesizedTypeNode`](ParenthesizedTypeNode.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7502

***

### updatePartiallyEmittedExpression()

```ts
updatePartiallyEmittedExpression(node, expression): PartiallyEmittedExpression
```

#### Parameters

• **node**: [`PartiallyEmittedExpression`](PartiallyEmittedExpression.md)

• **expression**: [`Expression`](Expression.md)

#### Returns

[`PartiallyEmittedExpression`](PartiallyEmittedExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7817

***

### updatePostfixUnaryExpression()

```ts
updatePostfixUnaryExpression(node, operand): PostfixUnaryExpression
```

#### Parameters

• **node**: [`PostfixUnaryExpression`](PostfixUnaryExpression.md)

• **operand**: [`Expression`](Expression.md)

#### Returns

[`PostfixUnaryExpression`](PostfixUnaryExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7559

***

### updatePrefixUnaryExpression()

```ts
updatePrefixUnaryExpression(node, operand): PrefixUnaryExpression
```

#### Parameters

• **node**: [`PrefixUnaryExpression`](PrefixUnaryExpression.md)

• **operand**: [`Expression`](Expression.md)

#### Returns

[`PrefixUnaryExpression`](PrefixUnaryExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7557

***

### updatePropertyAccessChain()

```ts
updatePropertyAccessChain(
   node, 
   expression, 
   questionDotToken, 
   name): PropertyAccessChain
```

#### Parameters

• **node**: [`PropertyAccessChain`](PropertyAccessChain.md)

• **expression**: [`Expression`](Expression.md)

• **questionDotToken**: `undefined` \| [`QuestionDotToken`](../type-aliases/QuestionDotToken.md)

• **name**: [`MemberName`](../type-aliases/MemberName.md)

#### Returns

[`PropertyAccessChain`](PropertyAccessChain.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7527

***

### updatePropertyAccessExpression()

```ts
updatePropertyAccessExpression(
   node, 
   expression, 
   name): PropertyAccessExpression
```

#### Parameters

• **node**: [`PropertyAccessExpression`](PropertyAccessExpression.md)

• **expression**: [`Expression`](Expression.md)

• **name**: [`MemberName`](../type-aliases/MemberName.md)

#### Returns

[`PropertyAccessExpression`](PropertyAccessExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7525

***

### updatePropertyAssignment()

```ts
updatePropertyAssignment(
   node, 
   name, 
   initializer): PropertyAssignment
```

#### Parameters

• **node**: [`PropertyAssignment`](PropertyAssignment.md)

• **name**: [`PropertyName`](../type-aliases/PropertyName.md)

• **initializer**: [`Expression`](Expression.md)

#### Returns

[`PropertyAssignment`](PropertyAssignment.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7806

***

### updatePropertyDeclaration()

```ts
updatePropertyDeclaration(
   node, 
   modifiers, 
   name, 
   questionOrExclamationToken, 
   type, 
   initializer): PropertyDeclaration
```

#### Parameters

• **node**: [`PropertyDeclaration`](PropertyDeclaration.md)

• **modifiers**: `undefined` \| readonly [`ModifierLike`](../type-aliases/ModifierLike.md)[]

• **name**: `string` \| [`PropertyName`](../type-aliases/PropertyName.md)

• **questionOrExclamationToken**: `undefined` \| [`QuestionToken`](../type-aliases/QuestionToken.md) \| [`ExclamationToken`](../type-aliases/ExclamationToken.md)

• **type**: `undefined` \| [`TypeNode`](TypeNode.md)

• **initializer**: `undefined` \| [`Expression`](Expression.md)

#### Returns

[`PropertyDeclaration`](PropertyDeclaration.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7447

***

### updatePropertySignature()

```ts
updatePropertySignature(
   node, 
   modifiers, 
   name, 
   questionToken, 
   type): PropertySignature
```

#### Parameters

• **node**: [`PropertySignature`](PropertySignature.md)

• **modifiers**: `undefined` \| readonly [`Modifier`](../type-aliases/Modifier.md)[]

• **name**: [`PropertyName`](../type-aliases/PropertyName.md)

• **questionToken**: `undefined` \| [`QuestionToken`](../type-aliases/QuestionToken.md)

• **type**: `undefined` \| [`TypeNode`](TypeNode.md)

#### Returns

[`PropertySignature`](PropertySignature.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7445

***

### updateQualifiedName()

```ts
updateQualifiedName(
   node, 
   left, 
   right): QualifiedName
```

#### Parameters

• **node**: [`QualifiedName`](QualifiedName.md)

• **left**: [`EntityName`](../type-aliases/EntityName.md)

• **right**: [`Identifier`](Identifier.md)

#### Returns

[`QualifiedName`](QualifiedName.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7435

***

### updateRestTypeNode()

```ts
updateRestTypeNode(node, type): RestTypeNode
```

#### Parameters

• **node**: [`RestTypeNode`](RestTypeNode.md)

• **type**: [`TypeNode`](TypeNode.md)

#### Returns

[`RestTypeNode`](RestTypeNode.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7490

***

### updateReturnStatement()

```ts
updateReturnStatement(node, expression): ReturnStatement
```

#### Parameters

• **node**: [`ReturnStatement`](ReturnStatement.md)

• **expression**: `undefined` \| [`Expression`](Expression.md)

#### Returns

[`ReturnStatement`](ReturnStatement.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7621

***

### updateSatisfiesExpression()

```ts
updateSatisfiesExpression(
   node, 
   expression, 
   type): SatisfiesExpression
```

#### Parameters

• **node**: [`SatisfiesExpression`](SatisfiesExpression.md)

• **expression**: [`Expression`](Expression.md)

• **type**: [`TypeNode`](TypeNode.md)

#### Returns

[`SatisfiesExpression`](SatisfiesExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7593

***

### updateSetAccessorDeclaration()

```ts
updateSetAccessorDeclaration(
   node, 
   modifiers, 
   name, 
   parameters, 
   body): SetAccessorDeclaration
```

#### Parameters

• **node**: [`SetAccessorDeclaration`](SetAccessorDeclaration.md)

• **modifiers**: `undefined` \| readonly [`ModifierLike`](../type-aliases/ModifierLike.md)[]

• **name**: [`PropertyName`](../type-aliases/PropertyName.md)

• **parameters**: readonly [`ParameterDeclaration`](ParameterDeclaration.md)[]

• **body**: `undefined` \| [`Block`](Block.md)

#### Returns

[`SetAccessorDeclaration`](SetAccessorDeclaration.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7457

***

### updateShorthandPropertyAssignment()

```ts
updateShorthandPropertyAssignment(
   node, 
   name, 
   objectAssignmentInitializer): ShorthandPropertyAssignment
```

#### Parameters

• **node**: [`ShorthandPropertyAssignment`](ShorthandPropertyAssignment.md)

• **name**: [`Identifier`](Identifier.md)

• **objectAssignmentInitializer**: `undefined` \| [`Expression`](Expression.md)

#### Returns

[`ShorthandPropertyAssignment`](ShorthandPropertyAssignment.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7808

***

### updateSourceFile()

```ts
updateSourceFile(
   node, 
   statements, 
   isDeclarationFile?, 
   referencedFiles?, 
   typeReferences?, 
   hasNoDefaultLib?, 
   libReferences?): SourceFile
```

#### Parameters

• **node**: [`SourceFile`](SourceFile.md)

• **statements**: readonly [`Statement`](Statement.md)[]

• **isDeclarationFile?**: `boolean`

• **referencedFiles?**: readonly [`FileReference`](FileReference.md)[]

• **typeReferences?**: readonly [`FileReference`](FileReference.md)[]

• **hasNoDefaultLib?**: `boolean`

• **libReferences?**: readonly [`FileReference`](FileReference.md)[]

#### Returns

[`SourceFile`](SourceFile.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7814

***

### updateSpreadAssignment()

```ts
updateSpreadAssignment(node, expression): SpreadAssignment
```

#### Parameters

• **node**: [`SpreadAssignment`](SpreadAssignment.md)

• **expression**: [`Expression`](Expression.md)

#### Returns

[`SpreadAssignment`](SpreadAssignment.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7810

***

### updateSpreadElement()

```ts
updateSpreadElement(node, expression): SpreadElement
```

#### Parameters

• **node**: [`SpreadElement`](SpreadElement.md)

• **expression**: [`Expression`](Expression.md)

#### Returns

[`SpreadElement`](SpreadElement.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7578

***

### updateSwitchStatement()

```ts
updateSwitchStatement(
   node, 
   expression, 
   caseBlock): SwitchStatement
```

#### Parameters

• **node**: [`SwitchStatement`](SwitchStatement.md)

• **expression**: [`Expression`](Expression.md)

• **caseBlock**: [`CaseBlock`](CaseBlock.md)

#### Returns

[`SwitchStatement`](SwitchStatement.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7625

***

### updateTaggedTemplateExpression()

```ts
updateTaggedTemplateExpression(
   node, 
   tag, 
   typeArguments, 
   template): TaggedTemplateExpression
```

#### Parameters

• **node**: [`TaggedTemplateExpression`](TaggedTemplateExpression.md)

• **tag**: [`Expression`](Expression.md)

• **typeArguments**: `undefined` \| readonly [`TypeNode`](TypeNode.md)[]

• **template**: [`TemplateLiteral`](../type-aliases/TemplateLiteral.md)

#### Returns

[`TaggedTemplateExpression`](TaggedTemplateExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7539

***

### updateTemplateExpression()

```ts
updateTemplateExpression(
   node, 
   head, 
   templateSpans): TemplateExpression
```

#### Parameters

• **node**: [`TemplateExpression`](TemplateExpression.md)

• **head**: [`TemplateHead`](TemplateHead.md)

• **templateSpans**: readonly [`TemplateSpan`](TemplateSpan.md)[]

#### Returns

[`TemplateExpression`](TemplateExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7565

***

### updateTemplateLiteralType()

```ts
updateTemplateLiteralType(
   node, 
   head, 
   templateSpans): TemplateLiteralTypeNode
```

#### Parameters

• **node**: [`TemplateLiteralTypeNode`](TemplateLiteralTypeNode.md)

• **head**: [`TemplateHead`](TemplateHead.md)

• **templateSpans**: readonly [`TemplateLiteralTypeSpan`](TemplateLiteralTypeSpan.md)[]

#### Returns

[`TemplateLiteralTypeNode`](TemplateLiteralTypeNode.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7513

***

### updateTemplateLiteralTypeSpan()

```ts
updateTemplateLiteralTypeSpan(
   node, 
   type, 
   literal): TemplateLiteralTypeSpan
```

#### Parameters

• **node**: [`TemplateLiteralTypeSpan`](TemplateLiteralTypeSpan.md)

• **type**: [`TypeNode`](TypeNode.md)

• **literal**: [`TemplateMiddle`](TemplateMiddle.md) \| [`TemplateTail`](TemplateTail.md)

#### Returns

[`TemplateLiteralTypeSpan`](TemplateLiteralTypeSpan.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7465

***

### updateTemplateSpan()

```ts
updateTemplateSpan(
   node, 
   expression, 
   literal): TemplateSpan
```

#### Parameters

• **node**: [`TemplateSpan`](TemplateSpan.md)

• **expression**: [`Expression`](Expression.md)

• **literal**: [`TemplateMiddle`](TemplateMiddle.md) \| [`TemplateTail`](TemplateTail.md)

#### Returns

[`TemplateSpan`](TemplateSpan.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7595

***

### updateThrowStatement()

```ts
updateThrowStatement(node, expression): ThrowStatement
```

#### Parameters

• **node**: [`ThrowStatement`](ThrowStatement.md)

• **expression**: [`Expression`](Expression.md)

#### Returns

[`ThrowStatement`](ThrowStatement.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7629

***

### updateTryStatement()

```ts
updateTryStatement(
   node, 
   tryBlock, 
   catchClause, 
   finallyBlock): TryStatement
```

#### Parameters

• **node**: [`TryStatement`](TryStatement.md)

• **tryBlock**: [`Block`](Block.md)

• **catchClause**: `undefined` \| [`CatchClause`](CatchClause.md)

• **finallyBlock**: `undefined` \| [`Block`](Block.md)

#### Returns

[`TryStatement`](TryStatement.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7631

***

### updateTupleTypeNode()

```ts
updateTupleTypeNode(node, elements): TupleTypeNode
```

#### Parameters

• **node**: [`TupleTypeNode`](TupleTypeNode.md)

• **elements**: readonly ([`TypeNode`](TypeNode.md) \| [`NamedTupleMember`](NamedTupleMember.md))[]

#### Returns

[`TupleTypeNode`](TupleTypeNode.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7484

***

### updateTypeAliasDeclaration()

```ts
updateTypeAliasDeclaration(
   node, 
   modifiers, 
   name, 
   typeParameters, 
   type): TypeAliasDeclaration
```

#### Parameters

• **node**: [`TypeAliasDeclaration`](TypeAliasDeclaration.md)

• **modifiers**: `undefined` \| readonly [`ModifierLike`](../type-aliases/ModifierLike.md)[]

• **name**: [`Identifier`](Identifier.md)

• **typeParameters**: `undefined` \| readonly [`TypeParameterDeclaration`](TypeParameterDeclaration.md)[]

• **type**: [`TypeNode`](TypeNode.md)

#### Returns

[`TypeAliasDeclaration`](TypeAliasDeclaration.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7644

***

### updateTypeAssertion()

```ts
updateTypeAssertion(
   node, 
   type, 
   expression): TypeAssertion
```

#### Parameters

• **node**: [`TypeAssertion`](TypeAssertion.md)

• **type**: [`TypeNode`](TypeNode.md)

• **expression**: [`Expression`](Expression.md)

#### Returns

[`TypeAssertion`](TypeAssertion.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7541

***

### updateTypeLiteralNode()

```ts
updateTypeLiteralNode(node, members): TypeLiteralNode
```

#### Parameters

• **node**: [`TypeLiteralNode`](TypeLiteralNode.md)

• **members**: [`NodeArray`](NodeArray.md)\<[`TypeElement`](TypeElement.md)\>

#### Returns

[`TypeLiteralNode`](TypeLiteralNode.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7480

***

### updateTypeOfExpression()

```ts
updateTypeOfExpression(node, expression): TypeOfExpression
```

#### Parameters

• **node**: [`TypeOfExpression`](TypeOfExpression.md)

• **expression**: [`Expression`](Expression.md)

#### Returns

[`TypeOfExpression`](TypeOfExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7551

***

### updateTypeOperatorNode()

```ts
updateTypeOperatorNode(node, type): TypeOperatorNode
```

#### Parameters

• **node**: [`TypeOperatorNode`](TypeOperatorNode.md)

• **type**: [`TypeNode`](TypeNode.md)

#### Returns

[`TypeOperatorNode`](TypeOperatorNode.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7505

***

### updateTypeParameterDeclaration()

```ts
updateTypeParameterDeclaration(
   node, 
   modifiers, 
   name, 
   constraint, 
   defaultType): TypeParameterDeclaration
```

#### Parameters

• **node**: [`TypeParameterDeclaration`](TypeParameterDeclaration.md)

• **modifiers**: `undefined` \| readonly [`Modifier`](../type-aliases/Modifier.md)[]

• **name**: [`Identifier`](Identifier.md)

• **constraint**: `undefined` \| [`TypeNode`](TypeNode.md)

• **defaultType**: `undefined` \| [`TypeNode`](TypeNode.md)

#### Returns

[`TypeParameterDeclaration`](TypeParameterDeclaration.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7439

***

### updateTypePredicateNode()

```ts
updateTypePredicateNode(
   node, 
   assertsModifier, 
   parameterName, 
   type): TypePredicateNode
```

#### Parameters

• **node**: [`TypePredicateNode`](TypePredicateNode.md)

• **assertsModifier**: `undefined` \| [`AssertsKeyword`](../type-aliases/AssertsKeyword.md)

• **parameterName**: [`Identifier`](Identifier.md) \| [`ThisTypeNode`](ThisTypeNode.md)

• **type**: `undefined` \| [`TypeNode`](TypeNode.md)

#### Returns

[`TypePredicateNode`](TypePredicateNode.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7470

***

### updateTypeQueryNode()

```ts
updateTypeQueryNode(
   node, 
   exprName, 
   typeArguments?): TypeQueryNode
```

#### Parameters

• **node**: [`TypeQueryNode`](TypeQueryNode.md)

• **exprName**: [`EntityName`](../type-aliases/EntityName.md)

• **typeArguments?**: readonly [`TypeNode`](TypeNode.md)[]

#### Returns

[`TypeQueryNode`](TypeQueryNode.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7478

***

### updateTypeReferenceNode()

```ts
updateTypeReferenceNode(
   node, 
   typeName, 
   typeArguments): TypeReferenceNode
```

#### Parameters

• **node**: [`TypeReferenceNode`](TypeReferenceNode.md)

• **typeName**: [`EntityName`](../type-aliases/EntityName.md)

• **typeArguments**: `undefined` \| [`NodeArray`](NodeArray.md)\<[`TypeNode`](TypeNode.md)\>

#### Returns

[`TypeReferenceNode`](TypeReferenceNode.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7472

***

### updateUnionTypeNode()

```ts
updateUnionTypeNode(node, types): UnionTypeNode
```

#### Parameters

• **node**: [`UnionTypeNode`](UnionTypeNode.md)

• **types**: [`NodeArray`](NodeArray.md)\<[`TypeNode`](TypeNode.md)\>

#### Returns

[`UnionTypeNode`](UnionTypeNode.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7492

***

### updateVariableDeclaration()

```ts
updateVariableDeclaration(
   node, 
   name, 
   exclamationToken, 
   type, 
   initializer): VariableDeclaration
```

#### Parameters

• **node**: [`VariableDeclaration`](VariableDeclaration.md)

• **name**: [`BindingName`](../type-aliases/BindingName.md)

• **exclamationToken**: `undefined` \| [`ExclamationToken`](../type-aliases/ExclamationToken.md)

• **type**: `undefined` \| [`TypeNode`](TypeNode.md)

• **initializer**: `undefined` \| [`Expression`](Expression.md)

#### Returns

[`VariableDeclaration`](VariableDeclaration.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7634

***

### updateVariableDeclarationList()

```ts
updateVariableDeclarationList(node, declarations): VariableDeclarationList
```

#### Parameters

• **node**: [`VariableDeclarationList`](VariableDeclarationList.md)

• **declarations**: readonly [`VariableDeclaration`](VariableDeclaration.md)[]

#### Returns

[`VariableDeclarationList`](VariableDeclarationList.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7636

***

### updateVariableStatement()

```ts
updateVariableStatement(
   node, 
   modifiers, 
   declarationList): VariableStatement
```

#### Parameters

• **node**: [`VariableStatement`](VariableStatement.md)

• **modifiers**: `undefined` \| readonly [`ModifierLike`](../type-aliases/ModifierLike.md)[]

• **declarationList**: [`VariableDeclarationList`](VariableDeclarationList.md)

#### Returns

[`VariableStatement`](VariableStatement.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7600

***

### updateVoidExpression()

```ts
updateVoidExpression(node, expression): VoidExpression
```

#### Parameters

• **node**: [`VoidExpression`](VoidExpression.md)

• **expression**: [`Expression`](Expression.md)

#### Returns

[`VoidExpression`](VoidExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7553

***

### updateWhileStatement()

```ts
updateWhileStatement(
   node, 
   expression, 
   statement): WhileStatement
```

#### Parameters

• **node**: [`WhileStatement`](WhileStatement.md)

• **expression**: [`Expression`](Expression.md)

• **statement**: [`Statement`](Statement.md)

#### Returns

[`WhileStatement`](WhileStatement.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7609

***

### updateWithStatement()

```ts
updateWithStatement(
   node, 
   expression, 
   statement): WithStatement
```

#### Parameters

• **node**: [`WithStatement`](WithStatement.md)

• **expression**: [`Expression`](Expression.md)

• **statement**: [`Statement`](Statement.md)

#### Returns

[`WithStatement`](WithStatement.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7623

***

### updateYieldExpression()

```ts
updateYieldExpression(
   node, 
   asteriskToken, 
   expression): YieldExpression
```

#### Parameters

• **node**: [`YieldExpression`](YieldExpression.md)

• **asteriskToken**: `undefined` \| [`AsteriskToken`](../type-aliases/AsteriskToken.md)

• **expression**: `undefined` \| [`Expression`](Expression.md)

#### Returns

[`YieldExpression`](YieldExpression.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7576
