---
layout: doc

title: Benefits of using JSX for templates
outline: deep
---

Published: 2023-12-08

# Benefits of using JSX for templates

Since v2 `Kubb` has been starting to use JSX templates to create its generated code. Before we used template string but that was not always easy when you had a couple of if statements(not easy to read/understand) and it was also becoming harder to maintain.

Because of that we explored if it was possible to use JSX and React to create our generated code. As a front-end developer we use React on a daily base and to use JSX as a template engine would be really nice.

But to get into details, you need to understand some basic concepts.

## What is template engine?

A template engine is a software program designed to combine templates with a data model(props) to produce a document or output. The language used to write these templates is called a template language. The resulting document can be a web page, a document, or even source code. One specific use case for template engines is source code generation.

## What is source code generation?

Source code generation is a technique used in programming where code is automatically generated based on a set of pre-defined rules or templates. This technique can save developers time and effort by automating repetitive tasks and reducing the likelihood of errors. Code generation can be used for a variety of purposes, including creating boilerplate code, generating code from models, and producing code for specific platforms or frameworks. Many commonly used tools, such as graphql, OpenAPI and gRPC, use code generation under the hood.

## Template engines as of today.

::: tip
For example, the OpenAPI TypeScript generator uses [Handlebars](https://handlebarsjs.com/).
:::

Today there are a couple of template engines that exists like [Mustache](https://mustache.github.io/), [Handlebars](https://handlebarsjs.com/) and [EJS](https://ejs.co/). Next to that you can also use the [TypesScript compiler API](https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API) to create JavaScript/TypeScript.

### Rapini

An example of this is [rapini](https://github.com/rametta/rapini/blob/main/src/react-query/generator.ts).

```typescript
function makeImportAxiosInstanceTypeDeclaration() {
  return ts.factory.createImportDeclaration(
    /*modifiers*/ undefined,
    /*importClause*/ ts.factory.createImportClause(
      /*isTypeOnly*/ true,
      /*name*/ undefined,
      /*namedBindings*/ ts.factory.createNamedImports([
        ts.factory.createImportSpecifier(
          /*isTypeOnly*/ false,
          /*propertyName*/ undefined,
          /*name*/ ts.factory.createIdentifier('AxiosInstance'),
        ),
        ts.factory.createImportSpecifier(
          /*isTypeOnly*/ false,
          /*propertyName*/ undefined,
          /*name*/ ts.factory.createIdentifier('AxiosRequestConfig'),
        ),
      ]),
    ),
    /*moduleSpecifier*/ ts.factory.createStringLiteral('axios'),
    /*assertClause*/ undefined,
  )
}
```

### TypeScript compiler

The [TypesScript compiler API](https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API) is really nice and powerful to use but not easy to setup. This has a hard learning curve and would not fit our needs. <br/>

### Ink

Then we found [Ink](https://github.com/vadimdemedes/ink) which is a CLI tool that uses React/JSX as their template engine. As of how they describe it:

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

We can use JSX as the template engine and provide some hooks that could be used to access some `Kubb` specific behaviour. <br/>

Getting the `PluginManager` instance or access to the `FileManager` for example. And when using the `@kubb/swagger` plugin, we could also provide some hooks that would return the current operation/path/oas instance. <br/>
So a lot of things that are possible so we started with a small POC for one of our plugins and as of today(dec 2023), we are using templates in all our plugins.

## Examples

### @kubb/swagger-client

This is what we had before with template strings and the issue here is already that it's not easy to read. One way of making this better could be to split up every part but then you are losing the simplicity and also you need to 'prop drill'.<br/>

With the React/JSX example we could use `context` and define some options in the root.

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

If you then compare this with an example with JSX/React, you can already see it's easier to read and adding if structures will also be easier with the JSX syntax:

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

At this stage we only did the refactor for the function logic and keeping the template string for the client logic.

## Overriding with templates

We have made a guide in how you can override templates in one of our plugins: [templates the guide](/guide/tutorial/templates).
