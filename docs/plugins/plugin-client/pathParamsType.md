How to pass your pathParams.

|           |                        |
|----------:|:-----------------------|
|     Type: | `'object' \| 'inline'` |
| Required: | `false`                |
|  Default: | `'inline'`                |


- `'object'` will return the pathParams as an object.
- `'inline'` will return the pathParams as comma separated params.

::: code-group
```typescript twoslash ['object']
export async function getPetById (
  { petId }: GetPetByIdPathParams,
) {
  ...
}
```

```typescript twoslash ['inline']
export async function getPetById(
  petId: GetPetByIdPathParams,
) {
  ...
}
```
:::
