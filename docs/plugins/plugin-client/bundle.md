Controls whether the HTTP client runtime is copied into the generated `.kubb` directory.

|           |           |
|----------:|:----------|
|     Type: | `boolean` |
| Required: | `false`   |
|  Default: | `false`   |

- `true` adds a `.kubb/fetch.ts` file containing the selected client template (fetch or axios). Generated clients remain self-contained.
- `false` keeps generated clients slim by importing the shared runtime from `@kubb/plugin-client/clients/{client}`.
- Override this behavior by providing a custom `client.importPath`.
