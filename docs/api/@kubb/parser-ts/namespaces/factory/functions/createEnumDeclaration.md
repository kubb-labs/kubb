[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [factory](../index.md) / createEnumDeclaration

# createEnumDeclaration()

```ts
function createEnumDeclaration(__namedParameters): [ts.Node | undefined, ts.Node]
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

[`ts.Node` \| `undefined`, `ts.Node`]

## Defined in

[packages/parser-ts/src/factory.ts:363](https://github.com/kubb-project/kubb/blob/7f30045af96d8c89b6cda0a30f7535f095a0cb45/packages/parser-ts/src/factory.ts#L363)
