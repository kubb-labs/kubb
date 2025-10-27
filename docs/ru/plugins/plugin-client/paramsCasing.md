как стилизовать ваши параметры, по умолчанию регистр не применяется.

|           |                |
|----------:|:---------------|
|     Type: | `'camelcase'`  |
| Required: | `false`        |
|  Default: | ``             |

- `'camelcase'` будет использовать camelcase для имен параметров

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
