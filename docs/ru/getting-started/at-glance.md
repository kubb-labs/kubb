---
layout: doc

title: Краткий обзор
outline: deep
---

# Краткий обзор
Kubb — это библиотека и инструментарий, который преобразует вашу спецификацию [Swagger/OpenAPI](/ru/knowledge-base/oas) в различные клиентские библиотеки, включая:
- [TypeScript](/ru/plugins/plugin-ts/)
- [React-Query](/ru/plugins/plugin-react-query/)
- [Vue-Query](/ru/plugins/plugin-vue-query/)
- [Solid-Query](/ru/plugins/plugin-solid-query/)
- [Svelte-Query](/ru/plugins/plugin-svelte-query/)
- [Zod](/ru/plugins/plugin-zod/) `поддержка v4`
- [Faker.js](/ru/plugins/plugin-faker/)
- [Axios](/ru/plugins/plugin-client/)
- [Redoc](/ru/plugins/plugin-redoc/)
- [MCP](https://modelcontextprotocol.io/)
- и многое другое...

Кроме того, Kubb имеет систему плагинов, которая позволяет вам создавать собственные реализации и интегрировать другие библиотеки.

<iframe src="https://github.com/sponsors/stijnvanhulle/button" title="Sponsor stijnvanhulle" height="32" width="114" style="border: 0; border-radius: 6px;"></iframe>

## Возможности
- работает с Node.js 20+
- поддержка Swagger 2.0, OpenAPI 3.0 и OpenAPI 3.1
- экосистема плагинов Kubb для расширения функциональности за пределы стандартных плагинов
- поддержка CLI с прогресс-баром и логами
- инструменты отладки с [React DevTools](/ru/knowledge-base/debugging)
- генерация barrel файлов (index.ts)
- и многое другое...

## Философия

Представьте, что ваша команда бэкенда пишет API на Java/Kotlin. Как вы подключите свой фронтенд к их системе без необходимости общаться по поводу каждого изменения API?
Это не новая проблема, и она уже решена с помощью спецификации Swagger/OpenAPI в сочетании с <a href="https://tools.openapis.org/categories/code-generators.html">генератором кода</a>. Эта концепция называется [contract-first development](https://medium.com/@dxloop/contract-first-approach-with-node-js-and-openapi-for-rest-services-d2283a7ffd9d), и один из наших участников написал замечательную статью, демонстрирующую варианты использования Kubb.

Проблема в том, что большинство генераторов хороши в одном: генерации TypeScript типов или генерации React-Query хуков.
Kubb пытается решить эту проблему с помощью системы плагинов, где мы уже предоставляем вам несколько плагинов, а также даем возможность создать [свой собственный плагин](/ru/knowledge-base/plugins/).

## Спонсорство
Kubb — это открытый исходный код, созданный сообществом. Помогите нам в разработке Kubb, [став спонсором](https://github.com/sponsors/stijnvanhulle).

## Наше сообщество
Присоединяйтесь к нам в [Discord](https://discord.gg/shfBFeczrm)!

Мы всегда рады любому вкладу в проект.
