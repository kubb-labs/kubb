Array containing exclude parameters to exclude/skip tags/operations/methods/paths.

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

