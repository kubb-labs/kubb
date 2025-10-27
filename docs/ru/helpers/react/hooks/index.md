---
layout: doc

title: \@kubb/react
outline: deep
---

# Hooks

некоторые хуки, которые можно использовать с `@kubb/react`.


## useLifecycle

`useLifecycle` вернет некоторые вспомогательные функции для выхода/перезапуска генерации.


```tsx
import { useLifecycle } from '@kubb/react'

function Component() {
  const { exit } = useLifecycle()

  return null
}
```


## useApp

`useApp` вернет текущее приложение с plugin, pluginManager, fileManager, mode, ...


```tsx
import { useApp } from '@kubb/react'

function Component() {
  const { pluginManager, plugin, mode, exit, getFile, fileManager} = useApp()

  return null
}
```

## useFile

с помощью `useFile` вы можете получить контекст текущего файла (basePath, name, ...)

```tsx
import { File, useFile } from '@kubb/react'

function Component() {
  const pluginName = 'custom-plugin'
  const file = useFile()

  return file.baseName
}
```
