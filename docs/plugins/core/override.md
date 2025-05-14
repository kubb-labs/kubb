Array containing override parameters to override `options` based on tags/operations/methods/paths.

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
