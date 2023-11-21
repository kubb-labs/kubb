---
layout: doc

title: \@kubb/react
outline: deep
---

# Hooks

Some hooks that can be used with `@kubb/react`.

## useMeta

`useMeta` will return an object containing the meta that has been provided with the `root.render` functionality.

::: code-group

```typescript
import { useMeta } from '@kubb/react'
import type { KubbPlugin } from '@kubb/core'

type Meta = {
  plugin: KubbPlugin
}

function Component() {
  const meta = useMeta<Meta>()

  return null
}
```

:::

## usePluginManager

`usePluginManager` will return the PluginManager instance.

::: code-group

```typescript
import { usePluginManager } from '@kubb/react'

function Component() {
  const pluginManager = usePluginManager()

  return null
}
```

:::

## usePlugin

`usePlugin` will return the current plugin.

::: code-group

```typescript
import { usePlugin } from '@kubb/react'

function Component() {
  const plugin = usePlugin()

  return null
}
```

:::

## useFileManager

`useFileManager` will return the current FileManager instance.

::: code-group

```typescript
import { useFileManager } from '@kubb/react'

function Component() {
  const fileManager = useFileManager()

  return null
}
```

:::

## usePackageVersion

With `usePackageVersion` you can validate of a specific package is set in the `package.json`.

::: code-group

```typescript
import { usePackageVersion } from '@kubb/react'

function Component() {
  const isValid = usePackageVersion({
    dependency: 'typescript',
    version: '^5.0.0',
  })

  return null
}
```

:::

## useFile

With `useFile` you can get all props needed to create a file(path, baseName, source).

::: code-group

```typescript
import { useFile } from '@kubb/react'

function Component() {
  const pluginName = 'custom-plugin'
  const file = useFile({
    name: 'fileName' // no extension needed
    pluginKey: ["controller", pluginName],
    options: {}
  })

  return (
   <File
      baseName={file.baseName}
      path={file.path}
      meta={file.meta}
    >
      <File.Source>
        export const helloWorld = true;
      </File.Source>
    </File>
  )
}
```

:::
