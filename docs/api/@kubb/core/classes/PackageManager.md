[API](../../../packages.md) / [@kubb/core](../index.md) / PackageManager

# PackageManager

## Constructors

### new PackageManager()

```ts
new PackageManager(workspace?): PackageManager
```

#### Parameters

• **workspace?**: `string`

#### Returns

[`PackageManager`](PackageManager.md)

#### Defined in

[PackageManager.ts:24](https://github.com/kubb-project/kubb/blob/ff80665146ae086e044807d0072fda660e72e1fd/packages/core/src/PackageManager.ts#L24)

## Accessors

### workspace

```ts
get workspace(): undefined | string
```

```ts
set workspace(workspace): void
```

#### Parameters

• **workspace**: `string`

#### Returns

`undefined` \| `string`

#### Defined in

[PackageManager.ts:36](https://github.com/kubb-project/kubb/blob/ff80665146ae086e044807d0072fda660e72e1fd/packages/core/src/PackageManager.ts#L36)

## Methods

### getLocation()

```ts
getLocation(path): string
```

#### Parameters

• **path**: `string`

#### Returns

`string`

#### Defined in

[PackageManager.ts:48](https://github.com/kubb-project/kubb/blob/ff80665146ae086e044807d0072fda660e72e1fd/packages/core/src/PackageManager.ts#L48)

***

### getPackageJSON()

```ts
getPackageJSON(): Promise<undefined | PackageJSON>
```

#### Returns

`Promise`\<`undefined` \| `PackageJSON`\>

#### Defined in

[PackageManager.ts:76](https://github.com/kubb-project/kubb/blob/ff80665146ae086e044807d0072fda660e72e1fd/packages/core/src/PackageManager.ts#L76)

***

### getPackageJSONSync()

```ts
getPackageJSONSync(): undefined | PackageJSON
```

#### Returns

`undefined` \| `PackageJSON`

#### Defined in

[PackageManager.ts:89](https://github.com/kubb-project/kubb/blob/ff80665146ae086e044807d0072fda660e72e1fd/packages/core/src/PackageManager.ts#L89)

***

### getVersion()

```ts
getVersion(dependency): Promise<undefined | string>
```

#### Parameters

• **dependency**: `string` \| `RegExp`

#### Returns

`Promise`\<`undefined` \| `string`\>

#### Defined in

[PackageManager.ts:121](https://github.com/kubb-project/kubb/blob/ff80665146ae086e044807d0072fda660e72e1fd/packages/core/src/PackageManager.ts#L121)

***

### getVersionSync()

```ts
getVersionSync(dependency): undefined | string
```

#### Parameters

• **dependency**: `string` \| `RegExp`

#### Returns

`undefined` \| `string`

#### Defined in

[PackageManager.ts:135](https://github.com/kubb-project/kubb/blob/ff80665146ae086e044807d0072fda660e72e1fd/packages/core/src/PackageManager.ts#L135)

***

### import()

```ts
import(path): Promise<any>
```

#### Parameters

• **path**: `string`

#### Returns

`Promise`\<`any`\>

#### Defined in

[PackageManager.ts:59](https://github.com/kubb-project/kubb/blob/ff80665146ae086e044807d0072fda660e72e1fd/packages/core/src/PackageManager.ts#L59)

***

### isValid()

```ts
isValid(dependency, version): Promise<boolean>
```

#### Parameters

• **dependency**: `string` \| `RegExp`

• **version**: `string`

#### Returns

`Promise`\<`boolean`\>

#### Defined in

[PackageManager.ts:149](https://github.com/kubb-project/kubb/blob/ff80665146ae086e044807d0072fda660e72e1fd/packages/core/src/PackageManager.ts#L149)

***

### isValidSync()

```ts
isValidSync(dependency, version): boolean
```

#### Parameters

• **dependency**: `string` \| `RegExp`

• **version**: `string`

#### Returns

`boolean`

#### Defined in

[PackageManager.ts:168](https://github.com/kubb-project/kubb/blob/ff80665146ae086e044807d0072fda660e72e1fd/packages/core/src/PackageManager.ts#L168)

***

### normalizeDirectory()

```ts
normalizeDirectory(directory): string
```

#### Parameters

• **directory**: `string`

#### Returns

`string`

#### Defined in

[PackageManager.ts:40](https://github.com/kubb-project/kubb/blob/ff80665146ae086e044807d0072fda660e72e1fd/packages/core/src/PackageManager.ts#L40)

***

### setVersion()

```ts
static setVersion(dependency, version): void
```

#### Parameters

• **dependency**: `string`

• **version**: `string`

#### Returns

`void`

#### Defined in

[PackageManager.ts:102](https://github.com/kubb-project/kubb/blob/ff80665146ae086e044807d0072fda660e72e1fd/packages/core/src/PackageManager.ts#L102)
