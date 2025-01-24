Path to the client import path that will be used to do the API calls.<br/>
It will be used as `import client from '${client.importPath}'`.<br/>
It allows both relative and absolute path but be aware that we will not change the path.

> [!TIP]
> Use of default exports as `export const client = ()=>{}`

|           |                                |
|----------:|:-------------------------------|
|     Type: | `string`                       |
| Required: | `false`                         |
|  Default: | `'@kubb/plugin-client/clients/axios'` |
