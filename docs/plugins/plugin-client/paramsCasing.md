Casing style for parameter names. No casing is applied by default.

|           |                |
|----------:|:---------------|
|     Type: | `'camelcase'`  |
| Required: | `false`        |
|  Default: | ``             |

- `'camelcase'` uses camelCase for parameter names

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
