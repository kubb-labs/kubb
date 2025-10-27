как передавать ваши параметры. Здесь вы можете переключаться между параметрами в стиле объекта и встроенными параметрами.

|           |                        |
|----------:|:-----------------------|
|     Type: | `'object' \| 'inline'` |
| Required: | `false`                |
|  Default: | `'inline'`             |


> [!TIP]
> когда `paramsType` установлен в `'object'`, `pathParams` также будет установлен в `'object'`.

- `'object'` вернет params и pathParams как объект.
- `'inline'` вернет params как параметры, разделенные запятыми.

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
