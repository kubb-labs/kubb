как передавать ваши pathParams.

|           |                        |
|----------:|:-----------------------|
|     Type: | `'object' \| 'inline'` |
| Required: | `false`                |
|  Default: | `'inline'`                |


- `'object'` вернет pathParams как объект.
- `'inline'` вернет pathParams как параметры, разделенные запятыми.

::: code-group
```typescript ['object']
export async function getPetById (
  { petId }: GetPetByIdPathParams,
) {
  ...
}
```

```typescript ['inline']
export async function getPetById(
  petId: GetPetByIdPathParams,
) {
  ...
}
```
:::
