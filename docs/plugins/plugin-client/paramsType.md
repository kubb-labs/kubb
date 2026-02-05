Defines how parameters are passed to generated functions. Switch between object-style parameters and inline parameters.

|           |                        |
|----------:|:-----------------------|
|     Type: | `'object' \| 'inline'` |
| Required: | `false`                |
|  Default: | `'inline'`             |


> [!TIP]
> When `paramsType` is set to `'object'`, `pathParams` will also be set to `'object'`.

- `'object'` returns params and pathParams as an object.
- `'inline'` returns params as comma-separated params.

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
