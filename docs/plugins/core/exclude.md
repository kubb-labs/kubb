Array containing exclude parameters to exclude or skip tags, operations, methods, paths, or content types.

|           |                  |
|----------:|:-----------------|
|     Type: | `Array<Exclude>` |
| Required: | `false`          |

```typescript [Exclude]
export type Exclude = {
  type: 'tag' | 'operationId' | 'path' | 'method' | 'contentType'
  pattern: string | RegExp
}
```

