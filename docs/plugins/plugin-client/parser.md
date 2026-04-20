Parser used before returning data.

|           |                     |
|----------:|:--------------------|
|     Type: | `'client' \| 'zod'` |
| Required: | `false`             |
|  Default: | `'client'`          |

- `'zod'` uses `@kubb/plugin-zod` to parse data.
- `'client'` returns data without parsing.
