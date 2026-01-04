Array containing include parameters to include tags/operations/methods/paths.

|           |                  |
|----------:|:-----------------|
|     Type: | `Array<Include>` |
| Required: | `false`          |

```typescript twoslash [Include]
export type Include = {
  type: 'tag' | 'operationId' | 'path' | 'method' | 'contentType'
  pattern: string | RegExp
}
```


