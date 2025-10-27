Массив, содержащий параметры include для включения тегов/операций/методов/путей.

|           |                  |
|----------:|:-----------------|
|     Type: | `Array<Include>` |
| Required: | `false`          |

```typescript [Include]
export type Include = {
  type: 'tag' | 'operationId' | 'path' | 'method' | 'contentType'
  pattern: string | RegExp
}
```


