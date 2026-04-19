Specify the property to group files by. Required when `group` is defined.

|           |         |
| --------: | :------ |
|     Type: | `'tag'` |
| Required: | `true*` |

> [!NOTE]
> `Required: true*` means this is required only when the `group` option is used. The `group` option itself is optional.

- `'tag'`: Uses the first tag from `operation.getTags().at(0)?.name`
