---
layout: doc

title: Benefits of using JSX for templates
outline: deep
---

Published: 2023-12-08

# Benefits of using JSX for templates

Since v2, `Kubb` has been starting to use JSX templates to create its generated code. Previously, we used template strings which became harder to maintain due to increasing complexity.

This made us wonder if it was possible to use React and JSX to create our templates.

## Concepts

### What is a template engine?

A template engine is a software program designed to combine templates with a data model to produce a document or output. The language used to write these templates is called a template language. The resulting document can be a web page, a document, or even source code. One specific use case for template engines is source code generation.

Some well known template engines are [Mustache](https://mustache.github.io/), [Handlebars](https://handlebarsjs.com/), and [EJS](https://ejs.co/). To create JavaScript/ you can also use the [TypesScript compiler API](https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API) to create JavaScript/TypeScript and the OpenAPI TypeScript generator uses [Handlebars](https://handlebarsjs.com/).

### What is source code generation?

Source code generation is a technique used in programming where code is automatically generated based on a set of pre-defined rules or templates. This technique can save developers time and effort by automating repetitive tasks and reducing the likelihood of errors. Code generation can be used for a variety of purposes, including creating boilerplate code, generating code from models, and producing code for specific platforms or frameworks. Many commonly used tools, such as graphql, OpenAPI, and gRPC, use code generation under the hood.

## The search for kubb's search engine

### TypeScript compiler

We've looked into [TypesScript compiler API](https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API), but it has a steep learning curve and it does not fit our needs.<br/>

### Ink

Our search brought us to the project named [Ink](https://github.com/vadimdemedes/ink) which is a CLI tool that uses React/JSX as its template engine. The project's bio says the following:

> React for CLIs. Build and test your CLI output using components.

```typescript
import React, { useState, useEffect } from 'react'
import { render, Text } from 'ink'

const Counter = () => {
  const [counter, setCounter] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCounter(previousCounter => previousCounter + 1)
    }, 100)

    return () => {
      clearInterval(timer)
    }
  }, [])

  return <Text color="green">{counter} tests passed</Text>
}

render(<Counter />)
```

<img src="https://raw.githubusercontent.com/vadimdemedes/ink/master/media/demo.svg" width="600"/>
<br/>
After some digging around in their code we came up with a solution that would benefit Kubb.

We can use JSX as the template engine and provide some hooks that could be used to access some `Kubb` specific behavior. <br/>

The hooks will allow the engine to use the `PluginManager` instance or access the `FileManager` for example. When using the `@kubb/swagger` plugin, we could also provide hooks that would return the current operation/path/oas instance. <br/>
We saw a lot of opportunities in this approach, so we started with a small POC for one of our plugins. As of today(december 2023), we are using JSX templates in all our plugins.

## Examples

### @kubb/swagger-client

Below you can find an example of our previous templates. The code is not easy to read. An improvement could be to split the code up, but this will have to be paired with prop drilling, which is something we wish to avoid.<br/>

```typescript
const code = `
export function ${name} <${generics.join(', ')}>(${params}): Promise<TData> {
  return client<${clientGenerics.join(', ')}>({
    method: "${method}",
    url: ${url},
    ${schemas.queryParams?.name ? 'params,' : ''}
    ${schemas.request?.name ? 'data,' : ''}
    ${schemas.headerParams?.name ? 'headers: { ...headers, ...options.headers },' : ''}
    ...options
  });
};
`
```

With the React/JSX example, we could use `context` and define some options in the root.
If you compare the previous template with an example using JSX/React, you can already see it's easier to read. Adding if structures will also be easier with the JSX syntax:

`{ shouldBeTrue === true ? <Function/> : undefined }`.

```typescript
<Function name={name} async export generics={generics} returnType={returnType} params={params} JSDoc={JSDoc}>
  {`
  return client<${clientGenerics.join(', ')}>({
    method: "${method}",
    url: ${url},
    ${schemas.queryParams?.name ? 'params,' : ''}
    ${schemas.request?.name ? 'data,' : ''}
    ${schemas.headerParams?.name ? 'headers: { ...headers, ...options.headers },' : ''}
    ...options
  })`}
</Function>
```

## Overriding with templates

We've made a guide on how you can override templates in our plugins: [templates the guide](/guide/tutorial/templates).
