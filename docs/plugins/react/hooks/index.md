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

## useLanguage

`useLanguage` will return the current language set by the parent `Editor` component.

::: code-group

```typescript
import { useLanguage } from '@kubb/react'

function Component() {
  const language = useLanguage()

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
import { File, useFile } from '@kubb/react'

function Component() {
  const pluginName = 'custom-plugin'
  const file = useFile({
    name: 'fileName' // no extension needed
    pluginKey: [pluginName],
    options: {
      tag: "pet"
    }
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

## useResolvePath

Resolve a path based on what has been set inside the `resolvePath` of a specific plugin. Use `pluginKey` to retreive the path of that specific plugin.

```typescript [props]
type Props = {
  pluginKey?: [pluginName: string; identifier: number]
  baseName: string
  directory?: string | undefined
  options?: {}
}
```

::: code-group

```typescript [Component.tsx]
import { useResolvePath } from '@kubb/react'

function Component() {
  const pluginName = 'custom-plugin'
  const path = useResolvePath({
    pluginKey: [pluginName],
    baseName: 'test.ts',
    options: {
      tag: 'pet',
    },
  })
  // path will be `{{root}}/{{output.path}}/test.ts`

  return null
}
```

```typescript [plugin.ts]
import path from 'node:path'
import { FileManager, createPlugin } from '@kubb/core'
import type { PluginOptions } from './types.ts'
import { pascalCase } from 'change-case'

export const definePlugin = createPlugin<PluginOptions>((options) => {
  const { output } = options

  return {
    name: 'custom-plugin',
    resolvePath(fileName, directory, options) {
      const root = path.resolve(this.config.root, this.config.output.path)

      return path.resolve(root, output.path, fileName)
    },
  }
})
```

:::

## useResolveName

Resolve a name based on what has been set inside the `resolveName` of a specific plugin. Use `pluginKey` to retreive the name of that specific plugin.

```typescript [props]
type Props = {
  name: string
  pluginKey?: KubbPlugin['key']
  /**
   * `file` will be used to customize the name of the created file(use of camelCase)
   * `function` can be used used to customize the exported functions(use of camelCase)
   * `type` is a special type for TypeScript(use of PascalCase)
   */
  type?: 'file' | 'function' | 'type'
}
```

::: code-group

```typescript [Component.tsx]
import { useResolveName } from '@kubb/react'

function Component() {
  const pluginName = 'custom-plugin'
  const name = useResolveName({
    pluginKey: [pluginName],
    name: 'pet',
    type: 'file',
  })
  // name will be `Pet`

  return null
}
```

```typescript [plugin.ts]
import { FileManager, createPlugin } from '@kubb/core'
import type { PluginOptions } from './types.ts'
import { pascalCase } from 'change-case'

export const definePlugin = createPlugin<PluginOptions>((options) => {
  const {} = options

  return {
    name: 'custom-plugin',
    resolveName(name) {
      return pascalCase(name)
    },
  }
})
```

:::
