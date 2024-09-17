[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [factory](../index.md) / createEnumDeclaration

# createEnumDeclaration()

```ts
function createEnumDeclaration(__namedParameters): [Node | undefined, Node]
```

## Parameters

• **\_\_namedParameters**

• **\_\_namedParameters.enums**: [`string` \| `number`, `string` \| `number` \| `boolean`][]

• **\_\_namedParameters.name**: `string`

Enum name in camelCase.

• **\_\_namedParameters.type?**: 
  \| `"enum"`
  \| `"asConst"`
  \| `"asPascalConst"`
  \| `"constEnum"`
  \| `"literal"` = `'enum'`

**Default**

`'enum'`

• **\_\_namedParameters.typeName**: `string`

Enum name in PascalCase.

## Returns

[[`Node`](../../ts/interfaces/Node.md) \| `undefined`, [`Node`](../../ts/interfaces/Node.md)]

## Defined in

[packages/parser-ts/src/factory.ts:363](https://github.com/kubb-project/kubb/blob/41d5fcbd23d143293d72542efcb650e62fa3a210/packages/parser-ts/src/factory.ts#L363)
