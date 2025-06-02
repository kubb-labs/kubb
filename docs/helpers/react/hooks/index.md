---
layout: doc

title: \@kubb/react
outline: deep
---

# Hooks

Some hooks that can be used with `@kubb/react`.


## useLifecycle

`useLifecycle` will return some helpers to exit/restart the generation.


```tsx
import { useLifecycle } from '@kubb/react'

function Component() {
  const { exit } = useLifecycle()

  return null
}
```


## useApp

`useApp` will return the current App with plugin, pluginManager, fileManager, mode, ...


```tsx
import { useApp } from '@kubb/react'

function Component() {
  const { pluginManager, plugin, mode, exit, getFile, fileManager} = useApp()

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
