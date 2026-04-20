Defines how pathParams are passed to generated functions.

|           |                        |
|----------:|:-----------------------|
|     Type: | `'object' \| 'inline'` |
| Required: | `false`                |
|  Default: | `'inline'`                |


- `'object'` returns pathParams as an object.
- `'inline'` returns pathParams as comma-separated params.

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
