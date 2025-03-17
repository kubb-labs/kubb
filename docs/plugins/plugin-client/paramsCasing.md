How to style your params, by default no casing is applied.

|           |                |
|----------:|:---------------|
|     Type: | `'camelcase'`  |
| Required: | `false`        |
|  Default: | ``             |

- `'camelcase'` will use camelcase for the params names

::: code-group
```typescript ['camelcase']
export async function deletePet(
  petId: DeletePetPathParams['pet_id'],
  headers?: DeletePetHeaderParams,
  config: Partial<RequestConfig> = {}
){
...
}
```

```typescript ['']
export async function deletePet(
  pet_id: DeletePetPathParams['pet_id'],
  headers?: DeletePetHeaderParams,
  config: Partial<RequestConfig> = {}
){
 ...
}
```
:::
