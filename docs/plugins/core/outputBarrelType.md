Specify what to export and optionally disable barrel file generation.

> [!TIP]
> Using propagate will prevent a plugin from creating a barrel file, but it will still propagate, allowing [`output.barrelType`](/getting-started/configure#output-barreltype) to export the specific function or type.

|           |                                            |
| --------: | :----------------------------------------- |
|     Type: | `'all' \| 'named' \| 'propagate' \| false` |
| Required: | `false`                                    |
|  Default: | `'named'`                                  |

::: code-group

```typescript [all]
export * from "./gen/petService.ts";
```

```typescript [named]
export { PetService } from "./gen/petService.ts";
```

```typescript [propagate]

```

```typescript [false]

```

:::
