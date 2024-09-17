[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [factory](../index.md) / createImportDeclaration

# createImportDeclaration()

```ts
function createImportDeclaration(__namedParameters): ImportDeclaration
```

In { propertyName: string; name?: string } is `name` being used to make the type more unique when multiple same names are used.

## Parameters

• **\_\_namedParameters**

• **\_\_namedParameters.isNameSpace?**: `boolean` = `false`

• **\_\_namedParameters.isTypeOnly?**: `boolean` = `false`

• **\_\_namedParameters.name**: `string` \| (`string` \| `object`)[]

• **\_\_namedParameters.path**: `string`

## Returns

`ImportDeclaration`

## Example

```ts
`import { Pet as Cat } from './Pet'`
```

## Defined in

[packages/parser-ts/src/factory.ts:270](https://github.com/kubb-project/kubb/blob/ff80665146ae086e044807d0072fda660e72e1fd/packages/parser-ts/src/factory.ts#L270)
