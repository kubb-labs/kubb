[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [factory](../index.md) / keywordTypeNodes

# keywordTypeNodes

```ts
const keywordTypeNodes: object;
```

## Type declaration

### any

```ts
readonly any: KeywordTypeNode<AnyKeyword>;
```

### boolean

```ts
readonly boolean: KeywordTypeNode<BooleanKeyword>;
```

### integer

```ts
readonly integer: KeywordTypeNode<NumberKeyword>;
```

### null

```ts
readonly null: LiteralTypeNode;
```

### number

```ts
readonly number: KeywordTypeNode<NumberKeyword>;
```

### object

```ts
readonly object: KeywordTypeNode<ObjectKeyword>;
```

### string

```ts
readonly string: KeywordTypeNode<StringKeyword>;
```

### undefined

```ts
readonly undefined: KeywordTypeNode<UndefinedKeyword>;
```

### unknown

```ts
readonly unknown: KeywordTypeNode<UnknownKeyword>;
```

## Defined in

[packages/parser-ts/src/factory.ts:531](https://github.com/kubb-project/kubb/blob/ff80665146ae086e044807d0072fda660e72e1fd/packages/parser-ts/src/factory.ts#L531)
