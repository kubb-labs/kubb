Specify whether to use function-based or class-based clients.

|           |                         |
| --------: | :---------------------- |
|     Type: | `'function' \| 'class'` |
| Required: | `false`                 |
|  Default: | `'function'`            |

::: warning
This plugin is only compatible with `clientType: 'function'` (the default). If `clientType: 'class'` is detected, the plugin will automatically generate its own inline function-based client instead of importing from `@kubb/plugin-client`.
:::
