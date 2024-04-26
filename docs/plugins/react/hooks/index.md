---
layout: doc

title: \@kubb/react
outline: deep
---

# Hooks

Some hooks that can be used with `@kubb/react`.


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

## useApp

`useApp` will return the current App with plugin, pluginManager, fileManager and mode.

::: code-group

```typescript
import { useApp } from '@kubb/react'

function Component() {
  const { pluginManager, plugin, mode, fileManager} = useApp()

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

With `useFile` you can get the context of the current file(basePath, name, ...)

::: code-group

```typescript
import { File, useFile } from '@kubb/react'

function Component() {
  const pluginName = 'custom-plugin'
  const file = useFile()

  return file.baseName
}
```
