Apply a compatibility naming preset to control how files and symbols are named.

- `'default'` — uses the Kubb v5 naming conventions.
- `'kubbV4'` — preserves the Kubb v4 naming conventions for backwards compatibility.

|           |                         |
| --------: | :---------------------- |
|     Type: | `'default' \| 'kubbV4'` |
| Required: | `false`                 |
|  Default: | `'default'`             |

> [!TIP]
> Use `'kubbV4'` when migrating an existing project to avoid renaming all generated files at once. You can switch to `'default'` incrementally once your codebase is ready.
