
Control whether the HTTP client runtime is copied into the generated `.kubb` directory.

|           |           |
|----------:|:----------|
|     Type: | `boolean` |
| Required: | `false`   |
|  Default: | `false`   |

- `true` will add a `.kubb/fetch.ts` file containing the selected client template (fetch or axios) so the generated clients stay self-contained.
- `false` keeps the generated clients slim by importing the shared runtime from `@kubb/plugin-client/clients/{client}`.
- You can still override the behaviour by providing a custom `client.importPath`.
