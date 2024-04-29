---
layout: doc

title: \@kubb/react
outline: deep
---

# Hooks

Some hooks that can be used with `@kubb/react`.


## useEditor

`useEditor` will return the current language set by the parent `Editor` component.

```tsx twoslash
import { useEditor } from '@kubb/react'

function Component() {
  const editor = useEditor()

  return null
}
```

## useApp

`useApp` will return the current App with plugin, pluginManager, fileManager and mode.


```tsx twoslash
import { useApp } from '@kubb/react'

function Component() {
  const { pluginManager, plugin, mode, fileManager} = useApp()

  return null
}
```

## useFile

With `useFile` you can get the context of the current file(basePath, name, ...)

```tsx twoslash
import { File, useFile } from '@kubb/react'

function Component() {
  const pluginName = 'custom-plugin'
  const file = useFile()

  return file.baseName
}
```
