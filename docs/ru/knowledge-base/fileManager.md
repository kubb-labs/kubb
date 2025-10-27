---
layout: doc

title: FileManager
outline: deep
---

# FileManager <a href="/plugins/core"><Badge type="info" text="@kubb/core" /></a>

Экземпляр `FileManager` содержит строительные блоки для записи файлов, комбинирования исключений или включений, создания barrel-файлов.

> [!TIP]
> То, что было записано, управляется [PluginManager](/ru/knowledge-base/pluginManager/). `FileManager` не знает, что было обработано, а что нет.

### fileManager.files

Массив файлов, которые были добавлены в экземпляр `FileManager`.

- **Тип:** `Array<KubbFile.File>` <br/>

### fileManager.isExecuting

Проверить, записывает ли экземпляр файл или есть ли элементы в очереди.

- **Тип:** `boolean` <br/>

### fileManager.add

Добавить файл в экземпляр, если `id` не добавлен, он создаст ID на основе `crypto.randomUUID()`.<br/>

При создании нового экземпляра вы можете установить `task`, который будет использоваться в очереди в качестве исполнителя.<br/>

Здесь мы также проверим, существует ли файл, и если да, мы добавим его (объединив импорты, экспорты и источник). Вы можете отключить это поведение, установив `override` в объекте файла (`KubbFile.File`).

> [!TIP]
> `name` будет добавлено, это основано на baseName, но без расширения.


- **Тип:** `(...files: Array<KubbFile.File>): Promise<Array<KubbFile.File>>` <br/>

### fileManager.addIndexes

Добавить файлы `index.ts`, мы используем `BarrelManager` для создания всех необходимых индексных файлов для дерева папок (на основе вывода). `BarrelManager` пройдет через структуру папок (на основе вывода) и создаст индексный файл для каждой папки.

> [!TIP]
> Установив `output.exportType` в `false`, вы можете отключить создание barrel-файлов.


- **Тип:** `(AddIndexesProps): Promise<Array<KubbFile.File> | undefined>)` <br/>

### fileManager.write

Записать файл с проверкой очереди, чтобы убедиться, что никакие другие файлы не записываются. Вы можете установить тайм-аут между записью файлов с помощью `timeout` при создании экземпляра.

- **Тип:** `(...params: Parameters<typeof Read>): Promise<string>` <br/>

### fileManager.read

Прочитать файл.

- **Тип:** `(...params: Parameters<typeof write>): Promise<string | undefined>` <br/>
