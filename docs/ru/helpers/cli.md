---
layout: doc

title: \@kubb/cli
outline: deep
---

# @kubb/cli

Kubb CLI позволяет генерировать файлы на основе конфигурационного файла `kubb.config.ts`.
При запуске Kubb отображает прогресс выполнения плагинов, записи файлов и результаты каждого хука после завершения процесса генерации.

![React-DevTools](/screenshots/cli.gif)

## Установка

::: code-group
```shell [bun]
bun add -d @kubb/cli
```

```shell [pnpm]
pnpm add -D @kubb/cli
```

```shell [npm]
npm install --save-dev @kubb/cli
```

```shell [yarn]
yarn add -D @kubb/cli
```
:::

## Использование

```shell [node]
kubb --config kubb.config.js
```

```mdx
USAGE kubb generate

COMMANDS
  generate    [input] Генерирует файлы на основе файла 'kubb.config.ts'
  validate    Проверяет Swagger/OpenAPI файл
  mcp         Запускает сервер для взаимодействия MCP клиента с LLM.

Используйте kubb <command> --help для получения дополнительной информации о команде.
```

## `kubb generate`
Генерирует файлы на основе файла `kubb.config.ts`

> [!TIP]
> `kubb generate` и `kubb` вызывают одну и ту же функциональность генерации.

```mdx
USAGE kubb generate [OPTIONS]

OPTIONS

                        -c, --config    Путь к конфигурационному файлу Kubb
  -l, --logLevel=<silent|info|debug>    Info, silent или debug
                         -w, --watch    Режим отслеживания изменений на основе входного файла
                         -d, --debug    Переопределяет logLevel на debug
                          -h, --help    Показать справку
```

Путь к входному файлу (переопределяет указанный в `kubb.config.js`)

```shell [node]
kubb petStore.yaml
```

### Опции

#### --config (-c)

Путь к конфигурационному файлу Kubb.

```shell [node]
kubb --config kubb.config.ts
```

#### --log-level (-l)
- `silent` Подавляет все сообщения в логе, предупреждения и ошибки, минимизируя вывод в консоль.
- `info` Выводит все предупреждения, ошибки и информационные сообщения.
- `debug` Показывает все сообщения из `info` и все детали о том, что выполняется.

```shell [node]
kubb --log-level info
```

#### --debug
> [!TIP]
> Режим отладки создаст 2 лог-файла:
> - `.kubb/kubb-DATE_STRING.log`
> - `.kubb/kubb-files.log`


Псевдоним для `kubb generate --log-level debug`
```shell [node]
kubb --debug
```

#### --watch (-w)

Режим отслеживания изменений на основе входного файла.
```shell [node]
kubb --watch
```

#### --version (-v)

Выводит номер версии.

```shell [node]
kubb --version
```

#### --help (-h)
Отображает справку.

```shell [node]
kubb --help
```

## `kubb validate`
Команда проверяет синтаксис и структурные ошибки в вашем Swagger/OpenAPI файле и предоставляет понятную обратную связь (ошибки/предупреждения).

Полезно для CI pipeline, pre-commit хуков и получения ранней обратной связи в процессе разработки

> [!IMPORTANT]
> Необходимо установить `@kubb/oas`


> [!TIP]
> Под капотом мы используем `oas-normalize` для проверки вашего Swagger/OpenAPI файла.

```mdx
USAGE kubb validate [OPTIONS]

OPTIONS

  -i, --input    Путь к Swagger/OpenAPI файлу
   -h, --help    Показать справку
```

### Опции

#### --input (-i)

Путь к вашему Swagger/OpenAPI файлу
```shell [node]
kubb generate --input
```

## `kubb mcp`
Запускает MCP сервер для совместной работы Kubb с LLM, таким как Claude.

> [!IMPORTANT]
> Необходимо установить `@kubb/mcp`
