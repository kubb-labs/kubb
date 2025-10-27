---
layout: doc

title: PluginManager
outline: deep
---

# PluginManager <Badge type="info" text="@kubb/core" />

Экземпляр `PluginManager` содержит строительные блоки для выполнения плагинов (в определенном порядке). Он включает систему очередей, `FileManager`, `resolvePath`, который будет использоваться для получения пути, необходимого для плагина x, а также `resolveName` для получения имени, которое может использоваться для функции/файла/типа.

> [!TIP]
> Здесь мы также создаем основной плагин со ссылкой (см. `this.`) на `PluginManager`.

### pluginManager.plugins

Массив плагинов с включенными хуками [жизненного цикла](/ru/knowledge-base/pluginManager/lifecycle). Это также добавляет основной плагин. За кулисами мы также преобразуем проп API из функции в объект.

- **Тип:** `KubbPluginWithLifeCycle` <br/>

### pluginManager.fileManager

Экземпляр [FileManager](/ru/knowledge-base/fileManager).

- **Тип:** `FileManager` <br/>

### pluginManager.events

`PluginManager` запускает некоторые события, когда плагин будет выполнен (`execute`), когда плагин был выполнен (`executed`) и когда что-то пошло не так (`error`).

```typescript [Events]
type Events = {
  execute: [executer: Executer]
  executed: [executer: Executer]
  error: [error: Error]
}
```

- **Тип:** `Events` <br/>

### pluginManager.queue

Экземпляр очереди.

- **Тип:** `Queue` <br/>

### pluginManager.config

Конфигурация, которая была установлена в `kubb.config.ts`.

- **Тип:** `KubbConfig` <br/>

### pluginManager.executed

Массив всех выполненных плагинов.

- **Тип:** `Array<Executer>` <br/>

### pluginManager.logger

Экземпляр логгера.

- **Тип:** `Logger` <br/>

### pluginManager.resolvePath

Каждый плагин может установить `resolvePath`, и когда вы затем вызываете `pluginManager.resolvePath`, он попытается найти первый resolvePath (на основе массива плагинов) и использовать это возвращаемое значение в качестве пути.<br/>

Также можно установить `pluginKey` в качестве опции. Если это так, он попытается найти плагин с этим `pluginKey` и использовать возвращаемое значение этого конкретного плагина в качестве пути.

- **Тип:** `(params: ResolvePathParams): KubbFile.OptionalPath` <br/>

### pluginManager.resolveName

Каждый плагин может установить `resolveName`, и когда вы затем вызываете `pluginManager.resolveName`, он попытается найти первый resolveName (на основе массива плагинов) и использовать это возвращаемое значение в качестве имени (функция, файл или тип).<br/>

Также можно установить `pluginKey` в качестве опции. Если это так, он попытается найти плагин с этим `pluginKey` и использовать возвращаемое значение этого конкретного плагина в качестве имени.

- **Тип:** `(params: ResolveNameParams): string` <br/>

### pluginManager.on

Вместо вызова `pluginManager.events.on` вы можете использовать `pluginManager.on`. У этого также лучше типы.

- **Тип:** `(eventName: keyof Events, handler: (...eventArg: any) => void` <br/>

### pluginManager.hookForPlugin

Запустить определенный hookName для плагина x.

### pluginManager.hookForPluginSync

Запустить определенный hookName для плагина x.

### pluginManager.hookFirst

Первый ненулевой результат останавливается и вернет свое значение.

### pluginManager.hookFirstSync

Первый ненулевой результат останавливается и вернет свое значение.

### pluginManager.hookParallel

Запустить все плагины параллельно (порядок будет основан на `this.plugin` и если установлены `pre` или `post`).

### pluginManager.hookReduceArg0

Связать все плагины, `reduce` может быть передан для обработки каждого возвращаемого значения. Возвращаемое значение первого плагина будет использоваться в качестве первого параметра для следующего плагина.

### pluginManager.hookParallel

Запустить все плагины последовательно (порядок будет основан на `this.plugin` и если установлены `pre` или `post`).
