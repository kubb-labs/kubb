How to pass your params.

|           |                        |
|----------:|:-----------------------|
|     Type: | `'object' \| 'inline'` |
| Required: | `false`                |
|  Default: | `'inline'`             |


> [!TIP]
> When `paramsType` is set to `'object'`, `pathParams` will also be set to `'object'`.

- `'object'` will return the params and pathParams as an object.
- `'inline'` will return the params as comma separated params.

::: code-group
```typescript ['object']
export async function deletePet(
  {
    petId,
    headers,
  }: {
    petId: DeletePetPathParams['petId']
    headers?: DeletePetHeaderParams
  },
  config: Partial<RequestConfig> = {},
) {
...
}
```

```typescript ['inline']
export async function deletePet(
  petId: DeletePetPathParams['petId'],
  headers?: DeletePetHeaderParams,
  config: Partial<RequestConfig> = {}
){
  ...
}
```
:::
