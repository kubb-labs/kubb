Which parser should be used before returning the data.

|           |                     |
|----------:|:--------------------|
|     Type: | `'client' \| 'zod'` |
| Required: | `false`             |
|  Default: | `'client'`          |

- `'zod'` will use `@kubb/plugin-zod` to parse the data.
- `'client'` will return without parsing the data.
