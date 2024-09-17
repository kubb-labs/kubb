[API](../../../packages.md) / [@kubb/core](../index.md) / FileManager

# FileManager

## Constructors

### new FileManager()

```ts
new FileManager(): FileManager
```

#### Returns

[`FileManager`](FileManager.md)

#### Defined in

[FileManager.ts:52](https://github.com/kubb-project/kubb/blob/41d5fcbd23d143293d72542efcb650e62fa3a210/packages/core/src/FileManager.ts#L52)

## Accessors

### files

```ts
get files(): ResolvedFile[]
```

#### Returns

`ResolvedFile`[]

#### Defined in

[FileManager.ts:56](https://github.com/kubb-project/kubb/blob/41d5fcbd23d143293d72542efcb650e62fa3a210/packages/core/src/FileManager.ts#L56)

***

### groupedFiles

```ts
get groupedFiles(): null | DirectoryTree
```

#### Returns

`null` \| `DirectoryTree`

#### Defined in

[FileManager.ts:73](https://github.com/kubb-project/kubb/blob/41d5fcbd23d143293d72542efcb650e62fa3a210/packages/core/src/FileManager.ts#L73)

***

### orderedFiles

```ts
get orderedFiles(): ResolvedFile[]
```

#### Returns

`ResolvedFile`[]

#### Defined in

[FileManager.ts:60](https://github.com/kubb-project/kubb/blob/41d5fcbd23d143293d72542efcb650e62fa3a210/packages/core/src/FileManager.ts#L60)

***

### treeNode

```ts
get treeNode(): null | TreeNode
```

#### Returns

`null` \| `TreeNode`

#### Defined in

[FileManager.ts:77](https://github.com/kubb-project/kubb/blob/41d5fcbd23d143293d72542efcb650e62fa3a210/packages/core/src/FileManager.ts#L77)

## Methods

### add()

```ts
add<T>(...files): AddResult<T>
```

#### Type Parameters

• **T** *extends* `File`[] = `File`[]

#### Parameters

• ...**files**: `T`

#### Returns

`AddResult`\<`T`\>

#### Defined in

[FileManager.ts:81](https://github.com/kubb-project/kubb/blob/41d5fcbd23d143293d72542efcb650e62fa3a210/packages/core/src/FileManager.ts#L81)

***

### clear()

```ts
clear(): void
```

#### Returns

`void`

#### Defined in

[FileManager.ts:107](https://github.com/kubb-project/kubb/blob/41d5fcbd23d143293d72542efcb650e62fa3a210/packages/core/src/FileManager.ts#L107)

***

### deleteByPath()

```ts
deleteByPath(path): void
```

#### Parameters

• **path**: `string`

#### Returns

`void`

#### Defined in

[FileManager.ts:130](https://github.com/kubb-project/kubb/blob/41d5fcbd23d143293d72542efcb650e62fa3a210/packages/core/src/FileManager.ts#L130)

***

### getBarrelFiles()

```ts
getBarrelFiles(__namedParameters): Promise<File[]>
```

#### Parameters

• **\_\_namedParameters**: `AddIndexesProps`

#### Returns

`Promise`\<`File`[]\>

#### Defined in

[FileManager.ts:139](https://github.com/kubb-project/kubb/blob/41d5fcbd23d143293d72542efcb650e62fa3a210/packages/core/src/FileManager.ts#L139)

***

### getByPath()

```ts
getByPath(path): undefined | ResolvedFile
```

#### Parameters

• **path**: `string`

#### Returns

`undefined` \| `ResolvedFile`

#### Defined in

[FileManager.ts:126](https://github.com/kubb-project/kubb/blob/41d5fcbd23d143293d72542efcb650e62fa3a210/packages/core/src/FileManager.ts#L126)

***

### getCacheById()

```ts
getCacheById(id): undefined | File
```

#### Parameters

• **id**: `string`

#### Returns

`undefined` \| `File`

#### Defined in

[FileManager.ts:122](https://github.com/kubb-project/kubb/blob/41d5fcbd23d143293d72542efcb650e62fa3a210/packages/core/src/FileManager.ts#L122)

***

### read()

```ts
read(...params): Promise<string>
```

#### Parameters

• ...**params**: [`string`]

#### Returns

`Promise`\<`string`\>

#### Defined in

[FileManager.ts:183](https://github.com/kubb-project/kubb/blob/41d5fcbd23d143293d72542efcb650e62fa3a210/packages/core/src/FileManager.ts#L183)

***

### write()

```ts
write(...params): Promise<undefined | string>
```

#### Parameters

• ...**params**: [`string`, `string`, `Options`]

#### Returns

`Promise`\<`undefined` \| `string`\>

#### Defined in

[FileManager.ts:179](https://github.com/kubb-project/kubb/blob/41d5fcbd23d143293d72542efcb650e62fa3a210/packages/core/src/FileManager.ts#L179)

***

### getMode()

```ts
static getMode(path): Mode
```

#### Parameters

• **path**: `undefined` \| `null` \| `string`

#### Returns

`Mode`

#### Defined in

[FileManager.ts:188](https://github.com/kubb-project/kubb/blob/41d5fcbd23d143293d72542efcb650e62fa3a210/packages/core/src/FileManager.ts#L188)
