How to pass your pathParams.

|           |                        |
|----------:|:-----------------------|
|     Type: | `'object' \| 'inline'` |
| Required: | `false`                |
|  Default: | `'data'`                |


- `'object'` will return the pathParams as an object.
- `'inline'` will return the pathParams as comma separated params.

::: code-group
```typescript ['object']
export async function getPetById<TData>(
  { petId }: GetPetByIdPathParams,
): Promise<ResponseConfig<TData>> {
  ...
}
```

```typescript ['inline']
export async function getPetById<TData>(
  petId: GetPetByIdPathParams,
): Promise<ResponseConfig<TData>> {
  ...
}
```
:::
