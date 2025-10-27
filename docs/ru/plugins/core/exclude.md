Массив, содержащий параметры exclude для исключения/пропуска тегов/операций/методов/путей.

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

