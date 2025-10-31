Массив, содержащий параметры override для переопределения `options` на основе тегов/операций/методов/путей.

|           |                   |
|----------:|:------------------|
|     Type: | `Array<Override>` |
| Required: | `false`           |


```typescript [Override]
export type Override = {
  type: 'tag' | 'operationId' | 'path' | 'method' | 'contentType'
  pattern: string | RegExp
  options: PluginOptions
}
```
