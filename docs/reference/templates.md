---
layout: doc

title: Templates
outline: deep
---

# Templates

::: tip
You need version `2.x.x` or higher to use templates.
:::

## What are templates?

With templates you can easily override/change the generated output of a specific plugin. Let's say you want to use `fetch` instead of `axios`, instead of forking the `@kubb/swagger-client` you can use templates. <br/>

In the background templates will use `React/JSX` as the template engine. See [@kubb/react](/plugins/react/) to find out which intern components and hooks we provide.

## How to use templates?

See [examples/client](/examples/client).

## How does it work?

For example the following code will create a file `helloWorld.ts` inside the `./src` folder(the [FileManager](/reference/fileManager) will handle the creation of this file).<br/><br/>
Next to that we have an import(see [File.Import](/plugins/react/file#file-import)) that will add an import statement to the generated file.<br/><br/>
At this moment the file will only contain the import statement. To add some code we will use [File.Source](/plugins/react/file#file-source) to export a const called helloWorld.

<hr/>

All of this is handeld by `@kubb/react`, see `root.render` where we render the template and also provide some extra meta(that will be used by the hooks we provide). As an user of templates you don't need to do anything, this is all handeld by the `OperationGenerator` of the specific plugin you use.

::: code-group

```typescript [input]
<File
  baseName="helloWorld.ts"
  path="./src/helloWorld.ts"
  meta={{}}
>
  <File.Import name="axios" path="axios" />
  <File.Source>
    export const helloWorld = true;
  </File.Source>
</File>
```

```typescript [src/helloWorld.ts]
import axios from 'axios'

export const helloWorld = true
```

:::
