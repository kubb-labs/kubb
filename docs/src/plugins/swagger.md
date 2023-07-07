---
layout: doc

title: \@kubb/swagger
outline: deep
---

# @kubb/swagger

With the Swagger plugin you can create JSON schema's out of a Swagger file. 
Inside this package you can also use some utils to create your own Swagger plugin. 
We already provide a [react-query plugin](/plugins/swagger-tanstack-query) but if you want to create a plugin for SWR you can use this package to get the core utils.(check if a schema is v2 or v3, validate the schema, generate a OAS object, ...).

<hr/>

We are using [Oas](https://github.com/readmeio/oas) to convert a YAML/JSON to an Oas class(see `oasParser`) that will contain a lot of extra logic(read the $ref, get all the operations, get all models, ...).

The Swagger plugin also contains some classes and functions that can be used in your own plugin that needs Swagger:
- For example we have [`getReference`](https://github.com/kubb-project/kubb/blob/main/packages/swagger/src/utils/getReference.ts
) that will return the ref based on the spec. 

- Next to that we also have the class [`OperationGenerator`](https://github.com/kubb-project/kubb/blob/main/packages/swagger/src/generators/OperationGenerator.ts
). This class contains the building blocks of getting the request, response, params, .... 
<br/>Just call `this.getSchemas` and you will retreive an object contains all the info you need to setup a TypeScript type, React-Query hook, ....

## Installation

::: code-group

```shell [pnpm]
pnpm add @kubb/swagger
```

```shell [npm]
npm install @kubb/swagger
```

```shell [yarn]
yarn add @kubb/swagger
```

:::


## Options
### validate
Validate your input(see kubb.config) based on @apidevtools/swagger-parser

Type: `boolean` <br/>
Default: `true`


### output
Relative path to save the JSON models.
False will not generate the schema JSON's.

Type: `string | false` <br/>
Default: `"schemas"`

### serverIndex
Which server to use from the array of `servers.url[serverIndex]`

For example `0` will return `http://petstore.swagger.io/api` and `1` will return `http://localhost:3000`

```yaml
openapi: 3.0.3
info:
  title: Swagger Example
  description: 
  license:
    name: Apache 2.0
    url: http://www.apache.org/licenses/LICENSE-2.0.html
  version: 1.0.0
servers:
- url: http://petstore.swagger.io/api
- url: http://localhost:3000
```
Type: `string | false` <br/>
Default: `0`


## Depended

- [`@kubb/core`](/plugins/core)

## Links

- [Oas](https://github.com/readmeio/oas)