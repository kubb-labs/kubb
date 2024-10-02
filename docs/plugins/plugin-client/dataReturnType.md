ReturnType that will be used when calling the client.

|           |                    |
|----------:|:-------------------|
|     Type: | `'data' \| 'full'` |
| Required: | `false`            |
|  Default: | `'data'`           |


- `'data'` will return ResponseConfig[data].
- `'full'` will return ResponseConfig.

::: code-group
```typescript ['data']
export async function getPetById<TData>(
  petId: GetPetByIdPathParams,
): Promise<ResponseConfig<TData>["data"]> {
  ...
}
```

```typescript ['full']
export async function getPetById<TData>(
  petId: GetPetByIdPathParams,
): Promise<ResponseConfig<TData>> {
  ...
}
```
:::
