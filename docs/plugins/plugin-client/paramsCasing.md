Transform parameter names to a specific casing format for path, query, and header parameters in generated client code.

> [!IMPORTANT]
> When using `paramsCasing`, ensure that `@kubb/plugin-ts` also has the same `paramsCasing` setting. This option automatically maps transformed parameter names back to their original API names in HTTP requests.

|           |                |
|----------:|:---------------|
|     Type: | `'camelcase'`  |
| Required: | `false`        |
|  Default: | `undefined`    |

- `'camelcase'` transforms parameter names to camelCase

::: code-group
```typescript [With paramsCasing: 'camelcase']
// Function parameters use camelCase
export async function deletePet(
  petId: DeletePetPathParams['petId'],  // ✓ camelCase
  headers?: DeletePetHeaderParams,
  config: Partial<RequestConfig> = {}
) {
  // Automatically maps back to original name for the API
  const pet_id = petId
  
  return fetch({
    method: 'DELETE',
    url: `/pet/${pet_id}`,  // Uses original API parameter name
    ...
  })
}
```

```typescript [Without paramsCasing]
// Parameters use original API naming
export async function deletePet(
  pet_id: DeletePetPathParams['pet_id'],  // Original naming
  headers?: DeletePetHeaderParams,
  config: Partial<RequestConfig> = {}
) {
  return fetch({
    method: 'DELETE',
    url: `/pet/${pet_id}`,
    ...
  })
}
```
:::

> [!TIP]
> The client automatically generates mapping code to convert camelCase parameter names back to the original API format. You write code with developer-friendly camelCase names, but HTTP requests use the exact parameter names from your OpenAPI specification.
