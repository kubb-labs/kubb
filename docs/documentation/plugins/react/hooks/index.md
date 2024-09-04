---
layout: doc

title: \@kubb/react
outline: deep
---

# Hooks

Some hooks that can be used with `@kubb/react`.


## useParser

`useParser` will return the current language set by the parent `Parser` component.

```tsx
import { useParser } from '@kubb/react'

function Component() {
  const parser = useParser()

  return null
}
```

## useApp

`useApp` will return the current App with plugin, pluginManager, fileManager and mode.


```tsx
import { useApp } from '@kubb/react'

function Component() {
  const { pluginManager, plugin, mode, fileManager} = useApp()

  return null
}
```

## useFile

With `useFile` you can get the context of the current file(basePath, name, ...)

```tsx
import { File, useFile } from '@kubb/react'

function Component() {
  const pluginName = 'custom-plugin'
  const file = useFile()

  return file.baseName
}
```
